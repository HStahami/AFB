from app.database import get_db
from fastapi import APIRouter

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", summary="Get dashboard summary stats")
async def get_dashboard_stats():
    db = get_db()
    if db is None:
        return {"total": 0, "pending": 0, "approved": 0, "canceled": 0, "total_students": 0, "total_instructors": 0, "total_modules": 0, "total_slots": 0}
    try:
        total = await db.admissions.count_documents({})
        pending = await db.admissions.count_documents({"status": "Pending"})
        approved = await db.admissions.count_documents({"status": "Approved"})
        canceled = await db.admissions.count_documents({"status": "Canceled"})
        total_students = await db.students.count_documents({})
        total_instructors = await db.instructors.count_documents({})
        total_modules = await db.modules.count_documents({})
        total_slots = await db.slots.count_documents({})
        return {
            "total": total,
            "pending": pending,
            "approved": approved,
            "canceled": canceled,
            "total_students": total_students,
            "total_instructors": total_instructors,
            "total_modules": total_modules,
            "total_slots": total_slots
        }
    except Exception as e:
        print(f"ERROR fetching dashboard stats: {e}")
        return {"total": 0, "pending": 0, "approved": 0, "canceled": 0, "total_students": 0, "total_instructors": 0, "total_modules": 0, "total_slots": 0}
