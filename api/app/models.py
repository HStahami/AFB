from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime


# --- Admission Models ---
class AdmissionCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    course: Optional[str] = None


class AdmissionDB(AdmissionCreate):
    id: str = Field(alias="_id")
    status: str = "Pending"
    fee_status: str = "pending"
    created_at: datetime


class FeeStatusUpdate(BaseModel):
    fee_status: str  # pending, paid, verified, waived, failed


# --- Contact Models ---
class ContactCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    message: str


class ContactDB(ContactCreate):
    id: str = Field(alias="_id")
    created_at: datetime


# --- Auth & Multi-role User Models ---
class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    status: str = "active"
    first_login: bool = False
    profile_completed: bool = True
    student_code: Optional[str] = None
    student_id: Optional[str] = None
    instructor_id: Optional[str] = None
    onboarding_status: str = "completed"  # first_login_required, profile_completion_required, completed
    created_at: Optional[datetime] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


# --- Student Profile Models ---
class StudentProfileUpdate(BaseModel):
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    profile_image: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_relationship: Optional[str] = None
    bio: Optional[str] = None


# --- Enrollment Models ---
class EnrollmentCreate(BaseModel):
    student_id: str
    module_id: Optional[str] = None
    instructor_id: Optional[str] = None
    slot_id: Optional[str] = None
    status: str = "active"  # active, paused, completed, cancelled
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class EnrollmentUpdate(BaseModel):
    module_id: Optional[str] = None
    instructor_id: Optional[str] = None
    slot_id: Optional[str] = None
    status: Optional[str] = None
    end_date: Optional[datetime] = None


class EnrollmentResponse(BaseModel):
    id: str
    student_id: str
    module_id: Optional[str] = None
    instructor_id: Optional[str] = None
    slot_id: Optional[str] = None
    status: str = "active"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# --- Task / Assignment Models ---
class TaskCreate(BaseModel):
    module_id: str
    instructor_id: Optional[str] = None
    enrollment_id: Optional[str] = None
    title: str
    description: str
    instructions: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str = "published"  # draft, published, closed
    attachments: List[str] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    attachments: Optional[List[str]] = None


class TaskResponse(BaseModel):
    id: str
    module_id: str
    instructor_id: Optional[str] = None
    enrollment_id: Optional[str] = None
    title: str
    description: str
    instructions: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str = "published"
    attachments: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# --- Submission Models ---
class SubmissionCreate(BaseModel):
    task_id: str
    content: str
    attachment_urls: List[str] = []
    file_url: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: str
    task_id: str
    student_id: str
    enrollment_id: Optional[str] = None
    submitted_at: datetime
    content: str
    attachment_urls: List[str] = []
    status: str = "submitted"  # submitted, reviewed, returned
    feedback: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# --- Assessment / Grading Models ---
class AssessmentCreate(BaseModel):
    submission_id: str
    score: Optional[float] = None
    grade: Optional[str] = None
    feedback: Optional[str] = None


class AssessmentResponse(BaseModel):
    id: str
    submission_id: str
    task_id: str
    student_id: str
    instructor_id: str
    score: Optional[float] = None
    grade: Optional[str] = None
    feedback: Optional[str] = None
    assessed_at: datetime
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# --- Attendance Models ---
class AttendanceCreate(BaseModel):
    student_id: str
    enrollment_id: Optional[str] = None
    slot_id: Optional[str] = None
    date: str  # YYYY-MM-DD
    status: str  # present, absent, late, excused
    remarks: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: str
    student_id: str
    instructor_id: str
    slot_id: Optional[str] = None
    enrollment_id: Optional[str] = None
    date: str
    status: str
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None


# --- Notification Models ---
class NotificationResponse(BaseModel):
    id: str
    recipient_user_id: str
    sender_user_id: Optional[str] = None
    type: str
    title: str
    message: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    is_read: bool = False
    created_at: Optional[datetime] = None


# --- Resource Models ---
class ResourceCreate(BaseModel):
    module_id: str
    title: str
    description: Optional[str] = None
    type: str = "document"  # pdf, document, video, link, audio
    url: str
    storage_provider: str = "cloudinary"


class ResourceResponse(BaseModel):
    id: str
    module_id: str
    instructor_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    type: str
    url: str
    storage_provider: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
