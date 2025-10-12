from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

#Engine is the bridge to the database
engine = create_engine(DATABASE_URL)

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
