from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.core.dependencies import get_current_user
from app.services.storage_service import upload_media_file

router = APIRouter(prefix="/api", tags=["Storage & Uploads"])


@router.post("/upload", summary="Upload a media file (Cloudinary / Storage)")
@router.post("/upload/", summary="Upload a media file (Cloudinary / Storage)", include_in_schema=False)
@router.post("/storage/upload", summary="Upload a media file (Cloudinary / Storage)", include_in_schema=False)
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Accepts multipart file upload and securely persists it using Cloudinary (production)
    or local uploads fallback. Accessible to authenticated users (students, instructors, admins).
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided for upload.")

    try:
        url = await upload_media_file(file, folder="lms_uploads", prefix="afb_upload")
        return {
            "message": "File uploaded successfully.",
            "url": url,
            "filename": file.filename,
            "content_type": file.content_type
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(f"[STORAGE UPLOAD ERROR] {e}")
        raise HTTPException(status_code=500, detail="Failed to process uploaded file.")

