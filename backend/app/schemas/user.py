from pydantic import BaseModel, EmailStr
from enum import Enum


class UserRole(str, Enum):
    employee = "employee"
    manager = "manager"
    admin = "admin"



class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str
    

class UserCreateByAdmin(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role: UserRole