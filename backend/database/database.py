from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import logging

logger = logging.getLogger(__name__)

# Use SQLite database file in the backend directory
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./secretary.db")
ENV = os.getenv("ENV", "development")
IS_PRODUCTION = ENV == "production"

# Configure database engine with environment-specific settings
is_sqlite = "sqlite" in DATABASE_URL
connect_args = {}
engine_kwargs = {}

if is_sqlite:
    # SQLite requires special handling for thread safety
    if IS_PRODUCTION:
        # In production, use single thread pool to avoid concurrency issues
        # WARNING: This limits SQLite to single-threaded operation
        logger.warning("Running SQLite in production mode. This is NOT RECOMMENDED. "
                       "Please migrate to PostgreSQL for multi-user production environments.")
        engine_kwargs["pool_size"] = 1
        engine_kwargs["max_overflow"] = 0
        engine_kwargs["pool_pre_ping"] = True
        # Keep thread check enabled in production for safety
        connect_args = {}
    else:
        # In development, allow multi-threaded access (FastAPI's hot reload needs this)
        logger.info("Running SQLite in development mode with thread safety disabled")
        connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
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
