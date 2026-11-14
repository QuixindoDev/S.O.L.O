"""
Configuração do Banco de Dados SQLAlchemy - Field Shift
Suporta PostgreSQL/PostGIS e SQLite como fallback leve.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from src.infrastructure.outbound.persistence.models import Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./field_shift.db")

# Ajuste para SQLite se for o caso
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Cria as tabelas no banco de dados se não existirem."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Gerador de sessão do SQLAlchemy para injeção de dependência."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
