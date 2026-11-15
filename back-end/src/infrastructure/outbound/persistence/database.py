"""
Configuração do Banco de Dados SQLAlchemy - Field Shift
Suporta PostgreSQL/PostGIS e SQLite como fallback leve.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from src.infrastructure.outbound.persistence.models import Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./field_shift.db")

# Normalizar prefixos legados postgres:// -> postgresql:// para conformidade com SQLAlchemy 2.0+
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Ajuste específico para conexões multithreading em SQLite
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Cria as tabelas no banco de dados se não existirem e assegura compatibilidade de esquema."""
    Base.metadata.create_all(bind=engine)

    # Migração leve e idempotente para garantir a coluna is_active em esquemas existentes
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        if "farmers" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("farmers")]
            if "is_active" not in columns:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE farmers ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"))
                    conn.commit()
    except Exception:
        pass


def get_db():
    """Gerador de sessão do SQLAlchemy para injeção de dependência."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
