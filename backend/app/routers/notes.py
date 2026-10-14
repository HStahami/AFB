from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status
from pydantic import BaseModel, Field
from app.database import get_db
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/notes", tags=["Notes"])


class NoteCreate(BaseModel):
    title: Optional[str] = "Class Notes"
    content: str
    slot_id: Optional[str] = None
    slot_name: Optional[str] = None
    tags: Optional[List[str]] = []


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    slot_id: Optional[str] = None
    slot_name: Optional[str] = None
    tags: Optional[List[str]] = None


def _format_note(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc["_id"] = str(doc["_id"])
    if doc.get("user_id"):
        doc["user_id"] = str(doc["user_id"])
    if doc.get("student_id"):
        doc["student_id"] = str(doc["student_id"])
    return doc


@router.get("/", summary="List all class notes of current user")
async def get_my_notes(
    slot_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    query = {"user_id": current_user["_id"]}
    if slot_id:
        query["slot_id"] = slot_id

    notes = []
    async for doc in db.notes.find(query).sort("updated_at", -1):
        notes.append(_format_note(doc))
    return notes


@router.get("/{note_id}", summary="Get a specific note by ID")
async def get_note(
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    try:
        oid = ObjectId(note_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid note ID.")

    doc = await db.notes.find_one({"_id": oid, "user_id": current_user["_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Note not found.")
    return _format_note(doc)


@router.post("/", summary="Create or auto-save a note")
async def create_note(
    data: NoteCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    student_id = None
    if current_user.get("role") == "student":
        student = await db.students.find_one({"user_id": current_user["_id"]})
        if student:
            student_id = str(student["_id"])

    now = datetime.utcnow()
    doc = {
        "user_id": current_user["_id"],
        "student_id": student_id,
        "title": data.title.strip() if data.title else "Class Notes",
        "content": data.content,
        "slot_id": data.slot_id,
        "slot_name": data.slot_name,
        "tags": data.tags or [],
        "created_at": now,
        "updated_at": now
    }
    res = await db.notes.insert_one(doc)
    doc["_id"] = res.inserted_id
    return _format_note(doc)


@router.put("/{note_id}", summary="Update a note")
async def update_note(
    note_id: str,
    data: NoteUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    try:
        oid = ObjectId(note_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid note ID.")

    existing = await db.notes.find_one({"_id": oid, "user_id": current_user["_id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Note not found.")

    update_fields = {"updated_at": datetime.utcnow()}
    if data.title is not None:
        update_fields["title"] = data.title.strip() or "Class Notes"
    if data.content is not None:
        update_fields["content"] = data.content
    if data.slot_id is not None:
        update_fields["slot_id"] = data.slot_id
    if data.slot_name is not None:
        update_fields["slot_name"] = data.slot_name
    if data.tags is not None:
        update_fields["tags"] = data.tags

    await db.notes.update_one({"_id": oid}, {"$set": update_fields})
    updated_doc = await db.notes.find_one({"_id": oid})
    return _format_note(updated_doc)


@router.delete("/{note_id}", summary="Delete a note")
async def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    try:
        oid = ObjectId(note_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid note ID.")

    res = await db.notes.delete_one({"_id": oid, "user_id": current_user["_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found.")
    return {"message": "Note deleted successfully."}
