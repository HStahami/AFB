from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, HTTPException, Depends, status

from app.database import get_db
from app.core.dependencies import require_admin, get_current_user
from app.core.security import hash_password
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/admins", tags=["Admins"])


class CreateAdminRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = ""


class UpdateAdminRequest(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)
    full_name: Optional[str] = None


def _clean_admin_doc(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "_id": str(doc["_id"]),
        "username": doc.get("username", ""),
        "email": doc.get("email", ""),
        "full_name": doc.get("full_name", doc.get("name", "")),
        "role": doc.get("role", "admin"),
        "status": doc.get("status", "active"),
        "is_active": doc.get("is_active", True),
        "first_login": doc.get("first_login", False),
        "created_by": doc.get("created_by", "system"),
        "created_at": doc.get("created_at"),
        "last_login_at": doc.get("last_login_at"),
        "updated_at": doc.get("updated_at")
    }


@router.get("", summary="List all administrator accounts (Admin Only)")
@router.get("/", summary="List all administrator accounts (Admin Only)")
async def list_admins(
    current_admin: dict = Depends(require_admin)
):
    """
    Retrieves all administrator user accounts from the database.
    Password hashes are stripped for security.
    """
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable."
        )

    admins = []
    async for doc in db.users.find({"role": "admin"}).sort("created_at", -1):
        admins.append(_clean_admin_doc(doc))

    return admins


@router.post("", summary="Create a new administrator account (Admin Only)")
@router.post("/", summary="Create a new administrator account (Admin Only)")
async def create_admin_account(
    req: CreateAdminRequest,
    current_admin: dict = Depends(require_admin)
):
    """
    Creates a new administrator account:
    - Verifies unique username and email
    - Hashes password using Argon2id
    - Dispatches in-system admin notification
    """
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable."
        )

    clean_username = req.username.strip().lower()
    clean_email = req.email.strip().lower()
    clean_full_name = (req.full_name or "").strip()

    if not clean_username.isalnum() and not all(c.isalnum() or c in ['_', '-'] for c in clean_username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username can only contain alphanumeric characters, underscores, and hyphens."
        )

    # Check for existing user with same username or email
    import re
    existing = await db.users.find_one({
        "$or": [
            {"username": {"$regex": f"^{re.escape(clean_username)}$", "$options": "i"}},
            {"email": {"$regex": f"^{re.escape(clean_email)}$", "$options": "i"}}
        ]
    })

    if existing:
        if existing.get("username", "").lower() == clean_username:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is already taken.")
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email address is already registered.")

    hashed_pw = hash_password(req.password)
    now = datetime.utcnow()

    admin_doc = {
        "username": clean_username,
        "email": clean_email,
        "full_name": clean_full_name,
        "password_hash": hashed_pw,
        "role": "admin",
        "status": "active",
        "is_active": True,
        "first_login": False,
        "profile_completed": True,
        "created_by": current_admin.get("username", "admin"),
        "created_at": now,
        "updated_at": now
    }

    res = await db.users.insert_one(admin_doc)
    admin_doc["_id"] = res.inserted_id

    # Notify other admins
    try:
        admin_cursor = db.users.find({"role": "admin", "_id": {"$ne": res.inserted_id}})
        async for admin in admin_cursor:
            await create_notification(
                db=db,
                recipient_user_id=admin["_id"],
                title="New Administrator Added",
                message=f"A new administrator '{clean_username}' ({clean_email}) was created by {current_admin.get('username', 'Admin')}.",
                notification_type="admin_created",
                related_entity_type="user",
                related_entity_id=str(res.inserted_id)
            )
    except Exception as e:
        print(f"[ADMIN NOTIF] Failed to dispatch admin creation notice: {e}")

    return {
        "message": "Administrator account created successfully.",
        "admin": _clean_admin_doc(admin_doc)
    }


@router.patch("/{admin_id}/toggle-status", summary="Toggle administrator active/inactive status (Admin Only)")
async def toggle_admin_status(
    admin_id: str,
    current_admin: dict = Depends(require_admin)
):
    """
    Enables or disables an administrator account.
    Prevents self-deactivation and ensures at least one active admin exists.
    """
    db = get_db()
    try:
        target_oid = ObjectId(admin_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid administrator ID format.")

    # Guard against self-deactivation
    if str(current_admin.get("_id")) == admin_id or str(current_admin.get("id")) == admin_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own currently logged-in administrator account."
        )

    target_admin = await db.users.find_one({"_id": target_oid, "role": "admin"})
    if not target_admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Administrator account not found.")

    is_currently_active = target_admin.get("is_active", True) and target_admin.get("status", "active") == "active"
    new_is_active = not is_currently_active
    new_status = "active" if new_is_active else "inactive"

    # If deactivating, ensure at least one other active admin remains
    if not new_is_active:
        active_admins_count = await db.users.count_documents({
            "role": "admin",
            "is_active": True,
            "status": "active",
            "_id": {"$ne": target_oid}
        })
        if active_admins_count < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the only remaining active administrator."
            )

    await db.users.update_one(
        {"_id": target_oid},
        {
            "$set": {
                "is_active": new_is_active,
                "status": new_status,
                "updated_at": datetime.utcnow()
            }
        }
    )

    return {
        "message": f"Administrator account {'activated' if new_is_active else 'deactivated'} successfully.",
        "admin_id": admin_id,
        "is_active": new_is_active,
        "status": new_status
    }


@router.delete("/{admin_id}", summary="Delete an administrator account (Admin Only)")
async def delete_admin_account(
    admin_id: str,
    current_admin: dict = Depends(require_admin)
):
    """
    Permanently removes an administrator account.
    Prevents self-deletion and ensures at least one active admin remains.
    """
    db = get_db()
    try:
        target_oid = ObjectId(admin_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid administrator ID format.")

    if str(current_admin.get("_id")) == admin_id or str(current_admin.get("id")) == admin_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own currently logged-in administrator account."
        )

    target_admin = await db.users.find_one({"_id": target_oid, "role": "admin"})
    if not target_admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Administrator account not found.")

    active_admins_count = await db.users.count_documents({
        "role": "admin",
        "is_active": True,
        "status": "active",
        "_id": {"$ne": target_oid}
    })
    if active_admins_count < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the only remaining active administrator."
        )

    await db.users.delete_one({"_id": target_oid})
    return {"message": "Administrator account deleted successfully.", "admin_id": admin_id}
