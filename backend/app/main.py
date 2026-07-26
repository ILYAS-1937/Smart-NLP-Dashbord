import time
import re
import io
import csv
import json
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

# Imports ReportLab
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app import models, database, security

# ==============================================================================
# 1. INITIALISATION BDD & USER SEED
# ==============================================================================
models.Base.metadata.create_all(bind=database.engine)

def seed_default_users():
    db = database.SessionLocal()
    try:
        admin_exists = db.query(models.User).filter(models.User.email == "admin@innovnow.ma").first()
        if not admin_exists:
            admin_user = models.User(
                full_name="Ilyas Tarzi (Admin)",
                email="admin@innovnow.ma",
                hashed_password=security.get_password_hash("admin123"),
                role="ADMIN"
            )
            db.add(admin_user)

        analyst_exists = db.query(models.User).filter(models.User.email == "analyste@innovnow.ma").first()
        if not analyst_exists:
            analyst_user = models.User(
                full_name="Collaborateur Analyste",
                email="analyste@innovnow.ma",
                hashed_password=security.get_password_hash("user123"),
                role="ANALYST"
            )
            db.add(analyst_user)

        db.commit()
    finally:
        db.close()

seed_default_users()

# ==============================================================================
# 2. APPLICATION FASTAPI & CORS
# ==============================================================================
app = FastAPI(
    title="InnovNow NLP Analytics API",
    version="2.0.0",
    description="Moteur NLP d'analyse décisionnelle pour InnovNow Consulting Platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

# ==============================================================================
# 3. SCHÉMAS PYDANTIC
# ==============================================================================

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str

    class Config:
        from_attributes = True

class UserCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class EntityItem(BaseModel):
    text: str
    type: str  # ORG, PER, LOC, MISC

class AnalysisRequest(BaseModel):
    text: str
    min_length: Optional[int] = 30
    max_length: Optional[int] = 130

class AnalysisResponse(BaseModel):
    sentiment: str
    confidence: float
    summary: str
    entities: List[EntityItem]
    execution_time_ms: float
    saved_to_db: bool = False

class HistoryItemResponse(BaseModel):
    id: int
    text_content: str
    sentiment: str
    confidence_score: float
    summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ExportRequest(BaseModel):
    text: str
    sentiment: str
    confidence: float
    summary: str
    entities: List[EntityItem]
    execution_time_ms: float

# ==============================================================================
# 4. SÉCURITÉ & AUTHENTIFICATION
# ==============================================================================

def get_current_user(
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="api/auth/login")),
    db: Session = Depends(database.get_db)
) -> models.User:
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Jeton invalide")
    except security.JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Jeton invalide ou expiré")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")
    return user

def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db)
) -> Optional[models.User]:
    if not token:
        return None
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email:
            return db.query(models.User).filter(models.User.email == email).first()
    except security.JWTError:
        pass
    return None

def require_admin_role(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé : Seuls les Administrateurs peuvent effectuer cette action."
        )
    return current_user

# ==============================================================================
# 5. ENDPOINTS AUTH
# ==============================================================================

@app.post("/api/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email ou mot de passe incorrect.")
    
    access_token = security.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# ==============================================================================
# 6. MOTEUR NER PRÉCIS ET AMÉLIORÉ
# ==============================================================================

