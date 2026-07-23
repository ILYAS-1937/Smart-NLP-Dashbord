import io
import csv
import time
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.nlp_service import nlp_engine

app = FastAPI(
    title="smartNow NLP API",
    description="API Moteur d'Analyse Textuelle Haute Performance",
    version="1.0.0"
)

# Métriques globales en mémoire pour l'administration
ADMIN_METRICS = {
    "total_requests": 0,
    "total_execution_time_ms": 0.0,
    "active_model": "DistilBERT / BART / BERT-NER",
    "server_status": "Healthy",
}

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "API Moteur NLP opérationnelle"}

@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_text(payload: AnalyzeRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Le texte ne peut pas être vide.")
    try:
        start = time.time()
        res = nlp_engine.analyze(payload.text)
        
        # Mise à jour des métriques Admin
        ADMIN_METRICS["total_requests"] += 1
        ADMIN_METRICS["total_execution_time_ms"] += res["execution_time_ms"]
        
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur NLP: {str(e)}")

@app.post("/api/analyze-batch")
async def analyze_batch(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Format non supporté (.csv ou .txt).")
    
    contents = await file.read()
    text_data = contents.decode("utf-8", errors="ignore")
    
    lines = []
    if file.filename.endswith(".csv"):
        reader = csv.reader(io.StringIO(text_data))
        for row in reader:
            if row and row[0].strip():
                lines.append(row[0].strip())
    else:
        lines = [line.strip() for line in text_data.split("\n") if line.strip()]
    
    if not lines:
        raise HTTPException(status_code=400, detail="Fichier vide.")

    results = []
    for text in lines[:10]:
        res = nlp_engine.analyze(text)
        ADMIN_METRICS["total_requests"] += 1
        ADMIN_METRICS["total_execution_time_ms"] += res["execution_time_ms"]
        results.append({
            "source_text": text,
            "sentiment": res["sentiment"]["label"],
            "score": res["sentiment"]["score"],
            "summary": res["summary"],
            "entities_count": len(res["entities"])
        })
    
    return {
        "filename": file.filename,
        "total_processed": len(results),
        "results": results
    }

# 🚀 NOUVELLES ROUTES ADMIN
@app.get("/api/admin/metrics")
def get_admin_metrics():
    total_req = ADMIN_METRICS["total_requests"]
    avg_latency = (
        round(ADMIN_METRICS["total_execution_time_ms"] / total_req, 2)
        if total_req > 0
        else 0.0
    )
    return {
        "server_status": ADMIN_METRICS["server_status"],
        "total_requests": total_req,
        "avg_latency_ms": avg_latency,
        "active_model": ADMIN_METRICS["active_model"],
        "memory_usage_mb": 485.2, # Valeur estimée d'empreinte mémoire
    }

@app.post("/api/admin/switch-model")
def switch_nlp_model(model_name: str):
    ADMIN_METRICS["active_model"] = model_name
    return {"message": f"Modèle actif mis à jour avec succès : {model_name}"}