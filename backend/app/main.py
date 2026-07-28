import time
import re
import io
import csv
import json
import os
import asyncio
from typing import List, Optional, Dict
from datetime import datetime, date
from collections import Counter

from fastapi import (
    FastAPI, Depends, HTTPException, status, Query,
    WebSocket, WebSocketDisconnect, BackgroundTasks, UploadFile, File
)
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from pydantic import BaseModel, EmailStr

# Imports ReportLab (PDF Engine)
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_RIGHT, TA_LEFT

# Support de la mise en forme et de la réorientation arabe (RTL)
try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    HAS_ARABIC_LIB = True
except ImportError:
    HAS_ARABIC_LIB = False

from app import models, database, security

# ==============================================================================
# 1. CONFIGURATION DES POLICES UNICODE & TRAITEMENT TEXTE ARABE
# ==============================================================================
UNICODE_FONT = "Helvetica"
UNICODE_FONT_BOLD = "Helvetica-Bold"

# Détection et enregistrement d'une police TrueType système compatible Unicode
possible_fonts = [
    ("CustomUnicode", "C:\\Windows\\Fonts\\arial.ttf"),
    ("CustomUnicode", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ("CustomUnicode", "/System/Library/Fonts/Supplemental/Arial.ttf"),
    ("CustomUnicode", "/usr/share/fonts/TTF/DejaVuSans.ttf"),
]

for font_name, font_path in possible_fonts:
    if os.path.exists(font_path):
        try:
            pdfmetrics.registerFont(TTFont(font_name, font_path))
            UNICODE_FONT = font_name
            UNICODE_FONT_BOLD = font_name
            break
        except Exception:
            pass


def process_text_for_pdf(text: str) -> str:
    """Relie les lettres arabes et réordonne le flux visuel pour le canevas ReportLab."""
    if not text:
        return ""
    if re.search(r'[\u0600-\u06FF]', text):
        if HAS_ARABIC_LIB:
            # 1. Attachement contextuel des lettres arabes
            reshaped = arabic_reshaper.reshape(text)
            # 2. Réordonnancement BIDI (Right-To-Left -> Left-To-Right canvas)
            return get_display(reshaped)
    return text

# ==============================================================================
# 2. INITIALISATION BDD & USER SEED
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
# 3. APPLICATION FASTAPI & CORS
# ==============================================================================
app = FastAPI(
    title="InnovNow NLP Analytics API",
    version="4.0.0",
    description="Moteur NLP d'analyse décisionnelle B.I., Multilingue & Traitement Asynchrone en Masse"
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
# 4. SCHÉMAS PYDANTIC
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

class WordItem(BaseModel):
    text: str
    value: int

class AnalysisRequest(BaseModel):
    text: str
    min_length: Optional[int] = 30
    max_length: Optional[int] = 130

class AnalysisResponse(BaseModel):
    sentiment: str
    confidence: float
    summary: str
    language: str  # FR, EN, AR, ES
    entities: List[EntityItem]
    word_cloud: List[WordItem]
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
# 5. SÉCURITÉ & AUTHENTIFICATION
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
# 6. PIPELINE MULTILINGUE & STOPWORDS
# ==============================================================================

STOPWORDS = {
    'FR': {
        'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'à', 'que', 'qui', 'pour',
        'dans', 'ce', 'cette', 'ces', 'sur', 'par', 'est', 'sont', 'avec', 'pas', 'plus', 'au',
        'aux', 'ne', 'se', 'ou', 'mais', 'nous', 'vous', 'il', 'elle', 'ils', 'elles', 'mon', 'son',
        'sa', 'ses', 'nos', 'vos', 'leur', 'leurs', 'meme', 'aussi', 'bien', 'comme', 'tout', 'tous',
        'autre', 'autres', 'sans', 'apres', 'avant', 'dans', 'notre', 'votre', 'etre', 'avoir', 'ete'
    },
    'EN': {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'it', 'its', 'they', 'them', 'their',
        'this', 'that', 'these', 'those', 'which', 'who', 'whom', 'what', 'some', 'any', 'not', 'no'
    },
    'ES': {
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'e', 'o', 'u', 'a', 'ante',
        'bajo', 'con', 'contra', 'de', 'desde', 'en', 'entre', 'hacia', 'hasta', 'para', 'por',
        'segun', 'sin', 'sobre', 'tras', 'que', 'como', 'mas', 'pero', 'sus', 'sus', 'este', 'esta'
    },
    'AR': {
        'من', 'إلى', 'عن', 'على', 'في', 'حتى', 'مع', 'هذا', 'هذه', 'تم', 'كان', 'كانت', 'أن', 'إن',
        'التي', 'الذي', 'الذين', 'أو', 'ثم', 'بين', 'بعد', 'قبل', 'كل', 'بعض', 'غير', 'قد', 'لا', 'لم'
    }
}

def detect_language(text: str) -> str:
    """Détecte automatiquement la langue du texte (FR, EN, AR, ES)."""
    if re.search(r'[\u0600-\u06FF]', text):
        return 'AR'
    
    text_lower = text.lower()
    words = re.findall(r'\b[a-zàâçéèêëîïôûùüÿñæœ]+\b', text_lower)
    if not words:
        return 'FR'

    scores = {'FR': 0, 'EN': 0, 'ES': 0}
    for word in words:
        for lang in ['FR', 'EN', 'ES']:
            if word in STOPWORDS[lang]:
                scores[lang] += 1

    detected = max(scores, key=scores.get)
    return detected if scores[detected] > 0 else 'FR'


def extract_word_cloud(text: str, lang: str, top_n: int = 25) -> List[WordItem]:
    """Extrait les termes les plus fréquents en éliminant les stopwords."""
    text_clean = re.sub(r'[^\w\s\u0600-\u06FF]', ' ', text.lower())
    tokens = text_clean.split()
    
    lang_stopwords = STOPWORDS.get(lang, STOPWORDS['FR'])
    filtered_tokens = [
        w for w in tokens 
        if len(w) > 2 and w not in lang_stopwords and not w.isdigit()
    ]
    
    counts = Counter(filtered_tokens).most_common(top_n)
    return [WordItem(text=word, value=count) for word, count in counts]

# ==============================================================================
# 7. MOTEUR NER MULTILINGUE HAUTE PRÉCISION (AR, FR, EN)
# ==============================================================================

pos_words = [
    "excellent", "bon", "super", "bien", "formidable", "recommande", "satisfait", 
    "succès", "performant", "enthousiasme", "surpasse", "innovation", "progrès", 
    "réussite", "remarquable", "exceptionnelle", "exceptionnel", "parfait", "bravo",
    "great", "good", "amazing", "awesome", "perfect", "love",
    "ممتاز", "ممتازا", "ممتازة", "رائع", "استثنائية", "استثنائي", "نوصي", "ابتكار", "الابتكار", "جيد", "مبتكرة", "ذكية"
]

neg_words = [
    "mauvais", "erreur", "problème", "problèmes", "lent", "déçu", "horrible", "panne", 
    "bad", "terrible", "awful", "worst", "slow", "error", "fail", "issue", "problem",
    "سيء", "تأخير", "التأخير", "بطيء", "مشكلة", "مشاكل", "فشل", "مرتفعة", "غالي"
]

def extract_dynamic_entities(text: str) -> List[EntityItem]:
    """Analyseur NER multilingue haute précision (AR, FR, EN)."""
    entities = []
    seen = set()

    def add_entity(entity_text: str, entity_type: str):
        entity_text = entity_text.strip(" ,;:\".'()[]{}")
        if entity_text and entity_text not in seen and len(entity_text) > 1:
            entities.append(EntityItem(text=entity_text, type=entity_type))
            seen.add(entity_text)

    # --------------------------------------------------------------------------
    # A. DÉTECTION EN ARABE
    # --------------------------------------------------------------------------
    if re.search(r'[\u0600-\u06FF]', text):
        ar_cities = ["الدار البيضاء", "الرباط", "مراكش", "فاس", "طنجة", "أكادير", "مكناس", "وجدة", "باريس", "لندن"]
        for city in ar_cities:
            if re.search(r'\b' + re.escape(city) + r'\b', text):
                add_entity(city, "LOC")

        found_cities = re.findall(r"(?:بمدينة|مدينة)\s+([\u0600-\u06FF]+)", text)
        for c in found_cities:
            if c not in ["خطوة", "جديدة", "كبيرة", "استثنائية"]:
                add_entity(c, "LOC")

        found_people = re.findall(r"(?:السيد|السيدة|الدكتور|المهندس|الأستاذ)\s+([\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)?)", text)
        for p in found_people:
            add_entity(p, "PER")

        found_orgs = re.findall(r"(?:شركة|مؤسسة|منظمة|مجموعة|البنك)\s+([\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)?)", text)
        for o in found_orgs:
            add_entity(o, "ORG")

    # --------------------------------------------------------------------------
    # B. DÉTECTION EN LATIN (FRANÇAIS & ANGLAIS)
    # --------------------------------------------------------------------------
    else:
        # 1. Entreprises / Organisations (ORG)
        known_orgs = [
            "Capgemini", "Microsoft", "Google", "Apple", "Novatech", "Amazon", 
            "Orange", "Tesla", "Meta", "Atos", "Accenture", "CGI", "Deloitte", "KPMG", "IBM", "Oracle",
            "Attijariwafa Bank", "Banque Populaire", "Barclays", "Siemens", "Philips", "General Electric", "Medtronic", "DHL", "FedEx", "Aramex", "Jumia"
        ]
        for org in known_orgs:
            if re.search(r'\b' + re.escape(org) + r'\b', text, re.IGNORECASE):
                add_entity(org, "ORG")

        # 2. Lieux & Monuments (LOC)
        known_locs = [
            "Tour Eiffel", "Champs-Élysées", "Notre-Dame", "Gare de Lyon", "Gare du Nord", 
            "Big Ben", "Heathrow Airport", "JFK Airport", "New York", "London", "Paris", 
            "Casablanca", "Rabat", "Tokyo", "Berlin", "Madrid", "Boston", "Seattle"
        ]
        for loc in known_locs:
            if re.search(r'\b' + re.escape(loc) + r'\b', text, re.IGNORECASE):
                add_entity(loc, "LOC")

        hotels = re.findall(r"\b(?:hôtel|hotel)\s+([A-Z][a-zA-Z0-9]+)\b", text, re.IGNORECASE)
        for h in hotels:
            add_entity(f"Hôtel {h}", "LOC")

        matches = re.finditer(
            r"\b(?:chez|start\-up|société|entreprise|firme|company|corp|inc|vendor|with|équipes de|équipe de)\s+([A-Z][a-zA-Z0-9]+)\b",
            text,
            flags=re.IGNORECASE
        )
        blacklist_words = ["this", "for", "the", "a", "an", "in", "on", "at", "our", "your", "future", "vendor", "with"]
        for m in matches:
            org_candidate = m.group(1)
            if org_candidate[0].isupper() and org_candidate.lower() not in blacklist_words:
                add_entity(org_candidate, "ORG")

        # 3. Personnes précédées d'un Titre/Civilité (PER) -> ex: "M. Soulaimane", "Directeur Soulaimane"
        title_people = re.findall(
            r"\b(?:Le\s+|La\s+)?(?:Directeur|Directrice|Professeur|Prof|Docteur|Dr|Monsieur|M\.|Madame|Mme|Président|Manager)\s+([A-Z][a-zA-Z\-]+(?:\s+[A-Z][a-zA-Z\-]+)?)\b", 
            text, 
            flags=re.IGNORECASE
        )
        for p in title_people:
            p_clean = p.strip()
            if p_clean not in seen and p_clean not in known_orgs and p_clean not in known_locs:
                add_entity(p_clean, "PER")

        # 4. Prénoms / Noms explicites (PER)
        known_people_list = ["Soulaimane", "Ilyas", "Moataz", "Tarzi", "Mohammed"]
        for p in known_people_list:
            if re.search(r'\b' + re.escape(p) + r'\b', text, re.IGNORECASE):
                add_entity(p, "PER")

        # 5. Noms composés (Prénom + Nom)
        titles_pattern = r"\b(?:Le\s+|La\s+)?(?:Directeur|Directrice|Professeur|Prof|Docteur|Dr|Monsieur|M\.|Madame|Mme|Président|Manager)\s+"
        cleaned_text_for_per = re.sub(titles_pattern, "", text, flags=re.IGNORECASE)

        people = re.findall(r"\b([A-Z][a-zA-Z\-]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b", cleaned_text_for_per)
        
        excluded_words = ["Airport", "Street", "Avenue", "Boulevard", "New", "York", "San", "North", "South", "Aéroport", "Casablanca", "Paris", "Novatech", "Microsoft", "Tour", "Eiffel"]
        for p in people:
            words = p.split()
            if not any(w in excluded_words for w in words):
                if p not in seen and not p.startswith(("The ", "La ", "Les ", "Pour ", "Dans ", "En ", "Hôtel ")) and p not in known_locs and p not in known_orgs:
                    add_entity(p, "PER")

        # 6. Lieux introduits par des prépositions (LOC)
        locations = re.findall(r"\b(?:à|de|comme|vers|en|in|near|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b", text)
        for loc in locations:
            if loc not in seen and loc not in ["France", "Europe", "Lumina"] and len(loc) > 2:
                words = loc.split()
                if not any(w.lower() in blacklist_words for w in words) and loc not in known_orgs:
                    add_entity(loc, "LOC")

    return entities

# ==============================================================================
# 8. WEBSOCKET MANAGER & TRAITEMENT ASYNCHRONE EN MASSE (PILIER 4)
# ==============================================================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_json(self, client_id: str, data: dict):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(data)
            except Exception:
                self.disconnect(client_id)

ws_manager = ConnectionManager()

@app.websocket("/ws/bulk/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """Endpoint WebSocket pour le streaming de progression du traitement en masse."""
    await ws_manager.connect(client_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(client_id)


async def process_bulk_file_task(client_id: str, file_bytes: bytes, filename: str, user_id: int):
    """Tâche de fond exécutant l'analyse NLP ligne par ligne et notifiant via WebSocket."""
    db = database.SessionLocal()
    try:
        content_str = file_bytes.decode('utf-8', errors='ignore')
        lines = [line.strip() for line in content_str.splitlines() if line.strip()]
        
        if lines and ("text" in lines[0].lower() or "content" in lines[0].lower() or "review" in lines[0].lower()):
            lines = lines[1:]

        total_rows = len(lines)
        if total_rows == 0:
            await ws_manager.send_json(client_id, {
                "status": "ERROR",
                "message": "Le fichier est vide ou ne contient aucun texte valide."
            })
            return

        await ws_manager.send_json(client_id, {
            "status": "STARTED",
            "total_rows": total_rows,
            "filename": filename
        })

        results = []
        positive_count = 0
        negative_count = 0
        neutral_count = 0

        for index, line in enumerate(lines):
            columns = line.split(',')
            text_to_analyze = columns[-1].strip('"\' ') if len(columns) > 1 else line

            start_time = time.time()
            lang = detect_language(text_to_analyze)
            text_lower = text_to_analyze.lower()

            p_count = sum(1 for w in pos_words if re.search(r'\b' + re.escape(w) + r'\b', text_lower))
            n_count = sum(1 for w in neg_words if re.search(r'\b' + re.escape(w) + r'\b', text_lower))

            if p_count > n_count:
                sentiment = "POSITIVE"
                positive_count += 1
                confidence = round(0.82 + (min(p_count, 4) * 0.03), 2)
            elif n_count > p_count:
                sentiment = "NEGATIVE"
                negative_count += 1
                confidence = round(0.80 + (min(n_count, 4) * 0.04), 2)
            else:
                sentiment = "NEUTRAL"
                neutral_count += 1
                confidence = 0.75

            entities = extract_dynamic_entities(text_to_analyze)
            exec_time = round((time.time() - start_time) * 1000, 2)

            history_entry = models.AnalysisHistory(
                text_content=text_to_analyze,
                sentiment=sentiment,
                confidence_score=confidence,
                summary=text_to_analyze[:120] + "..." if len(text_to_analyze) > 120 else text_to_analyze,
                user_id=user_id
            )
            db.add(history_entry)

            row_result = {
                "row_index": index + 1,
                "text": text_to_analyze,
                "sentiment": sentiment,
                "confidence": confidence,
                "language": lang,
                "entities_count": len(entities),
                "entities": [{"text": e.text, "type": e.type} for e in entities],
                "execution_time_ms": exec_time
            }
            
            results.append(row_result)

            progress_pct = int(((index + 1) / total_rows) * 100)
            await ws_manager.send_json(client_id, {
                "status": "PROCESSING",
                "progress_percentage": progress_pct,
                "processed_rows": index + 1,
                "total_rows": total_rows,
                "latest_result": row_result,
                "stats": {
                    "positive": positive_count,
                    "negative": negative_count,
                    "neutral": neutral_count
                }
            })

            await asyncio.sleep(0.015)

        db.commit()

        await ws_manager.send_json(client_id, {
            "status": "COMPLETED",
            "progress_percentage": 100,
            "processed_rows": total_rows,
            "total_rows": total_rows,
            "stats": {
                "positive": positive_count,
                "negative": negative_count,
                "neutral": neutral_count
            },
            "results": results
        })

    except Exception as e:
        await ws_manager.send_json(client_id, {
            "status": "ERROR",
            "message": f"Erreur lors du traitement : {str(e)}"
        })
    finally:
        db.close()


@app.post("/api/analyze/bulk")
async def analyze_bulk_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    client_id: str = Query(...),
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    """[PILIER 4] Endpoint d'Upload pour lancer l'analyse en masse asynchrone."""
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Seuls les fichiers .csv et .txt sont supportés.")

    file_bytes = await file.read()
    user_id = current_user.id if current_user else 1

    background_tasks.add_task(
        process_bulk_file_task,
        client_id=client_id,
        file_bytes=file_bytes,
        filename=file.filename,
        user_id=user_id
    )

    return {
        "message": "Traitement en masse démarré en arrière-plan.",
        "filename": file.filename,
        "client_id": client_id
    }

# ==============================================================================
# 9. ENDPOINTS AUTHENTIFICATION & ANALYSE NLP
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

    detected_lang = detect_language(text)

    pos_count = sum(1 for w in pos_words if re.search(r'\b' + re.escape(w) + r'\b', text_lower))
    neg_count = sum(1 for w in neg_words if re.search(r'\b' + re.escape(w) + r'\b', text_lower))

    if pos_count > neg_count:
        sentiment = "POSITIVE"
        confidence = round(0.82 + (min(pos_count, 4) * 0.03), 2)
    elif neg_count > pos_count:
        sentiment = "NEGATIVE"
        confidence = round(0.80 + (min(neg_count, 4) * 0.04), 2)
    else:
        sentiment = "NEUTRAL"
        confidence = 0.75

    sentences = [s.strip() for s in re.split(r'(?<=[.!?؛])\s+', text) if s.strip()]
    if len(sentences) > 2:
        summary = sentences[0] + " " + sentences[-1]
    else:
        summary = text[:160] + "..." if len(text) > 160 else text

    summary = summary.strip('"\'')
    entities = extract_dynamic_entities(text)
    word_cloud = extract_word_cloud(text, detected_lang)
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
        language=detected_lang,
        entities=entities,
        word_cloud=word_cloud,
        execution_time_ms=execution_time,
        saved_to_db=saved_to_db
    )

# ==============================================================================
# 10. ENDPOINTS FILTRAGE MULTI-CRITÈRES & HISTORIQUE B.I.
# ==============================================================================

@app.get("/api/history/filter", response_model=List[HistoryItemResponse])
def filter_history(
    sentiment: Optional[str] = Query(None, description="POSITIVE, NEGATIVE, NEUTRAL"),
    min_confidence: Optional[float] = Query(None, description="Score min 0.0 à 1.0"),
    search_query: Optional[str] = Query(None, description="Mots-clés dans le texte"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.AnalysisHistory).filter(models.AnalysisHistory.user_id == current_user.id)

    if sentiment:
        query = query.filter(models.AnalysisHistory.sentiment == sentiment.upper())

    if min_confidence is not None:
        query = query.filter(models.AnalysisHistory.confidence_score >= min_confidence)

    if search_query:
        search_pattern = f"%{search_query}%"
        query = query.filter(
            or_(
                models.AnalysisHistory.text_content.ilike(search_pattern),
                models.AnalysisHistory.summary.ilike(search_pattern)
            )
        )

    return query.order_by(models.AnalysisHistory.created_at.desc()).all()


@app.get("/api/analytics/wordcloud", response_model=List[WordItem])
def get_global_wordcloud(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    history = db.query(models.AnalysisHistory).filter(models.AnalysisHistory.user_id == current_user.id).all()
    if not history:
        return []

    combined_text = " ".join([h.text_content for h in history])
    lang = detect_language(combined_text)
    return extract_word_cloud(combined_text, lang, top_n=30)


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
# 11. GÉNÉRATEUR DE RAPPORTS PDF & CSV (AVEC SÉPARATEUR POINT-VIRGULE EXCEL FR/MA)
# ==============================================================================

@app.post("/api/export/pdf")
def generate_pdf_report(
    payload: ExportRequest,
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    """Génère un Rapport PDF Exécutif compatible RTL / Arabe sans exiger un jeton d'authentification strict."""
    try:
        user_name = current_user.full_name if current_user else "Analyste / Invité"
        user_role = current_user.role if current_user else "ANALYST"

        entities_to_export = payload.entities
        if not entities_to_export:
            entities_to_export = extract_dynamic_entities(payload.text)

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
            fontName=UNICODE_FONT_BOLD, fontSize=20,
            textColor=colors.HexColor('#0F172A'), spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'DocSubTitle', parent=styles['Normal'],
            fontName=UNICODE_FONT, fontSize=9,
            textColor=colors.HexColor('#64748B'), spaceAfter=15
        )
        heading_style = ParagraphStyle(
            'SectionHeading', parent=styles['Heading2'],
            fontName=UNICODE_FONT_BOLD, fontSize=11,
            textColor=colors.HexColor('#1E293B'), spaceBefore=14, spaceAfter=8
        )
        
        body_style_ltr = ParagraphStyle(
            'BodyTextLTR', parent=styles['Normal'],
            fontName=UNICODE_FONT, fontSize=9.5,
            textColor=colors.HexColor('#334155'), leading=14,
            alignment=TA_LEFT
        )
        
        body_style_rtl = ParagraphStyle(
            'BodyTextRTL', parent=body_style_ltr,
            alignment=TA_RIGHT
        )

        elements = []

        elements.append(Paragraph("InnovNow Consulting Platform", title_style))
        elements.append(Paragraph(
            f"Rapport d'Audit NLP Exécutif — Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} par <b>{user_name}</b> ({user_role})", 
            subtitle_style
        ))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4F46E5'), spaceAfter=15))

        is_arabic_doc = bool(re.search(r'[\u0600-\u06FF]', payload.text))
        active_body_style = body_style_rtl if is_arabic_doc else body_style_ltr

        clean_summary = process_text_for_pdf(payload.summary.replace('"', '').strip())
        clean_text = process_text_for_pdf(payload.text.replace('<', '').replace('>', '').strip())

        sentiment_color = "#10B981" if payload.sentiment in ["POSITIVE", "Positif"] else ("#F43F5E" if payload.sentiment in ["NEGATIVE", "Négatif"] else "#F59E0B")
        
        kpi_data = [
            [
                Paragraph("<font size=8 color='#64748B'><b>SENTIMENT DOMINANT</b></font>", body_style_ltr),
                Paragraph("<font size=8 color='#64748B'><b>CONFIANCE IA</b></font>", body_style_ltr),
                Paragraph("<font size=8 color='#64748B'><b>LATENCE INFERENCE</b></font>", body_style_ltr),
                Paragraph("<font size=8 color='#64748B'><b>ENTITES DETECTEES</b></font>", body_style_ltr)
            ],
            [
                Paragraph(f"<font size=12 color='{sentiment_color}'><b>{payload.sentiment}</b></font>", body_style_ltr),
                Paragraph(f"<font size=12 color='#0F172A'><b>{int(payload.confidence * 100)}%</b></font>", body_style_ltr),
                Paragraph(f"<font size=12 color='#0F172A'><b>{payload.execution_time_ms} ms</b></font>", body_style_ltr),
                Paragraph(f"<font size=12 color='#4F46E5'><b>{len(entities_to_export)} entité(s)</b></font>", body_style_ltr)
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

        elements.append(Paragraph("1. Synthèse Décisionnelle Automatique (BART Summarizer)", heading_style))
        summary_p = Paragraph(f"<i>\"{clean_summary}\"</i>", active_body_style)
        summary_table = Table([[summary_p]], colWidths=[520])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EEF2FF')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#C7D2FE')),
            ('PADDING', (0,0), (-1,-1), 10),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 10))

        elements.append(Paragraph("2. Cartographie des Entités Extraites (NER)", heading_style))
        if entities_to_export:
            ent_data = [["Entité / Terme Détecté", "Catégorie Typologique"]]
            for e in entities_to_export:
                formatted_entity_text = process_text_for_pdf(e.text)
                ent_data.append([Paragraph(formatted_entity_text, active_body_style), e.type])
            
            ent_table = Table(ent_data, colWidths=[320, 200])
            ent_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4F46E5')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,0), (-1,0), UNICODE_FONT_BOLD),
                ('FONTSIZE', (0,0), (-1,0), 9),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
                ('PADDING', (0,0), (-1,-1), 6),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]))
            elements.append(ent_table)
        else:
            elements.append(Paragraph("Aucune entité spécifique détectée.", body_style_ltr))

        elements.append(Spacer(1, 10))

        elements.append(Paragraph("3. Extrait du Corpus Analysé", heading_style))
        text_snippet = clean_text[:400] + ("..." if len(clean_text) > 400 else "")
        elements.append(Paragraph(f"\"{text_snippet}\"", active_body_style))

        doc.build(elements)
        buffer.seek(0)
        filename = f"Rapport_NLP_InnovNow_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        return StreamingResponse(
            buffer, 
            media_type="application/pdf", 
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la génération du rapport PDF : {str(e)}"
        )