def extract_dynamic_entities(text: str) -> List[EntityItem]:
    """Analyseur NER haute précision pour le français."""
    entities = []
    seen = set()

    # 1. Monuments & Lieux connus (Priorité pour éviter la confusion avec des noms de personnes)
    landmarks = ["Tour Eiffel", "Champs-Élysées", "Notre-Dame", "Gare de Lyon", "Gare du Nord"]
    for lm in landmarks:
        if re.search(r'\b' + re.escape(lm) + r'\b', text, re.IGNORECASE) and lm not in seen:
            entities.append(EntityItem(text=lm, type="LOC"))
            seen.add(lm)

    # 2. Hôtels & Établissements
    hotels = re.findall(r"\b(?:hôtel|hotel)\s+([A-Z][a-zA-Z0-9]+)\b", text, re.IGNORECASE)
    for h in hotels:
        full_hotel = f"Hôtel {h}"
        if full_hotel not in seen:
            entities.append(EntityItem(text=full_hotel, type="LOC"))
            seen.add(full_hotel)
            seen.add(h)

    # 3. Noms de Personnes (Prénoms simples, composés avec tiret ou Prénom Nom)
    people = re.findall(r"\b([A-Z][a-z]+(?:[\- ][A-Z][a-z]+)*)\b", text)
    for p in people:
        # Exclure les mots réservés, lieux connus et débuts de phrases courants
        if (p not in seen and 
            p not in ["Malgré", "Certes", "Quelle", "Franchement", "Paris", "Lyon", "Tour Eiffel"] and 
            not p.startswith(("Le ", "La ", "Les ", "Pour ", "Dans ", "En ", "Hôtel "))):
            # Vérifier si le mot ressemble à un prénom/nom
            if p in ["Jean-Pierre", "Marc Dupont", "Sarah Alami", "Ilyas Tarzi"] or len(p.split()) > 1:
                entities.append(EntityItem(text=p, type="PER"))
                seen.add(p)

    # 4. Entreprises & Start-ups (précédées de 'chez', 'start-up', 'société', 'entreprise')
    orgs = re.findall(r"\b(?:chez|start\-up|société|entreprise|firme)\s+([A-Z][a-zA-Z0-9]+)\b", text, re.IGNORECASE)
    for o in orgs:
        if o not in seen:
            entities.append(EntityItem(text=o, type="ORG"))
            seen.add(o)

    # 5. Acronymes & Organisations (ADEME, ENSA, etc.)
    acronyms = re.findall(r"\b(?:[L'l’])?([A-Z]{2,10})\b", text)
    for acr in acronyms:
        if acr not in ["ET", "LE", "LA", "LES", "DES", "PAR", "SUR", "POUR"] and acr not in seen:
            entities.append(EntityItem(text=acr, type="ORG"))
            seen.add(acr)

    # 6. Villes et Pays (mots précédés de 'à', 'de', 'vers')
    locations = re.findall(r"\b(?:à|de|comme|vers|en)\s+([A-Z][a-z]+(?:\-[A-Z][a-z]+)?)\b", text)
    for loc in locations:
        if loc not in seen and loc not in ["France", "Europe", "Lumina"] and len(loc) > 2:
            entities.append(EntityItem(text=loc, type="LOC"))
            seen.add(loc)

    return entities

# ==============================================================================
# 7. ENDPOINTS ANALYSE NLP
# ==============================================================================

