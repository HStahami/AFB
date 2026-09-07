from bson import ObjectId
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Depends
from app.database import get_db
from app.core.dependencies import require_admin
from app.services.storage_service import upload_media_file

router = APIRouter(prefix="/api/modules", tags=["Modules"])


@router.get("/", summary="Get all modules sorted by display order (Public)")
async def get_all_modules():
    db = get_db()
    if db is None:
        return []
    try:
        modules = []
        async for doc in db.modules.find().sort([("order", 1), ("created_at", 1)]):
            doc["_id"] = str(doc["_id"])
            doc["id"] = doc["_id"]
            name_val = doc.get("name") or doc.get("title") or "Module"
            doc["name"] = name_val
            doc["title"] = doc.get("title") or name_val
            if "description" not in doc or doc["description"] is None:
                doc["description"] = ""
            if "image" not in doc:
                doc["image"] = None
            if "order" not in doc or doc["order"] is None:
                doc["order"] = 1
            if "is_active" not in doc:
                doc["is_active"] = True
            modules.append(doc)
        return modules
    except Exception as e:
        print(f"ERROR fetching modules: {e}")
        return []


@router.post("/", summary="Create a new module (Admin Only)")
async def create_module(
    name: str = Form(...),
    description: Optional[str] = Form(""),
    order: Optional[int] = Form(1),
    image: Optional[UploadFile] = File(None),
    admin_user: dict = Depends(require_admin)
):
    db = get_db()
    image_url = None

    if image and image.filename:
        image_url = await upload_media_file(image, folder="modules", prefix="module")

    try:
        name_clean = name.strip() if name else "Module"
        doc = {
            "name": name_clean,
            "title": name_clean,
            "description": description or "",
            "order": int(order) if order is not None else 1,
            "image": image_url,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        result = await db.modules.insert_one(doc)
        return {"message": "Module created successfully.", "id": str(result.inserted_id), "image": image_url}
    except Exception as e:
        print(f"ERROR creating module: {e}")
        raise HTTPException(status_code=500, detail="Could not create module.")


@router.put("/{module_id}", summary="Update a module (Admin Only)")
async def update_module(
    module_id: str,
    name: str = Form(...),
    description: Optional[str] = Form(""),
    order: Optional[int] = Form(1),
    is_active: Optional[bool] = Form(True),
    image: Optional[UploadFile] = File(None),
    admin_user: dict = Depends(require_admin)
):
    db = get_db()
    try:
        existing = await db.modules.find_one({"_id": ObjectId(module_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Module not found")

        name_clean = name.strip() if name else "Module"
        update_data = {
            "name": name_clean,
            "title": name_clean,
            "description": description or "",
            "order": int(order) if order is not None else 1,
            "is_active": is_active if is_active is not None else existing.get("is_active", True),
            "updated_at": datetime.utcnow()
        }

        if image and image.filename:
            update_data["image"] = await upload_media_file(image, folder="modules", prefix="module")

        await db.modules.update_one({"_id": ObjectId(module_id)}, {"$set": update_data})
        return {"message": "Module updated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR updating module: {e}")
        raise HTTPException(status_code=500, detail="Could not update module.")


@router.delete("/{module_id}", summary="Delete a module (Admin Only)")
async def delete_module(
    module_id: str,
    admin_user: dict = Depends(require_admin)
):
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