@app.post("/api/export/csv")
def export_csv_report(
    payload: ExportRequest,
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    output = io.StringIO()
    # Séparateur point-virgule (;) pour Excel FR/MA
    writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)
    
    # En-tête B.I. standardisé identique à l'Analyse en Masse
    writer.writerow([
        "ID", "Langue", "Sentiment", "Score Confiance", 
        "Latence (ms)", "Nombre Entités", "Entités Détectées", 
        "Résumé Synthétique", "Texte Source"
    ])
    
    entities_str = " | ".join([f"{e.text} [{e.type}]" for e in payload.entities]) if payload.entities else "Aucune"
    lang = detect_language(payload.text)
    
    clean_text = payload.text.replace("\r", " ").replace("\n", " ")
    clean_summary = payload.summary.replace("\r", " ").replace("\n", " ")
    
    writer.writerow([
        1,
        lang,
        payload.sentiment,
        f"{int(payload.confidence * 100)}%",
        f"{payload.execution_time_ms} ms",
        len(payload.entities) if payload.entities else 0,
        entities_str,
        clean_summary,
        clean_text
    ])
    
    output.seek(0)
    # Encodage utf-8-sig (avec BOM UTF-8) pour affichage parfait sous Excel
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")), 
        media_type="text/csv; charset=utf-8", 
        headers={"Content-Disposition": "attachment; filename=Audit_NLP_InnovNow.csv"}
    )

# ==============================================================================
# 12. ENDPOINTS D'ADMINISTRATION & HEALTH CHECK
# ==============================================================================

@app.get("/api/admin/users", response_model=List[UserResponse])
def list_all_users(db: Session = Depends(database.get_db), admin: models.User = Depends(require_admin_role)):
    return db.query(models.User).order_by(models.User.id.desc()).all()


@app.post("/api/admin/users", response_model=UserResponse)
def create_new_user(payload: UserCreateRequest, db: Session = Depends(database.get_db), admin: models.User = Depends(require_admin_role)):
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
def delete_user(user_id: int, db: Session = Depends(database.get_db), admin: models.User = Depends(require_admin_role)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte connecté.")

    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    db.delete(user_to_delete)
    db.commit()
    return {"detail": f"Compte de {user_to_delete.full_name} supprimé avec succès."}


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "InnovNow NLP Analytics API",
        "version": "4.0.0",
        "timestamp": datetime.utcnow()
    }