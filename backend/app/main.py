from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.nlp_service import nlp_engine

app = FastAPI(
    title="smartNow NLP API",
    description="API Moteur d'Analyse Textuelle Haute Performance pour le Dashboard Consulting",
    version="1.0.0"
)

# Configuration CORS pour autoriser le Frontend React (ports 3000 et 5173)
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
        raise HTTPException(status_code=400, detail="Le texte soumis ne peut pas être vide.")
    
    try:
        results = nlp_engine.analyze(payload.text)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur du moteur NLP: {str(e)}")