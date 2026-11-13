from datetime import timezone, datetime
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.models import ContactCreate
from app.core.dependencies import require_admin
from app.services.email_service import (
    send_contact_inquiry_alert,
    send_contact_acknowledgment_email
)

router = APIRouter(prefix="/api/contact", tags=["Contact"])


@router.post("/", summary="Submit a contact form (Public)")
async def submit_contact(data: ContactCreate):
    db = get_db()

    document = {
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc)
    }

    try:
        if db is not None:
            await db.contact_messages.insert_one(document)
    except Exception as e:
        print(f"ERROR: Could not save contact message to DB. Error: {e}")

    # Send institute alerts and visitor auto-reply
    sender_name = f"{data.first_name} {data.last_name}".strip()
    sender_email = str(data.email).strip().lower()
    message_text = data.message.strip()
    inquiry_subject = "General Website Inquiry"

    try:
        # 1. Admin Alert Email
        send_contact_inquiry_alert(
            sender_name=sender_name,
            sender_email=sender_email,
            sender_phone="",
            inquiry_subject=inquiry_subject,
            message_text=message_text
        )
        # 2. Courtesy Acknowledgment to Visitor
        send_contact_acknowledgment_email(
            sender_name=sender_name,
            sender_email=sender_email,
            inquiry_subject=inquiry_subject
        )
    except Exception as email_err:
        print(f"[CONTACT EMAIL ERROR]: Failed to dispatch contact emails: {email_err}")

    return {"message": "Your message has been sent successfully!"}


@router.get("/", summary="Get all contact messages (Admin Only)")
async def get_all_contact_messages(admin_user: dict = Depends(require_admin)):
    db = get_db()
    if db is None:
        return []
    try:
        messages = []
        async for doc in db.contact_messages.find().sort("created_at", -1):
            doc["_id"] = str(doc["_id"])
            messages.append(doc)
        return messages
    except Exception as e:
        print(f"ERROR fetching contact messages: {e}")
        return []
