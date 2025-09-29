from pydantic import BaseModel

class PlayBase(BaseModel):
    title: str
    description: str

class PlayCreate(PlayBase):
    #inherits from playbase. Later can add attributes like
    #is_private: bool = False
    #this is for post requests (request body validation)
    pass

class PlayUpdate(PlayBase):
    #same as playCreate, but semantically used for PUT requests
    #maybe can make fields optional so can update one but not both as such
    #title: str | None = None
    #description: str | None = None
    #desc has to be of type str or none, and is by default none
    pass

class PlayOut(PlayBase):
    #this is sent back to client, with id added to it. 
    #When we first create/post, we just send in a name and desc
    #sql/sqlalchemy auto creates running ids as pkey 
    #when returning, we return this id tgther with the data
    id: int

    #This class config allows auto changing of ORM table into JSON for frontend
    #we dont need it for put or post because FE gives us json, and we use that json to create table
    #but when returning response, its faster if we can just return orm object from our query
    class Config:
        orm_mode = True  # Allows returning SQLAlchemy objects directly