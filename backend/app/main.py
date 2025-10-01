import os
from fastapi import FastAPI
from .database import Base, engine
from .routers import plays, users, auth


# Create tables at startup (for dev only — use Alembic later)
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Register routers
app.include_router(users.router)
app.include_router(plays.router)
app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "TouchHub backend running!"}
