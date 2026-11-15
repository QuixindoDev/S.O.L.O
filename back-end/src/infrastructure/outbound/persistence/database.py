"""
Configuração do Banco de Dados SQLAlchemy - Field Shift / S.O.L.O. Campo Amigo
Suporta PostgreSQL/PostGIS e SQLite como fallback leve.
Garante criação de tabelas e migrações leves idempotentes para novas colunas e entidades.
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

    # Migração leve e idempotente para garantir compatibilidade de colunas na tabela farmers
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        if "farmers" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("farmers")]
            missing_cols = {
                "is_active": "BOOLEAN NOT NULL DEFAULT 1",
                "apelido": "VARCHAR(100)",
                "cidade": "VARCHAR(100)",
                "estado": "VARCHAR(50)",
                "nome_sitio": "VARCHAR(200)",
                "latitude_padrao": "FLOAT DEFAULT -12.97",
                "longitude_padrao": "FLOAT DEFAULT -39.51",
                "tipo_solo": "VARCHAR(50) DEFAULT 'argiloso'",
                "password_hash": "VARCHAR(255)",
                "is_phone_verified": "BOOLEAN NOT NULL DEFAULT 0",
                "otp_code_hash": "VARCHAR(255)",
                "otp_expires_at": "DATETIME",
                "otp_attempts": "INTEGER NOT NULL DEFAULT 0",
            }
            with engine.connect() as conn:
                for col_name, col_def in missing_cols.items():
                    if col_name not in columns:
                        conn.execute(text(f"ALTER TABLE farmers ADD COLUMN {col_name} {col_def}"))
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
