from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.database import get_db
from app.core.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/messages", tags=["Messages"])


class SendMessageRequest(BaseModel):
    recipient_user_id: Optional[str] = None
    receiver_id: Optional[str] = None
    recipient_id: Optional[str] = None
    thread_id: Optional[str] = None
    content: str


def _format_message(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc["_id"] = str(doc["_id"])
    if doc.get("sender_id"):
        doc["sender_id"] = str(doc["sender_id"])
    if doc.get("receiver_id"):
        doc["receiver_id"] = str(doc["receiver_id"])
    if doc.get("student_id"):
        doc["student_id"] = str(doc["student_id"])
    if doc.get("instructor_id"):
        doc["instructor_id"] = str(doc["instructor_id"])
    return doc


def _build_thread_id(student_user_id: str, instructor_user_id: str) -> str:
    return f"t_{student_user_id}_{instructor_user_id}"


@router.get("/threads", summary="Get chat threads for current user or all threads for Admin")
async def get_chat_threads(current_user: dict = Depends(get_current_user)):
    """
    Get chat threads:
    - Students see threads with their assigned instructor(s).
    - Instructors see threads with their assigned student(s).
    - Admins see ALL student-instructor threads across the system for monitoring.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database service unavailable.")

    role = current_user.get("role")
    user_id = current_user["_id"]
    user_id_str = str(user_id)

    threads = []

    if role == "admin":
        # Admin: View ALL chat threads
        async for doc in db.chat_threads.find().sort("last_message_at", -1):
            doc["id"] = doc.get("_id")
            threads.append(doc)

    elif role == "student":
        # Find student record
        student = await db.students.find_one({"user_id": user_id})
        if not student:
            student = await db.students.find_one({"email": current_user.get("email")})

        # Get existing active threads for this student
        existing_threads = {}
        async for doc in db.chat_threads.find({"student_user_id": user_id_str}).sort("last_message_at", -1):
            doc["id"] = doc.get("_id")
            existing_threads[doc["instructor_user_id"]] = doc
            threads.append(doc)

        # If student has an assigned instructor, ensure candidate thread is visible
        if student and (student.get("instructor_id") or student.get("instructor")):
            inst_query = {}
            if student.get("instructor_id"):
                inst_query["_id"] = student["instructor_id"]
            elif student.get("instructor"):
                inst_query["name"] = student["instructor"]

            instructor = await db.instructors.find_one(inst_query) if inst_query else None
            if instructor and instructor.get("user_id"):
                inst_user = await db.users.find_one({"_id": instructor["user_id"]})
                if inst_user and str(inst_user["_id"]) not in existing_threads:
                    thread_id = _build_thread_id(user_id_str, str(inst_user["_id"]))
                    candidate_thread = {
                        "_id": thread_id,
                        "id": thread_id,
                        "student_user_id": user_id_str,
                        "student_name": f"{student.get('first_name', '')} {student.get('last_name', '')}".strip() or student.get("name", "Student"),
                        "student_code": student.get("student_code", ""),
                        "instructor_user_id": str(inst_user["_id"]),
                        "instructor_name": instructor.get("name", "Ustadh"),
                        "last_message": "No messages yet. Click to start conversation.",
                        "last_message_at": datetime.utcnow(),
                        "unread_count_student": 0,
                        "unread_count_instructor": 0
                    }
                    threads.insert(0, candidate_thread)

    elif role == "instructor":
        # Find instructor record
        instructor = await db.instructors.find_one({"user_id": user_id})
        if not instructor:
            instructor = await db.instructors.find_one({"email": current_user.get("email")})

        existing_threads = {}
        async for doc in db.chat_threads.find({"instructor_user_id": user_id_str}).sort("last_message_at", -1):
            doc["id"] = doc.get("_id")
            existing_threads[doc["student_user_id"]] = doc
            threads.append(doc)

        # Ensure assigned students appear in candidate threads
        if instructor:
            assigned_students = []
            async for s in db.students.find({"$or": [{"instructor_id": instructor["_id"]}, {"instructor": instructor.get("name")}]}):
                assigned_students.append(s)

            for s in assigned_students:
                if s.get("user_id"):
                    std_user_id_str = str(s["user_id"])
                    if std_user_id_str not in existing_threads:
                        thread_id = _build_thread_id(std_user_id_str, user_id_str)
                        candidate_thread = {
                            "_id": thread_id,
                            "id": thread_id,
                            "student_user_id": std_user_id_str,
                            "student_name": f"{s.get('first_name', '')} {s.get('last_name', '')}".strip() or s.get("name", "Student"),
                            "student_code": s.get("student_code", ""),
                            "instructor_user_id": user_id_str,
                            "instructor_name": instructor.get("name", "Ustadh"),
                            "last_message": "No messages yet.",
                            "last_message_at": datetime.utcnow(),
                            "unread_count_student": 0,
                            "unread_count_instructor": 0
                        }
                        threads.append(candidate_thread)

    return threads


@router.get("/threads/{thread_id}/history", summary="Get message history for a specific thread")
async def get_thread_history(thread_id: str, current_user: dict = Depends(get_current_user)):
    """
    Returns message history for a given thread.
    - Allowed for thread participants (student or instructor).
    - Allowed for Admin (READ-ONLY audit access).
    """
    db = get_db()
    role = current_user.get("role")
    user_id_str = str(current_user["_id"])

    # Authorization Check
    if role != "admin":
        thread = await db.chat_threads.find_one({"_id": thread_id})
        if thread:
            if user_id_str not in [thread.get("student_user_id"), thread.get("instructor_user_id")]:
                raise HTTPException(status_code=403, detail="Access denied: You are not a participant in this conversation.")
        else:
            # If thread not created yet, check thread_id naming format
            if user_id_str not in thread_id:
                raise HTTPException(status_code=403, detail="Access denied: You are not a participant in this conversation.")

    messages = []
    async for doc in db.messages.find({"thread_id": thread_id}).sort("created_at", 1):
        messages.append(_format_message(doc))

    return messages


@router.post("/send", summary="Send a direct message in a student-instructor thread")
async def send_message(payload: SendMessageRequest, current_user: dict = Depends(get_current_user)):
    """
    Send a chat message:
    - Allowed for Student -> Instructor or Instructor -> Student.
    - FORBIDDEN for Admin (Admin has read-only oversight access).
    """
    db = get_db()
    role = current_user.get("role")
    sender_user_id = current_user["_id"]
    sender_user_id_str = str(sender_user_id)

    if role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin has read-only oversight access to chats and cannot post messages into private student-instructor threads."
        )

    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")

    recipient_user_id_str = payload.recipient_user_id or payload.receiver_id or payload.recipient_id

    # Resolve recipient from thread_id if recipient_user_id wasn't passed directly
    if not recipient_user_id_str and payload.thread_id:
        parts = payload.thread_id.replace("t_", "").split("_")
        if len(parts) >= 2:
            recipient_user_id_str = parts[1] if parts[0] == sender_user_id_str else parts[0]

    if not recipient_user_id_str:
        raise HTTPException(status_code=400, detail="Recipient user ID or thread ID is required.")

    try:
        recipient_oid = ObjectId(recipient_user_id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid recipient user ID.")

    recipient_user = await db.users.find_one({"_id": recipient_oid})
    if not recipient_user:
        raise HTTPException(status_code=404, detail="Recipient user not found.")

    recipient_role = recipient_user.get("role")

    # Access control verification
    if role == "student":
        if recipient_role != "instructor":
            raise HTTPException(status_code=400, detail="Students can only send direct messages to Instructors.")
        student_user_id_str = sender_user_id_str
        instructor_user_id_str = recipient_user_id_str
    elif role == "instructor":
        if recipient_role != "student":
            raise HTTPException(status_code=400, detail="Instructors can only send direct messages to Students.")
        student_user_id_str = recipient_user_id_str
        instructor_user_id_str = sender_user_id_str
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role for messaging.")

    thread_id = _build_thread_id(student_user_id_str, instructor_user_id_str)

    # Resolve display names for thread tracking
    student = await db.students.find_one({"user_id": ObjectId(student_user_id_str)})
    instructor = await db.instructors.find_one({"user_id": ObjectId(instructor_user_id_str)})

    student_name = f"{student.get('first_name', '')} {student.get('last_name', '')}".strip() if student else "Student"
    if not student_name or student_name == "Student":
        student_name = student.get("name", "Student") if student else "Student"

    instructor_name = instructor.get("name", "Ustadh") if instructor else "Ustadh"

    message_doc = {
        "thread_id": thread_id,
        "student_user_id": student_user_id_str,
        "instructor_user_id": instructor_user_id_str,
        "sender_id": sender_user_id,
        "sender_user_id": sender_user_id_str,
        "sender_role": role,
        "receiver_id": recipient_oid,
        "receiver_user_id": recipient_user_id_str,
        "content": payload.content.strip(),
        "is_read": False,
        "created_at": datetime.utcnow()
    }

    res = await db.messages.insert_one(message_doc)
    message_doc["_id"] = str(res.inserted_id)
    message_doc["id"] = str(res.inserted_id)

    # Upsert Thread Document
    unread_field = "unread_count_instructor" if role == "student" else "unread_count_student"
    await db.chat_threads.update_one(
        {"_id": thread_id},
        {
            "$set": {
                "student_user_id": student_user_id_str,
                "student_name": student_name,
                "instructor_user_id": instructor_user_id_str,
                "instructor_name": instructor_name,
                "last_message": payload.content.strip(),
                "last_message_at": datetime.utcnow(),
                "last_sender_role": role
            },
            "$inc": {unread_field: 1}
        },
        upsert=True
    )

    return _format_message(message_doc)


@router.post("/threads/{thread_id}/read", summary="Mark thread messages as read for current user")
async def mark_thread_read(thread_id: str, current_user: dict = Depends(get_current_user)):
    """Mark unread messages in thread as read."""
    db = get_db()
    user_id_str = str(current_user["_id"])
    role = current_user.get("role")

    await db.messages.update_many(
        {"thread_id": thread_id, "receiver_user_id": user_id_str, "is_read": False},
        {"$set": {"is_read": True, "read_at": datetime.utcnow()}}
    )

    reset_field = "unread_count_student" if role == "student" else "unread_count_instructor"
    await db.chat_threads.update_one(
        {"_id": thread_id},
        {"$set": {reset_field: 0}}
    )

    return {"message": "Thread marked as read."}
