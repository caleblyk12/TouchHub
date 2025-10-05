from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db


router = APIRouter(prefix="/users", tags=["users"])



@router.post("/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_username(db, user.username):  # prevent duplicate
        raise HTTPException(status_code=409, detail="Username already taken")
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    return crud.create_user(db=db, user=user)



@router.get("/", response_model=list[schemas.UserOut])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_users(db, skip=skip, limit=limit)


@router.get("/{usid}", response_model=schemas.UserOut)
def read_user(usid: int, db: Session = Depends(get_db)):
    user = crud.get_user_by_id(db, usid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user