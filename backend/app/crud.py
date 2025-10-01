#encapsulates db operations from our endpoints in routers folder
#most of these CRUD operations create ORM objects using models, add them to db, and return them as ORM
#the endpoints in routers then use response_model to let pydantic validate the models as python dicts, 
#then filter for relevant fields and return serialized JSON
from sqlalchemy.orm import Session
from . import models, schemas
from .auth import hash_password



### Users --------------------------------------------------------------------------------------------------
def create_user(db: Session, user: schemas.UserCreate):
    hashed_pw = hash_password(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user



def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()


def get_user_by_id(db: Session, usid: int):
    return db.query(models.User).filter(models.User.id == usid).first()


def get_user_by_username(db: Session, username: str):  
    return db.query(models.User).filter(models.User.username == username).first()



### Plays --------------------------------------------------------------------------------------------------

def get_plays(db: Session, skip: int = 0, limit: int = 100):
    #this returns a list of sqlalchemy ORM objects (the actual play), not dicts, not json.
    #it needs to be validated by pydantic using orm_mode=true which allows pydantic to extract the fields as a dict
    #it then needs to be serialized to json using response_model, which filters fields and returns json
    return db.query(models.Play).offset(skip).limit(limit).all()



def get_play_by_id(db: Session, play_id: int):
    return db.query(models.Play).filter(models.Play.id == play_id).first()


#for create_play, we attach owner_id as an exrta argument instead of adding it to playCreate schema
#this is so we attach id server side, since we alr know the exact user making the request via token payload.sub
def create_play(db: Session, play: schemas.PlayCreate, owner_id: int):  
    #model_dump changes the pydantic model instance to a python dict {"title": "x", "Desc": "y"}
    #** then changes the dict to keyword args {title="x" desc="y"} which is what sqlalchemy reads
    #shortcut for new_play = models.Play(title=play.title, description=play.description),
    new_play = models.Play(**play.model_dump(), owner_id=owner_id)
    db.add(new_play)
    db.commit()
    db.refresh(new_play) #our current instance of new_play still doesnt have id, so sync with db to get id
    return new_play #we then return new_play with id attached to it




def update_play(db: Session, play_id: int, play_update: schemas.PlayUpdate):
    play = get_play_by_id(db, play_id)
    if play:
        play.title = play_update.title
        play.description = play_update.description
        #all the above changes are tracked changes, since the current play object has diff attributes from
        #its db counterpart. When you call commit, all these tracked changes are synced up.
        db.commit()
        db.refresh(play)
    return play



def delete_play(db: Session, play_id: int):
    play = get_play_by_id(db, play_id)
    if play:
        db.delete(play)
        db.commit()
    return play
