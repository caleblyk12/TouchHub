#routes for /plays, using functions from crud file
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db
from ..auth import get_current_user  


router = APIRouter(prefix="/plays", tags=["Plays"])

#response_model together with orm_mode=true does the following:
#it converts the sqlalchemy objects into JSON immediately
#it automatically filters out any extra attributes that are in the sqlalchemy object, but not the schema
#for example if a play is stored with private, id, title, desc, but i only want to return title and desc, 
#response_model will change it to json, and return only title and desc. 
#finally, it does data validation. If sqlalchemy object has LESS than required fields, error is returned.

#ORM_mode = true in schemas allows pydantic to read the orm object as a python dict (what pydantic expects)
#changes it from play(title="x", desc="y") to {"title": "x",  "desc": "y"}

#response_model then tells fastapi: Validate whatever is returned against this schema, drop extra fields, and serialize to JSON
#response_model fails without orm_mode because pydantic cannot validate orm objects by default

#list of orm objects is then changed to dict, validated, filtered, and serialized to list of json for frontend

@router.get("/", response_model=list[schemas.PlayOut])
def read_plays(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_plays(db, skip=skip, limit=limit)



@router.get("/{play_id}", response_model=schemas.PlayOut)
def read_play(play_id: int, db: Session = Depends(get_db)):
    play = crud.get_play_by_id(db, play_id)
    if not play:
        raise HTTPException(status_code=404, detail="Play not found")
    return play




@router.post("/", response_model=schemas.PlayOut)
def create_new_play(
    play: schemas.PlayCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return crud.create_play(db, play, owner_id=current_user.id)






@router.put("/{play_id}", response_model=schemas.PlayOut)
def update_existing_play(
    play_id: int, #frontend passes this
    play: schemas.PlayUpdate, #frontend passes as JSON request body
    db: Session = Depends(get_db), #backend will pass to you
    current_user = Depends(get_current_user), #backend will read header token from request, return user
):
    existing = crud.get_play_by_id(db, play_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Play not found")
    if existing.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your play")
    return crud.update_play(db, play_id, play)




#no need response model, since we are returning a python dict which fastAPI converts to json automatically
#compared to pydantic validation and filtration whcih we need response_model to trigger
@router.delete("/{play_id}")
def delete_existing_play(
    play_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    existing = crud.get_play_by_id(db, play_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Play not found")
    if existing.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your play")
    crud.delete_play(db, play_id)
    return {"message": "Play deleted successfully"}
