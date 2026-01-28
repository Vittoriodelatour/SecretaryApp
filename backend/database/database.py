from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Use SQLite database file in the backend directory
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./secretary.db")

# For SQLite, we need to add check_same_thread=False
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables in the database"""
    from .models import Base
    Base.metadata.create_all(bind=engine)
