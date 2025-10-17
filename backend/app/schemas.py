from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List



### Auth Tokens --------------------------------------------------------------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None



### Users --------------------------------------------------------------------------------------------
class UserBase(BaseModel):
    username: str



class UserCreate(UserBase):
    username: str = Field(..., max_length=15, pattern=r"^\S*$") # No spaces allowed
    password: str #only appear in create, NOT in userOut response to hide pw
    email: EmailStr
    

class UserOut(UserBase):
    id: int #attach id so frontend knows what to do
    class Config:
        from_attributes = True



### Whiteboard ---------------------------------------------------------------------------------------
class Piece(BaseModel):
    id: int                          # unique per piece within a frame
    type: str                        # e.g. "player", "ball", "cone", "zone"
    color: str                       # for team colour or role
    x: float                         # coordinate on pitch (percentage or pixels)
    y: float
    #Potential futue stuff (optional for now)
    rotation: Optional[float] = 0.0  # direction facing (degrees) (good for corner/shut posture)
    size: Optional[float] = 1.0      # scale factor for drawing
    label: Optional[str] = None      # optional text like "A", "Wing", "Def"
    opacity: Optional[float] = 1.0   # for ghosting or highlighting


class Frame(BaseModel):
    frame_number: int
    duration: Optional[float] = 1.0     # seconds each frame lasts in animation (default 1s)
    pieces: List[Piece]                 # pieces in that frame



### Plays --------------------------------------------------------------------------------------------
class PlayBase(BaseModel):
    title: str
    description: str | None = None
    frame_data: Optional[List[Frame]] = None  # validated list of frames
    is_private: bool = False

class PlayCreate(PlayBase):
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
    owner: UserOut
    #This class config allows auto changing of ORM table into JSON for frontend
    #we dont need it for put or post because FE gives us json, and we use that json to create table
    #but when returning response, its faster if we can just return orm object from our query
    class Config:
        from_attributes = True  # Allows returning SQLAlchemy objects directly

