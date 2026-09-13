from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

db_url = settings.DATABASE_URL
engine_kwargs = {}

if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

try:
    engine = create_engine(db_url, **engine_kwargs)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    print(f"Warning: Could not connect to primary DATABASE_URL ({db_url}). Error: {e}")
    import os, tempfile
    db_path = os.path.join(tempfile.gettempdir(), "learntube.db")
    print(f"Falling back to SQLite database ({db_path})...")
    db_url = f"sqlite:///{db_path}"
    engine_kwargs = {"connect_args": {"check_same_thread": False}}
    engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
