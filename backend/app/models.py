from sqlalchemy import Column, Integer, String
from .database import Base

#Each table is a class that inherits base, so sqlalchemy knows to treat it as a table and create
#pkeys by default are always unique and non nullable (enforced)
#int pkeys will be automatically added and incremented
#strings or other pkey types, need to do yourself
class Play(Base):
    __tablename__ = "plays"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)