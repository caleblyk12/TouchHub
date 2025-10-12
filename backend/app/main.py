import os
from fastapi import FastAPI
from .database import Base, engine
from .routers import plays, users, auth
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.vercel.app", "http://localhost:5173"],
    allow_credentials=True, #allow FE to send cookies, auth headers, etc
    allow_methods=["*"], #allow GET, POST, PUT, DELETE (controls which http methods allowed)
    allow_headers=["*"], #allows headers (for auth)
)

# Register routers
app.include_router(users.router)
app.include_router(plays.router)
app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "TouchHub backend running!"}
