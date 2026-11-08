from datetime import datetime, timezone
import random
import string
from typing import Optional, Dict, Any, List
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, Body, status
from pydantic import BaseModel, Field

from app.database import get_db
from app.core.dependencies import get_current_user
from app.services.typing_curriculum import (
    get_all_200_levels,
    get_level_by_id,
    STAGES,
    FINGER_MAPPINGS
)

router = APIRouter(prefix="/api/typing", tags=["Arabic Typing Lab"])


def _clean_doc(doc):
    if isinstance(doc, dict):
        cleaned = {}
        for k, v in doc.items():
            if k == "_id" or isinstance(v, ObjectId):
                cleaned[k] = str(v)
            elif isinstance(v, list):
                cleaned[k] = [_clean_doc(item) for item in v]
            elif isinstance(v, dict):
                cleaned[k] = _clean_doc(v)
            else:
                cleaned[k] = v
        if "_id" in cleaned and "id" not in cleaned:
            cleaned["id"] = cleaned["_id"]
        return cleaned
    elif isinstance(doc, list):
        return [_clean_doc(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    return doc


def _format_arabic_time(total_seconds: float) -> str:
    total_seconds = int(total_seconds)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    if hours > 0:
        return f"{hours} ساعة و {minutes} دقيقة"
    elif minutes > 0:
        return f"{minutes} دقيقة"
    else:
        return f"{total_seconds} ثانية"


def _format_arabic_date(dt: datetime) -> str:
    # Arabic months
    months_ar = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ]
    day = dt.strftime("%d")
    month = months_ar[dt.month - 1]
    year = dt.strftime("%Y")
    return f"{day} {month} {year} م"


class LevelSubmitPayload(BaseModel):
    level_id: int = Field(..., ge=1, le=200)
    wpm: float = Field(..., ge=0)
    accuracy: float = Field(..., ge=0, le=100)
    time_taken_seconds: float = Field(..., ge=0)
    errors_count: int = Field(0, ge=0)


@router.get("/stages", summary="Get all 10 stages of Arabic Typing")
async def get_stages():
    return {
        "success": True,
        "total_stages": len(STAGES),
        "total_levels": 200,
        "stages": STAGES
    }


@router.get("/finger-mappings", summary="Get keyboard finger layout hints")
async def get_finger_mappings():
    return {
        "success": True,
        "mappings": FINGER_MAPPINGS
    }


@router.get("/levels", summary="Get metadata of all 200 progressive levels")
async def get_levels(include_text: bool = Query(False, description="Include full level practice text")):
    all_levels = get_all_200_levels()
    if include_text:
        return {"success": True, "total": len(all_levels), "levels": all_levels}
    
    # Return compact summary for roadmap navigation
    summary = []
    for l in all_levels:
        summary.append({
            "level_id": l["level_id"],
            "stage_id": l["stage_id"],
            "stage_title": l["stage_title"],
            "title": l["title"],
            "target_keys": l["target_keys"],
            "min_accuracy": l["min_accuracy"],
            "min_wpm": l["min_wpm"],
            "char_count": len(l["text"])
        })
    return {"success": True, "total": len(summary), "levels": summary}


@router.get("/level/{level_id}", summary="Get full details for a specific level")
async def get_single_level(level_id: int):
    level = get_level_by_id(level_id)
    if not level:
        raise HTTPException(status_code=404, detail="المستوى المطلوب غير موجود")
    return {"success": True, "level": level}


@router.get("/progress", summary="Get current student's typing progress")
async def get_student_progress(current_user: Optional[dict] = Depends(get_current_user)):
    db = get_db()
    if not current_user or db is None:
        # Default guest progress
        return {
            "success": True,
            "is_guest": True,
            "current_level": 1,
            "completed_levels": {},
            "total_practice_seconds": 0,
            "avg_wpm": 0,
            "avg_accuracy": 0,
            "certificate_unlocked": False,
            "certificate_id": None
        }

    user_id = str(current_user.get("_id") or current_user.get("id"))
    email = current_user.get("email")

    progress = await db.typing_progress.find_one({
        "$or": [{"student_id": user_id}, {"email": email}]
    })

    if not progress:
        # Initialize empty progress
        progress = {
            "student_id": user_id,
            "email": email,
            "current_level": 1,
            "completed_levels": {},
            "total_practice_seconds": 0,
            "avg_wpm": 0.0,
            "avg_accuracy": 0.0,
            "certificate_unlocked": False,
            "certificate_id": None,
            "certificate_issued_at": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.typing_progress.insert_one(progress)

    return {"success": True, "is_guest": False, "progress": _clean_doc(progress)}


@router.post("/submit-result", summary="Submit completed typing level result")
async def submit_typing_result(
    payload: LevelSubmitPayload,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="قاعدة البيانات غير متصلة")

    level = get_level_by_id(payload.level_id)
    if not level:
        raise HTTPException(status_code=404, detail="المستوى غير موجود")

    user_id = str(current_user.get("_id") or current_user.get("id"))
    email = current_user.get("email")

    # Evaluate pass/fail criteria
    passed = payload.accuracy >= level["min_accuracy"] and payload.wpm >= level["min_wpm"]
    
    # Calculate stars (1 to 3)
    stars = 0
    if passed:
        stars = 1
        if payload.accuracy >= 95 and payload.wpm >= (level["min_wpm"] + 5):
            stars = 2
        if payload.accuracy >= 98 and payload.wpm >= (level["min_wpm"] + 10):
            stars = 3

    # Load or init progress
    progress = await db.typing_progress.find_one({
        "$or": [{"student_id": user_id}, {"email": email}]
    })

    now = datetime.now(timezone.utc)
    if not progress:
        progress = {
            "student_id": user_id,
            "email": email,
            "current_level": 1,
            "completed_levels": {},
            "total_practice_seconds": 0,
            "avg_wpm": 0.0,
            "avg_accuracy": 0.0,
            "certificate_unlocked": False,
            "certificate_id": None,
            "certificate_issued_at": None,
            "created_at": now,
            "updated_at": now
        }

    completed_map = progress.get("completed_levels", {})
    lvl_key = str(payload.level_id)
    current_lvl = progress.get("current_level", 1)
    
    # Update total practice time
    total_time = progress.get("total_practice_seconds", 0) + payload.time_taken_seconds

    cert_unlocked = progress.get("certificate_unlocked", False)
    cert_id = progress.get("certificate_id")
    cert_issued_at = progress.get("certificate_issued_at")

    if passed:
        prev_record = completed_map.get(lvl_key, {})
        best_wpm = max(prev_record.get("best_wpm", 0), payload.wpm)
        best_acc = max(prev_record.get("best_accuracy", 0), payload.accuracy)
        best_stars = max(prev_record.get("stars", 0), stars)

        completed_map[lvl_key] = {
            "level_id": payload.level_id,
            "wpm": payload.wpm,
            "accuracy": payload.accuracy,
            "best_wpm": best_wpm,
            "best_accuracy": best_acc,
            "stars": best_stars,
            "completed_at": now.isoformat()
        }

        # Advance current level if at edge
        if payload.level_id == current_lvl and current_lvl < 200:
            current_lvl = payload.level_id + 1

        # Check Level 200 completion for Official Certificate Award!
        if payload.level_id == 200 or len(completed_map) >= 200:
            if not cert_unlocked or not cert_id:
                cert_unlocked = True
                # Generate unique verifiable certificate ID: e.g. CERT-AR-948210
                rand_suffix = "".join(random.choices(string.digits, k=6))
                cert_id = f"CERT-AR-{rand_suffix}"
                cert_issued_at = now

    # Recalculate dynamic aggregate averages across all completed levels
    if completed_map:
        avg_wpm = round(sum(item.get("wpm", 0) for item in completed_map.values()) / len(completed_map), 1)
        avg_acc = round(sum(item.get("accuracy", 0) for item in completed_map.values()) / len(completed_map), 1)
    else:
        avg_wpm = 0.0
        avg_acc = 0.0

    update_doc = {
        "current_level": current_lvl,
        "completed_levels": completed_map,
        "total_practice_seconds": total_time,
        "avg_wpm": avg_wpm,
        "avg_accuracy": avg_acc,
        "certificate_unlocked": cert_unlocked,
        "certificate_id": cert_id,
        "certificate_issued_at": cert_issued_at,
        "updated_at": now
    }

    await db.typing_progress.update_one(
        {"$or": [{"student_id": user_id}, {"email": email}]},
        {"$set": update_doc},
        upsert=True
    )

    return {
        "success": True,
        "passed": passed,
        "stars": stars,
        "current_level": current_lvl,
        "certificate_unlocked": cert_unlocked,
        "certificate_id": cert_id,
        "stats": {
            "wpm": payload.wpm,
            "accuracy": payload.accuracy,
            "total_practice_time": _format_arabic_time(total_time),
            "avg_wpm": avg_wpm,
            "avg_accuracy": avg_acc,
            "completed_count": len(completed_map)
        }
    }


@router.get("/certificate", summary="Get official certificate data for student")
async def get_student_certificate(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="قاعدة البيانات غير متصلة")

    user_id = str(current_user.get("_id") or current_user.get("id"))
    email = current_user.get("email")

    progress = await db.typing_progress.find_one({
        "$or": [{"student_id": user_id}, {"email": email}]
    })

    # If student has not passed level 200 yet
    if not progress or not progress.get("certificate_unlocked"):
        # For development / preview purposes, if requested, return sample or lock notice
        unlocked = False
        cert_id = "CERT-AR-PREVIEW"
        issue_date = _format_arabic_date(datetime.now(timezone.utc))
        avg_wpm = progress.get("avg_wpm", 52.0) if progress else 52.0
        avg_acc = progress.get("avg_accuracy", 98.5) if progress else 98.5
        total_time = progress.get("total_practice_seconds", 67200) if progress else 67200
    else:
        unlocked = True
        cert_id = progress.get("certificate_id")
        dt = progress.get("certificate_issued_at") or datetime.now(timezone.utc)
        issue_date = _format_arabic_date(dt)
        avg_wpm = progress.get("avg_wpm", 0.0)
        avg_acc = progress.get("avg_accuracy", 0.0)
        total_time = progress.get("total_practice_seconds", 0)

    # Resolve student name and code from user/student profile
    student_doc = await db.students.find_one({"$or": [{"user_id": user_id}, {"email": email}]})
    
    first_name = current_user.get("first_name", "")
    last_name = current_user.get("last_name", "")
    full_name = f"{first_name} {last_name}".strip() or current_user.get("name") or current_user.get("full_name")
    
    if not full_name and student_doc:
        full_name = student_doc.get("full_name") or f"{student_doc.get('first_name', '')} {student_doc.get('last_name', '')}".strip()

    if not full_name:
        full_name = "طالب مميز"

    student_code = (
        (student_doc and student_doc.get("student_code")) or
        current_user.get("student_code") or
        f"AFB-2026-{user_id[-4:].upper()}"
    )

    return {
        "success": True,
        "unlocked": unlocked,
        "certificate": {
            "student_name": full_name,
            "student_code": student_code,
            "certificate_id": cert_id,
            "avg_accuracy": f"{avg_acc}%",
            "avg_wpm": f"{int(avg_wpm)} كلمة في الدقيقة",
            "total_time": _format_arabic_time(total_time),
            "issue_date": issue_date,
            "is_verified": True,
            "issuing_bodies": ["مؤسسة العربية في بيوتكم", "مؤسسة إمام"]
        }
    }


@router.get("/verify/{certificate_id}", summary="Public verification for any issued certificate")
async def verify_certificate_public(certificate_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="قاعدة البيانات غير متصلة")

    cid = certificate_id.strip()
    progress = await db.typing_progress.find_one({"certificate_id": cid})

    if not progress:
        return {
            "success": False,
            "valid": False,
            "message": "عذراً، رقم الشهادة المدخل غير مسجل في السجلات الرسمية للأكاديمية."
        }

    user_id = progress.get("student_id")
    email = progress.get("email")

    user_doc = None
    if user_id:
        try:
            user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            user_doc = await db.users.find_one({"id": user_id})

    student_doc = await db.students.find_one({"$or": [{"user_id": user_id}, {"email": email}]})

    full_name = "طالب معتمد"
    if user_doc:
        full_name = f"{user_doc.get('first_name', '')} {user_doc.get('last_name', '')}".strip() or user_doc.get("name")
    elif student_doc:
        full_name = student_doc.get("full_name") or f"{student_doc.get('first_name', '')} {student_doc.get('last_name', '')}".strip()

    student_code = (
        (student_doc and student_doc.get("student_code")) or
        f"AFB-2026-{(user_id or '0000')[-4:].upper()}"
    )

    dt = progress.get("certificate_issued_at") or datetime.now(timezone.utc)

    return {
        "success": True,
        "valid": True,
        "certificate": {
            "certificate_id": cid,
            "student_name": full_name,
            "student_code": student_code,
            "levels_completed": f"{len(progress.get('completed_levels', {}))} / 200",
            "avg_wpm": f"{int(progress.get('avg_wpm', 0))} كلمة في الدقيقة",
            "avg_accuracy": f"{progress.get('avg_accuracy', 0)}%",
            "total_time": _format_arabic_time(progress.get("total_practice_seconds", 0)),
            "issue_date": _format_arabic_date(dt),
            "status": "معتمد وموثق رسمياً",
            "issuing_bodies": ["مؤسسة العربية في بيوتكم", "مؤسسة إمام"]
        }
    }
