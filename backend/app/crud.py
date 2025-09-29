#encapsulates db operations from our endpoints in routers folder
from sqlalchemy.orm import Session
from . import models, schemas



def get_all_plays(db: Session):
    #this returns a list of sqlalchemy ORM objects (the actual play), not dicts, not json.
    #it needs to be validated by pydantic using orm_mode=true which allows pydantic to extract the fields as a dict
    #it then needs to be serialized to json using response_model, which filters fields and returns json
    return db.query(models.Play).all()



def get_play_by_id(db: Session, play_id: int):
    return db.query(models.Play).filter(models.Play.id == play_id).first()



def create_play(db: Session, play: schemas.PlayCreate):
    #model_dump changes the pydantic model instance to a python dict {"title": "x", "Desc": "y"}
    #** then changes the dict to keyword args {title="x" desc="y"} which is what sqlalchemy reads
    #shortcut for new_play = models.Play(title=play.title, description=play.description), esp if got more than 2 fields
    new_play = models.Play(**play.model_dump())
    db.add(new_play) #stage it
    db.commit() #once committed, the new_play in the db will have id appended
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
