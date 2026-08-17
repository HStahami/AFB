from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.models import AdmissionCreate
from app.services.email_service import send_admission_alert
from app.services.whatsapp_service import send_whatsapp_admission_alert

router = APIRouter(prefix="/api/admissions", tags=["Admissions"])

@router.post("/", summary="Submit a new admission form")
async def submit_admission(data: AdmissionCreate):
    db = get_db()

    document = {
        **data.model_dump(),
        "status": "Pending",
        "created_at": datetime.utcnow()
    }

    # Save to DB (graceful degradation if DB is down)
    form_id = "MOCK-ID"
    try:
        if db is not None:
            result = await db.admissions.insert_one(document)
            form_id = str(result.inserted_id)
    except Exception as e:
        print(f"ERROR: Could not save admission to DB. Error: {e}")

    student_name = f"{data.first_name} {data.last_name}"

    # Send alerts (errors won't crash the request)
    send_admission_alert(student_name, data.email, data.phone, form_id)
    send_whatsapp_admission_alert(student_name, data.email, data.phone, form_id)

    return {"message": "Application submitted successfully!", "form_id": form_id}


@router.get("/", summary="Get all admission forms (Admin)")
async def get_all_admissions():
    db = get_db()
    if db is None:
        return []
    try:
        admissions = []
        async for doc in db.admissions.find().sort("created_at", -1):
            doc["_id"] = str(doc["_id"])
            admissions.append(doc)
        return admissions
    except Exception as e:
        print(f"ERROR fetching admissions: {e}")
        return []


@router.patch("/{form_id}/send-fee-email", summary="Send fee payment instructions to student")
async def send_fee_email(form_id: str):
    db = get_db()
    try:
        doc = await db.admissions.find_one({"_id": ObjectId(form_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Form not found")
        
        from app.services.email_service import send_email
        subject = "Fee Payment Instructions - AlArabia Fi Buyutikum"
        body = f"""Dear {doc['first_name']} {doc['last_name']},

Thank you for your interest in AlArabia Fi Buyutikum!

Please proceed with the fee payment using the following details:
[Add your payment instructions here]

Once payment is made, your admission will be confirmed within 24 hours.

JazakAllah Khair,
Team AlArabia Fi Buyutikum
"""
        send_email(doc['email'], subject, body)
        await db.admissions.update_one({"_id": ObjectId(form_id)}, {"$set": {"status": "Fee Email Sent"}})
        return {"message": "Fee email sent successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR sending fee email: {e}")
        raise HTTPException(status_code=500, detail="Could not send fee email.")


@router.patch("/{form_id}/approve", summary="Approve a student admission")
async def approve_admission(form_id: str):
    db = get_db()
    try:
        doc = await db.admissions.find_one({"_id": ObjectId(form_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Form not found")

        # Create student record from admission
        student = {
            **{k: v for k, v in doc.items() if k != "_id"},
            "admission_id": form_id,
            "status": "Active",
            "slot": None,
            "instructor": None,
            "approved_at": datetime.utcnow()
        }
        await db.students.insert_one(student)
        await db.admissions.update_one({"_id": ObjectId(form_id)}, {"$set": {"status": "Approved"}})

        # Send confirmation email
        from app.services.email_service import send_email
        subject = "Admission Confirmed - AlArabia Fi Buyutikum"
        body = f"""Dear {doc['first_name']} {doc['last_name']},

We are pleased to inform you that your admission to AlArabia Fi Buyutikum has been CONFIRMED!

We will shortly assign you a slot and instructor and notify you with all the details.

JazakAllah Khair,
AlArabia Fi Buyutikum Team
"""
        send_email(doc['email'], subject, body)
        return {"message": "Admission approved and student record created."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR approving admission: {e}")
        raise HTTPException(status_code=500, detail="Could not approve admission.")


@router.patch("/{form_id}/cancel", summary="Cancel a student admission")
async def cancel_admission(form_id: str):
    db = get_db()
    try:
        result = await db.admissions.update_one(
            {"_id": ObjectId(form_id)},
            {"$set": {"status": "Canceled"}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Form not found")
        return {"message": "Admission canceled."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR canceling admission: {e}")
        raise HTTPException(status_code=500, detail="Could not cancel admission.")
