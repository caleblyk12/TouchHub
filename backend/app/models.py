from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .database import Base

#Each table is a class that inherits base, so sqlalchemy knows to treat it as a table and create
#pkeys by default are always unique and non nullable (enforced)
#int pkeys will be automatically added and incremented
#strings or other pkey types, need to do yourself

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    plays = relationship("Play", back_populates="owner")



class Play(Base):
    __tablename__ = "plays"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="plays")