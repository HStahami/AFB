from datetime import datetime
from typing import Optional
from bson import ObjectId


async def create_notification(
    db,
    recipient_user_id: ObjectId,
    title: str,
    message: str,
    notification_type: str = "system",
    sender_user_id: Optional[ObjectId] = None,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[str] = None
) -> Optional[str]:
    """
    Creates an in-app notification record for a specific user.
    """
    if db is None:
        return None

    try:
        doc = {
            "recipient_user_id": recipient_user_id if isinstance(recipient_user_id, ObjectId) else ObjectId(recipient_user_id),
            "sender_user_id": ObjectId(sender_user_id) if sender_user_id else None,
            "type": notification_type,
            "title": title,
            "message": message,
            "related_entity_type": related_entity_type,
            "related_entity_id": str(related_entity_id) if related_entity_id else None,
            "is_read": False,
            "created_at": datetime.utcnow()
        }
        res = await db.notifications.insert_one(doc)
        return str(res.inserted_id)
    except Exception as e:
        print(f"[NOTIFICATION ERROR] Failed to create notification: {e}")
        return None