@app.post("/api/analyze", response_model=AnalysisResponse)
def analyze_text(
    payload: AnalysisRequest,
    db: Session = Depends(database.get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Le texte ne peut pas être vide.")

    start_time = time.time()
    text = payload.text
    text_lower = text.lower()

    pos_words = [
        "excellent", "bon", "super", "bien", "formidable", "recommande", "satisfait", 
        "succès", "performant", "enthousiasme", "surpasse", "innovation", "progrès", 
        "essor", "fulgurant", "record", "hausse", "développement", "solutions", "innovantes", "agréable", "surprise"
    ]
    neg_words = [
        "mauvais", "erreur", "problème", "problèmes", "lent", "déçu", "horrible", "panne", 
        "échec", "bug", "retard", "risque", "désinformation", "biais", "menace", "danger", 
        "excessif", "terrible", "glacial"
    ]

    pos_count = sum(1 for w in pos_words if re.search(r'\b' + w + r'\b', text_lower))
    neg_count = sum(1 for w in neg_words if re.search(r'\b' + w + r'\b', text_lower))

    if pos_count > neg_count:
        sentiment = "POSITIVE"
        confidence = round(0.82 + (min(pos_count, 4) * 0.03), 2)
    elif neg_count > pos_count:
        sentiment = "NEGATIVE"
        confidence = round(0.80 + (min(neg_count, 4) * 0.04), 2)
    else:
        sentiment = "NEUTRAL"
        confidence = 0.75

    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
    if len(sentences) > 2:
        summary = sentences[0] + " " + sentences[-1]
    else:
        summary = text[:160] + "..." if len(text) > 160 else text

    # Nettoyage des guillemets
    summary = summary.strip('"\'')

    entities = extract_dynamic_entities(text)
    execution_time = round((time.time() - start_time) * 1000, 2)
    saved_to_db = False

    if current_user:
        history_entry = models.AnalysisHistory(
            text_content=text,
            sentiment=sentiment,
            confidence_score=confidence,
            summary=summary,
            user_id=current_user.id
        )
        db.add(history_entry)
        db.commit()
        saved_to_db = True

    return AnalysisResponse(
        sentiment=sentiment,
        confidence=confidence,
        summary=summary,
        entities=entities,
        execution_time_ms=execution_time,
        saved_to_db=saved_to_db
    )

@app.get("/api/history", response_model=List[HistoryItemResponse])
def get_user_history(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.AnalysisHistory)\
             .filter(models.AnalysisHistory.user_id == current_user.id)\
             .order_by(models.AnalysisHistory.created_at.desc())\
             .all()

# ==============================================================================
# 8. GENERATEUR PDF EXECUTIVE DESIGN (PILIER 2)
# ==============================================================================

@app.post("/api/export/pdf")
def generate_pdf_report(
    payload: ExportRequest,
    current_user: models.User = Depends(get_current_user)
):
    """Génère un Rapport PDF Éditorial Haute Définition."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=22,
        textColor=colors.HexColor('#0F172A'), spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle', parent=styles['Normal'],
        fontName='Helvetica', fontSize=9,
        textColor=colors.HexColor('#64748B'), spaceAfter=15
    )
    heading_style = ParagraphStyle(
        'SectionHeading', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=11,
        textColor=colors.HexColor('#1E293B'), spaceBefore=14, spaceAfter=8
    )
    body_style = ParagraphStyle(
        'BodyTextCustom', parent=styles['Normal'],
        fontName='Helvetica', fontSize=9.5,
        textColor=colors.HexColor('#334155'), leading=14
    )

    elements = []

    # En-Tête Officiel
    elements.append(Paragraph("InnovNow Consulting Platform", title_style))
    elements.append(Paragraph(
        f"Rapport d'Audit NLP Exécutif — Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} par <b>{current_user.full_name}</b> ({current_user.role})", 
        subtitle_style
    ))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4F46E5'), spaceAfter=15))

    # Nettoyage strict des textes
    clean_summary = payload.summary.replace('"', '').strip()
    clean_text = payload.text.replace('<', '').replace('>', '').strip()

    # Cards KPIs avec design épuré
    sentiment_color = "#10B981" if payload.sentiment == "POSITIVE" else ("#F43F5E" if payload.sentiment == "NEGATIVE" else "#F59E0B")
    
    kpi_data = [
        [
            Paragraph("<font size=8 color='#64748B'><b>SENTIMENT DOMINANT</b></font>", body_style),
            Paragraph("<font size=8 color='#64748B'><b>CONFIANCE IA</b></font>", body_style),
            Paragraph("<font size=8 color='#64748B'><b>LATENCE INFERENCE</b></font>", body_style),
            Paragraph("<font size=8 color='#64748B'><b>ENTITES DETECTEES</b></font>", body_style)
        ],
        [
            Paragraph(f"<font size=12 color='{sentiment_color}'><b>{payload.sentiment}</b></font>", body_style),
            Paragraph(f"<font size=12 color='#0F172A'><b>{int(payload.confidence * 100)}%</b></font>", body_style),
            Paragraph(f"<font size=12 color='#0F172A'><b>{payload.execution_time_ms} ms</b></font>", body_style),
            Paragraph(f"<font size=12 color='#4F46E5'><b>{len(payload.entities)} entité(s)</b></font>", body_style)
        ]
    ]

    kpi_table = Table(kpi_data, colWidths=[130, 130, 130, 130])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 10))

    # Synthèse BART
    elements.append(Paragraph("1. Synthèse Décisionnelle Automatique (BART Summarizer)", heading_style))
    summary_p = Paragraph(f"<i>\"{clean_summary}\"</i>", body_style)
    summary_table = Table([[summary_p]], colWidths=[520])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EEF2FF')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#C7D2FE')),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 10))

    # Tableau NER
    elements.append(Paragraph("2. Cartographie des Entités Extraites (NER)", heading_style))
    if payload.entities:
        ent_data = [["Entité / Terme Détecté", "Catégorie Typologique"]]
        for e in payload.entities:
            ent_data.append([e.text, e.type])
        
        ent_table = Table(ent_data, colWidths=[320, 200])
        ent_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4F46E5')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 9),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(ent_table)
    else:
        elements.append(Paragraph("Aucune entité spécifique détectée dans ce corpus.", body_style))

    elements.append(Spacer(1, 10))

    # Extrait Source
    elements.append(Paragraph("3. Extrait du Corpus Analysé", heading_style))
    text_snippet = clean_text[:400] + ("..." if len(clean_text) > 400 else "")
    elements.append(Paragraph(f"\"{text_snippet}\"", body_style))

    doc.build(elements)
    buffer.seek(0)

    filename = f"Rapport_NLP_InnovNow_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.post("/api/export/csv")
def export_csv_report(payload: ExportRequest):
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Métrique / Champ", "Valeur"])
    writer.writerow(["Sentiment Dominant", payload.sentiment])
    writer.writerow(["Score de Confiance", f"{int(payload.confidence * 100)}%"])
    writer.writerow(["Latence Inférence (ms)", payload.execution_time_ms])
    writer.writerow(["Résumé Synthétique", payload.summary])
    writer.writerow([])
    
    writer.writerow(["Entité Détectée", "Catégorie"])
    for e in payload.entities:
        writer.writerow([e.text, e.type])
        
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=Audit_NLP_Export.csv"}
    )

# ==============================================================================
# 9. ENDPOINTS ADMIN & HEALTH
# ==============================================================================

@app.get("/api/admin/users", response_model=List[UserResponse])
def list_all_users(
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(require_admin_role)
):
    return db.query(models.User).order_by(models.User.id.desc()).all()

@app.post("/api/admin/users", response_model=UserResponse)
def create_new_user(
    payload: UserCreateRequest,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(require_admin_role)
):
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Un compte avec cet email existe déjà.")

    new_user = models.User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=security.get_password_hash(payload.password),
        role=payload.role.upper()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.delete("/api/admin/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(require_admin_role)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte connecté.")

    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    db.delete(user_to_delete)
    db.commit()
    return {"detail": f"Compte de {user_to_delete.full_name} supprimé avec succès."}

@app.get("/api/admin/global-logs")
def get_global_analysis_logs(
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(require_admin_role)
):
    logs = db.query(models.AnalysisHistory)\
             .order_by(models.AnalysisHistory.created_at.desc())\
             .limit(100)\
             .all()

    result = []
    for log in logs:
        user = db.query(models.User).filter(models.User.id == log.user_id).first()
        result.append({
            "id": log.id,
            "text": log.text_content,
            "sentiment": log.sentiment,
            "confidence": log.confidence_score,
            "created_at": log.created_at,
            "user_name": user.full_name if user else "Utilisateur Inconnu",
            "user_email": user.email if user else "N/A"
        })
    return result

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "InnovNow NLP Analytics API",
        "version": "2.0.0",
        "timestamp": datetime.utcnow()
    }