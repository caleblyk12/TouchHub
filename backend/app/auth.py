import os
from datetime import datetime, timezone, timedelta
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from .database import get_db
from . import crud, schemas


# --- Load secrets from .env ---

load_dotenv()

SECRET_KEY = os.getenv("TOUCHHUB_SECRET")
if not SECRET_KEY:
    raise RuntimeError("TOUCHHUB_SECRET is not set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

# --- OAuth2 bearer scheme ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# --- Password hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# --- JWT helpers ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    #data is just {"sub": "username"}, indicating subject is username of whoever tried to login
    to_encode = data.copy() 
    #expire will contain the time of expiry of the token
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    #add this expiry to the token
    to_encode.update({"exp": expire})
    #sign the token with secret key using jwt.encode(), and the given algo we set
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- Dependency: get current user from token so we know who to allow access to endpoints ---
def get_current_user(
    #dependency injection, basically looks at Authorization: Bearer <token> header, and passes the token string here
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db),
):
    #define an error to return so its concise and reusable. 
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        #decode the token by verifying signature, store the dict with sub and expiry in "payload"
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        #extract username
        username: Optional[str] = payload.get("sub")
        if username is None:
            #if no username associated w token
            raise credentials_error
    # if cannot decode the token? So wrong key? 
    except JWTError:
        raise credentials_error

    user = crud.get_user_by_username(db, username)
    if user is None:
        #username from token doesnt exist in the database
        raise credentials_error
    #return the actual user from database. Look at crud method to see whats returned. 
    return user
