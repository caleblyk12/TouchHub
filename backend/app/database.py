from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


DATABASE_URL = "sqlite:///./app.db"

#engine is the connection to the database
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}  # needed for SQLite
)
#sessionLocal is a session factory. It creates db sessions via the engine.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#All models inherit from declarative_base()
Base = declarative_base()

# Dependency to get DB session for each request
#this will create session called db, yield the db to the endpoint, and when query is done closes sess
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
