from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.models import ContactCreate

router = APIRouter(prefix="/api/contact", tags=["Contact"])


@router.post("/", summary="Submit a contact form")
async def submit_contact(data: ContactCreate):
    db = get_db()

    document = {
        **data.model_dump(),
        "created_at": datetime.utcnow()
    }

    try:
        if db is not None:
            await db.contact_messages.insert_one(document)
    except Exception as e:
        print(f"ERROR: Could not save contact message to DB. Error: {e}")

    return {"message": "Your message has been sent successfully!"}


@router.get("/", summary="Get all contact messages (Admin)")
async def get_all_contact_messages():
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
