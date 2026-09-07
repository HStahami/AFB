from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_db
from app.models import AdmissionCreate, FeeStatusUpdate
from app.core.dependencies import require_admin
from app.core.security import hash_password
from app.services.email_service import send_admission_alert, send_email
from app.services.whatsapp_service import send_whatsapp_admission_alert
from app.services.credential_service import generate_secure_temporary_password, send_student_credentials
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/admissions", tags=["Admissions"])


@router.post("/", summary="Submit a new admission form (Public)")
async def submit_admission(data: AdmissionCreate):
    db = get_db()

    document = {
        **data.model_dump(),
        "status": "Pending",
        "fee_status": "pending",
        "created_at": datetime.utcnow()
    }

    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admission service is temporarily unavailable. Please try again later."
        )

    try:
        result = await db.admissions.insert_one(document)
        form_id = str(result.inserted_id)
    except Exception as e:
        print(f"[ADMISSION ERROR] Could not save admission to DB: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admission service is temporarily unavailable. Please try again later."
        )

    student_name = f"{data.first_name} {data.last_name}"
    send_admission_alert(student_name, data.email, data.phone, form_id)
    await send_whatsapp_admission_alert(student_name, data.email, data.phone, form_id)

    return {"message": "Application submitted successfully!", "form_id": form_id}



@router.get("/", summary="Get all admission forms (Admin Only)")
async def get_all_admissions(admin_user: dict = Depends(require_admin)):
    db = get_db()
    if db is None:
        return []
    try:
        admissions = []
        async for doc in db.admissions.find().sort("created_at", -1):
            doc["_id"] = str(doc["_id"])
            if "fee_status" not in doc:
                doc["fee_status"] = "pending"
            admissions.append(doc)
        return admissions
    except Exception as e:
        print(f"ERROR fetching admissions: {e}")
        return []


@router.patch("/{form_id}/fee-status", summary="Update fee payment status for an admission (Admin Only)")
async def update_fee_status(
    form_id: str,
    data: FeeStatusUpdate,
    admin_user: dict = Depends(require_admin)
):
    db = get_db()
    allowed_statuses = ["pending", "paid", "verified", "waived", "failed"]
    if data.fee_status.lower() not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid fee status. Allowed: {allowed_statuses}"
        )

    try:
        result = await db.admissions.update_one(
            {"_id": ObjectId(form_id)},
            {"$set": {"fee_status": data.fee_status.lower(), "fee_updated_at": datetime.utcnow()}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Admission form not found")
        return {"message": f"Fee status updated to '{data.fee_status.lower()}'"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR updating fee status: {e}")
        raise HTTPException(status_code=500, detail="Could not update fee status.")


@router.patch("/{form_id}/send-fee-email", summary="Send fee payment instructions to student (Admin Only)")
async def send_fee_email(form_id: str, admin_user: dict = Depends(require_admin)):
    db = get_db()
    try:
        doc = await db.admissions.find_one({"_id": ObjectId(form_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Form not found")

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
        await db.admissions.update_one(
            {"_id": ObjectId(form_id)},
            {"$set": {"status": "Fee Email Sent"}}
        )
        return {"message": "Fee email sent successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR sending fee email: {e}")
        raise HTTPException(status_code=500, detail="Could not send fee email.")


@router.patch("/{form_id}/approve", summary="Approve admission & provision student account (Admin Only)")
async def approve_admission(form_id: str, admin_user: dict = Depends(require_admin)):
    """
    Approves admission, generates unique sequential student code,
    provisions student user account with Argon2id hash, and delivers temporary credentials.
    Idempotent: Re-approval does not duplicate records or overwrite credentials.
    """
    db = get_db()
    try:
        doc = await db.admissions.find_one({"_id": ObjectId(form_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Admission form not found")

        student_name = f"{doc['first_name']} {doc['last_name']}"
        student_email = doc['email'].strip().lower()

        # 1. Check for existing approved student record (Idempotency)
        existing_student = await db.students.find_one({"admission_id": form_id})
        if existing_student:
            student_code = existing_student.get("student_code")
            # Ensure user account exists
            user = await db.users.find_one({"student_code": student_code})
            if not user:
                user = await db.users.find_one({"email": student_email})
            return {
                "message": "Admission already approved. Existing student and user account preserved.",
                "student_code": student_code,
                "is_new": False
            }

        # 2. Generate Unique Sequential Student Code (AFB-YYYY-XXXX)
        current_year = datetime.utcnow().year
        total_count = await db.students.count_documents({}) + 1
        student_code = f"AFB-{current_year}-{total_count:04d}"
        while (
            await db.students.find_one({"student_code": student_code})
            or await db.users.find_one({"student_code": student_code})
        ):
            total_count += 1
            student_code = f"AFB-{current_year}-{total_count:04d}"

        # 3. Generate Temporary Password & Hash (Plaintext NEVER stored in DB)
        temp_password = generate_secure_temporary_password(10)
        password_hash = hash_password(temp_password)

        # 4. Create User Record in `users`
        existing_user = await db.users.find_one({
            "$or": [
                {"email": student_email},
                {"username": student_code}
            ]
        })

        if existing_user:
            user_id = existing_user["_id"]
            await db.users.update_one(
                {"_id": user_id},
                {"$set": {"student_code": student_code, "role": "student"}}
            )
        else:
            user_doc = {
                "username": student_code,
                "email": student_email,
                "password_hash": password_hash,
                "role": "student",
                "status": "active",
                "first_login": True,
                "profile_completed": False,
                "student_code": student_code,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            res_user = await db.users.insert_one(user_doc)
            user_id = res_user.inserted_id

        # 5. Create Student Record in `students`
        student_doc = {
            **{k: v for k, v in doc.items() if k not in ["_id", "status"]},
            "admission_id": form_id,
            "student_code": student_code,
            "user_id": user_id,
            "status": "Active",
            "fee_status": doc.get("fee_status", "verified"),
            "slot": None,
            "instructor": None,
            "instructor_id": None,
            "slot_id": None,
            "approved_at": datetime.utcnow()
        }
        res_student = await db.students.insert_one(student_doc)
        new_student_id = res_student.inserted_id

        # 6. Update Admission Status
        await db.admissions.update_one(
            {"_id": ObjectId(form_id)},
            {"$set": {"status": "Approved", "fee_status": doc.get("fee_status", "verified")}}
        )

        # 7. Deliver Credentials via Email Service
        send_student_credentials(student_name, student_email, student_code, temp_password)

        # 8. Send Notification to User
        await create_notification(
            db=db,
            recipient_user_id=user_id,
            title="Welcome to AlArabia Fi Buyutikum!",
            message=f"Your admission is confirmed with Student ID {student_code}. Please change your password and complete your profile.",
            notification_type="system",
            related_entity_type="admission",
            related_entity_id=form_id
        )

        return {
            "message": "Admission approved, student code generated, user account provisioned, and credentials sent.",
            "student_code": student_code,
            "is_new": True
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR approving admission: {e}")
        raise HTTPException(status_code=500, detail="Could not approve admission.")


@router.patch("/{form_id}/cancel", summary="Cancel a student admission (Admin Only)")
async def cancel_admission(form_id: str, admin_user: dict = Depends(require_admin)):
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
