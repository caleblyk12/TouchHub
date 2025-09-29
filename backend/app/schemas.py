from pydantic import BaseModel, EmailStr

### Users --------------------------------------------------------------------------------------------
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str #only appear in create, NOT in userOut response to hide pw

class UserOut(UserBase):
    id: int #attach id so frontend knows what to do
    class Config:
        from_attributes = True

### Plays --------------------------------------------------------------------------------------------
class PlayBase(BaseModel):
    title: str
    description: str | None = None

class PlayCreate(PlayBase):
    #this is for post requests (request body validation)
    owner_id: int #not in playBase because we dont want put requests to change owner id
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
    owner_id: int

    #This class config allows auto changing of ORM table into JSON for frontend
    #we dont need it for put or post because FE gives us json, and we use that json to create table
    #but when returning response, its faster if we can just return orm object from our query
    class Config:
        from_attributes = True  # Allows returning SQLAlchemy objects directly

