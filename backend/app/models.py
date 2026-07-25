from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # NOUVEAU : Rôle de l'utilisateur ("ADMIN" ou "ANALYST")
    role = Column(String(20), default="ANALYST", nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relation avec les analyses enregistrées
    analyses = relationship("AnalysisHistory", back_populates="owner")


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    text_content = Column(Text, nullable=False)
    sentiment = Column(String(50), nullable=False)
    confidence_score = Column(Float, nullable=False)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="analyses")