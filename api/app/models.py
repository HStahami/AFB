from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- Admission Models ---
class AdmissionCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    course: Optional[str] = None # Optional since we commented it out for now

class AdmissionDB(AdmissionCreate):
    id: str = Field(alias="_id")
    status: str = "Pending" # Pending, Approved, Canceled
    created_at: datetime
    
# --- Contact Models ---
class ContactCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    message: str
    
class ContactDB(ContactCreate):
    id: str = Field(alias="_id")
    created_at: datetime
    
# --- Admin Auth Models ---
class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    username: str
    password: str
