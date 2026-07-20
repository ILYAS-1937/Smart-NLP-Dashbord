import time
from transformers import pipeline

class NLPEngine:
    def __init__(self):
        print("⚡ Chargement des modèles NLP Transformers en mémoire...")
        
        # 1. Sentiment Analysis
        self.sentiment_pipeline = pipeline(
            "sentiment-analysis", 
            model="distilbert-base-uncased-finetuned-sst-2-english"
        )
        
        # 2. Summarization (Résumé)
        self.summarizer_pipeline = pipeline(
            "summarization", 
            model="sshleifer/distilbart-cnn-12-6"
        )
        
        # 3. Named Entity Recognition (NER)
        self.ner_pipeline = pipeline(
            "ner", 
            model="dslim/bert-base-NER", 
            aggregation_strategy="simple"
        )
        print("✅ Modèles NLP prêts et opérationnels.")

    def analyze(self, text: str) -> dict:
        start_time = time.time()
        
        # --- 1. Sentiment ---
        raw_sentiment = self.sentiment_pipeline(text[:512])[0]
        label_map = {"POSITIVE": "Positif", "NEGATIVE": "Négatif"}
        sentiment_label = label_map.get(raw_sentiment["label"], "Neutre")
        sentiment_score = round(float(raw_sentiment["score"]) * 100, 2)
        
        # --- 2. Résumé ---
        words_count = len(text.split())
        if words_count > 30:
            summary_raw = self.summarizer_pipeline(
                text, 
                max_length=min(130, max(30, words_count)), 
                min_length=10, 
                do_sample=False
            )
            summary_text = summary_raw[0]["summary_text"]
        else:
            summary_text = text

        # --- 3. NER (Extraction d'Entités) ---
        raw_ner = self.ner_pipeline(text[:512])
        entities = []
        for item in raw_ner:
            # Extraction sécurisée de la clé entity_group ou entity
            group = item.get("entity_group") or item.get("entity") or "MISC"
            word = str(item.get("word", "")).strip()
            score = round(float(item.get("score", 0.0)), 2)
            
            if word:
                entities.append({
                    "word": word,
                    "entity_group": group,
                    "score": score
                })

        execution_time = round((time.time() - start_time) * 1000, 2)

        return {
            "sentiment": {
                "label": sentiment_label,
                "score": sentiment_score
            },
            "summary": summary_text,
            "entities": entities,
            "execution_time_ms": execution_time
        }

# Instance unique du Moteur NLP
nlp_engine = NLPEngine()