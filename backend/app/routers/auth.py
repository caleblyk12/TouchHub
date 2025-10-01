from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from .. import crud, schemas
from ..auth import verify_password, create_access_token, get_current_user




router = APIRouter(prefix="/auth", tags=["auth"])




@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), #constructs username and pw object from form data 
    db: Session = Depends(get_db),
):
    user = crud.get_user_by_username(db, form_data.username)
    #make sure user exists as an account, and pw is the same as hashed one stored in db
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    #create new token that expires, and encrypt it with the key
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}




@router.get("/me", response_model=schemas.UserOut)
#get_current_user calls a nested dependency, which extracts token from header in request
#it then decodes the token with the secret key, verifies that the payload.sub username exists in db, and returns the user
def read_users_me(current_user = Depends(get_current_user)):
    return current_user
