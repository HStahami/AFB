import os
import uuid
from bson import ObjectId
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from app.database import get_db

router = APIRouter(prefix="/api/modules", tags=["Modules"])


@router.get("/", summary="Get all modules sorted by display order")
async def get_all_modules():
    db = get_db()
    if db is None:
        return []
    try:
        modules = []
        async for doc in db.modules.find().sort([("order", 1), ("created_at", 1)]):
            doc["_id"] = str(doc["_id"])
            doc["id"] = doc["_id"]
            if "description" not in doc:
                doc["description"] = ""
            if "image" not in doc:
                doc["image"] = None
            if "order" not in doc:
                doc["order"] = 1
            modules.append(doc)
        return modules
    except Exception as e:
        print(f"ERROR fetching modules: {e}")
        return []


@router.post("/", summary="Create a new module")
async def create_module(
    name: str = Form(...),
    description: Optional[str] = Form(""),
    order: Optional[int] = Form(1),
    image: Optional[UploadFile] = File(None)
):
    db = get_db()
    image_url = None

    if image and image.filename:
        ext = os.path.splitext(image.filename)[1] or ".png"
        filename = f"module_{uuid.uuid4().hex}{ext}"
        filepath = os.path.join("uploads", filename)
        os.makedirs("uploads", exist_ok=True)
        content = await image.read()
        with open(filepath, "wb") as f:
            f.write(content)
        image_url = f"/uploads/{filename}"

    try:
        doc = {
            "name": name,
            "description": description or "",
            "order": int(order) if order is not None else 1,
            "image": image_url,
            "created_at": datetime.utcnow()
        }
        result = await db.modules.insert_one(doc)
        return {"message": "Module created successfully.", "id": str(result.inserted_id), "image": image_url}
    except Exception as e:
        print(f"ERROR creating module: {e}")
        raise HTTPException(status_code=500, detail="Could not create module.")


@router.put("/{module_id}", summary="Update a module")
async def update_module(
    module_id: str,
    name: str = Form(...),
    description: Optional[str] = Form(""),
    order: Optional[int] = Form(1),
    image: Optional[UploadFile] = File(None)
):
    db = get_db()
    try:
        existing = await db.modules.find_one({"_id": ObjectId(module_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Module not found")

        update_data = {
            "name": name,
            "description": description or "",
            "order": int(order) if order is not None else 1
        }

        if image and image.filename:
            ext = os.path.splitext(image.filename)[1] or ".png"
            filename = f"module_{uuid.uuid4().hex}{ext}"
            filepath = os.path.join("uploads", filename)
            os.makedirs("uploads", exist_ok=True)
            content = await image.read()
            with open(filepath, "wb") as f:
                f.write(content)
            update_data["image"] = f"/uploads/{filename}"

        await db.modules.update_one({"_id": ObjectId(module_id)}, {"$set": update_data})
        return {"message": "Module updated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR updating module: {e}")
        raise HTTPException(status_code=500, detail="Could not update module.")


@router.delete("/{module_id}", summary="Delete a module")
async def delete_module(module_id: str):
    db = get_db()
    try:
        result = await db.modules.delete_one({"_id": ObjectId(module_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Module not found")
        return {"message": "Module deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR deleting module: {e}")
        raise HTTPException(status_code=500, detail="Could not delete module.")
