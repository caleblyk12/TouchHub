from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

#Each table is a class that inherits base, so sqlalchemy knows to treat it as a table and create
#pkeys by default are always unique and non nullable (enforced)
#int pkeys will be automatically added and incremented
#strings or other pkey types, need to do yourself

class User(Base):
    __tablename__ = "users"

    #Fields
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    #Relationships
    plays = relationship("Play", back_populates="owner")



class Play(Base):
    __tablename__ = "plays"

    #Fields
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    frame_data = Column(JSON)
    is_private = Column(Boolean, default=False, nullable=False)
    #stores UTC timezones, server_default allows you to leave it blank and db will auto do
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    #Relationships
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="plays")