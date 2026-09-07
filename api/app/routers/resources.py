from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_db
from app.models import ResourceCreate, ResourceResponse
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/api/resources", tags=["Resources"])


def _format_resource(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc["_id"] = str(doc["_id"])
    if doc.get("module_id"):
        doc["module_id"] = str(doc["module_id"])
    if doc.get("instructor_id"):
        doc["instructor_id"] = str(doc["instructor_id"])
    return doc


@router.post("/", summary="Add a learning resource/material (Instructor or Admin)")
async def create_resource(
    data: ResourceCreate,
    current_user: dict = Depends(require_roles(["instructor", "admin"]))
):
    db = get_db()
    try:
        module_oid = ObjectId(data.module_id)
        module = await db.modules.find_one({"_id": module_oid})
        if not module:
            raise HTTPException(status_code=404, detail="Module not found.")

        inst_oid = None
        if current_user.get("role") == "instructor":
            instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
            if instructor:
                inst_oid = instructor["_id"]
        else:
            inst_oid = current_user["_id"]

        resource_doc = {
            "module_id": module_oid,
            "instructor_id": inst_oid,
            "title": data.title,
            "description": data.description,
            "type": data.type or "document",
            "url": data.url,
            "storage_provider": data.storage_provider or "cloudinary",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        res = await db.resources.insert_one(resource_doc)
        resource_doc["_id"] = res.inserted_id
        return _format_resource(resource_doc)
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR creating resource: {e}")
        raise HTTPException(status_code=500, detail="Could not create resource.")


@router.get("/", summary="List learning resources (Scoped by enrollments)")
async def list_resources(
    module_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    role = current_user.get("role")
    query = {}

    if module_id:
        try:
            query["module_id"] = ObjectId(module_id)
        except Exception:
            pass

    if role == "student":
        student = await db.students.find_one({"user_id": current_user["_id"]})
        if not student:
            student = await db.students.find_one({"email": current_user.get("email")})
        if not student:
            return []
        
        # Enrolled modules from db.enrollments and student record
        enrolled_module_ids = [
            enr["module_id"] async for enr in db.enrollments.find({"student_id": student["_id"], "status": "active"})
            if enr.get("module_id")
        ]
        if student.get("module_id"):
            try:
                st_mod_oid = student["module_id"] if isinstance(student["module_id"], ObjectId) else ObjectId(student["module_id"])
                if st_mod_oid not in enrolled_module_ids:
                    enrolled_module_ids.append(st_mod_oid)
            except Exception:
                pass

        if module_id:
            try:
                target_mod_oid = ObjectId(module_id)
                if enrolled_module_ids and target_mod_oid not in enrolled_module_ids:
                    return []
            except Exception:
                return []
        else:
            if enrolled_module_ids:
                query["$or"] = [
                    {"module_id": {"$in": enrolled_module_ids}},
                    {"module_id": None}
                ]

    resources = []
    async for doc in db.resources.find(query).sort("created_at", -1):
        item = _format_resource(doc)
        if doc.get("module_id"):
            mod = await db.modules.find_one({"_id": doc["module_id"]})
            item["module_title"] = mod.get("title") if mod else "Course Material"
        else:
            item["module_title"] = "General Material"
        resources.append(item)
    return resources


@router.delete("/{id}", summary="Delete resource (Instructor or Admin)")
async def delete_resource(
    id: str,
    current_user: dict = Depends(require_roles(["instructor", "admin"]))
):
    db = get_db()
    try:
        res_oid = ObjectId(id)
        doc = await db.resources.find_one({"_id": res_oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Resource not found.")

        if current_user.get("role") == "instructor":
            instructor = await db.instructors.find_one({"user_id": current_user["_id"]})
            if not instructor or doc.get("instructor_id") != instructor["_id"]:
                raise HTTPException(status_code=403, detail="Access denied: Cannot delete other instructors' resources.")

        await db.resources.delete_one({"_id": res_oid})
        return {"message": "Resource deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR deleting resource: {e}")
        raise HTTPException(status_code=500, detail="Could not delete resource.")
