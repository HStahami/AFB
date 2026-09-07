from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import (
    admissions, students, instructors, modules, slots, contact, auth, dashboard,
    enrollments, tasks, submissions, assessments, attendance, notifications, resources, reports, storage
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        os.makedirs("uploads", exist_ok=True)
    except Exception:
        pass
    await connect_to_mongo()
    # Idempotent DB initialization (admin account bootstrap, indexes, status flags)
    try:
        from app.database import get_db
        from app.core.init_db import init_database
        await init_database(get_db())
    except Exception as e:
        print(f"[INIT DB WARNING] Startup init encountered note: {e}")
    yield
    await close_mongo_connection()

app = FastAPI(
    title="AlArabia Fi Buyutikum LMS API",
    description="Backend API for managing admissions, students, instructors, modules, slots, and the admin dashboard.",
    version="1.0.0",
    lifespan=lifespan
)

try:
    os.makedirs("uploads", exist_ok=True)
    if os.path.exists("uploads"):
        app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
except Exception:
    pass

from app.config import settings

# Configure CORS with support for local dev, Vercel preview/production, and custom domains
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
if settings.ALLOWED_ORIGINS:
    for orig in settings.ALLOWED_ORIGINS.split(","):
        if orig.strip() and orig.strip() not in allowed_origins:
            allowed_origins.append(orig.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if settings.ALLOWED_ORIGINS else ["*"],
    allow_origin_regex=r"^https?:\/\/.*$" if not settings.ALLOWED_ORIGINS else None,
    allow_credentials=False if not settings.ALLOWED_ORIGINS else True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def normalize_api_path(request, call_next):
    """
    Ensures that if Vercel serverless rewrites strip '/api', internal FastAPI
    routing routes the request seamlessly to the registered router endpoints.
    """
    path = request.scope.get("path", "")
    prefixes = [
        "/auth", "/dashboard", "/admissions", "/students", "/instructors",
        "/modules", "/slots", "/contact", "/enrollments", "/tasks",
        "/submissions", "/assessments", "/attendance", "/notifications",
        "/resources", "/reports", "/storage"
    ]
    if not path.startswith("/api") and any(path.startswith(p) for p in prefixes):
        request.scope["path"] = f"/api{path}"
    return await call_next(request)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Include all routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(admissions.router)
app.include_router(students.router)
app.include_router(instructors.router)
app.include_router(modules.router)
app.include_router(slots.router)
app.include_router(contact.router)
app.include_router(enrollments.router)
app.include_router(tasks.router)
app.include_router(submissions.router)
app.include_router(assessments.router)
app.include_router(attendance.router)
app.include_router(notifications.router)
app.include_router(resources.router)
app.include_router(reports.router)
app.include_router(storage.router)

from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

@app.get("/api/health", tags=["Health"])
@app.get("/health", tags=["Health"])
async def health_check():
    db_status = "unknown"
    db_error = None
    try:
        from app.database import get_db
        db = get_db()
        if db is not None:
            await db.command("ping")
            db_status = "connected"
        else:
            db_status = "db_is_none"
    except Exception as e:
        db_status = "error"
        db_error = str(e)

    return {
        "status": "ok",
        "database": db_status,
        "database_error": db_error,
        "environment": settings.ENVIRONMENT,
        "mongodb_configured": bool(settings.MONGODB_URI and "localhost" not in settings.MONGODB_URI)
    }


if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", tags=["Frontend"])
    async def serve_spa(full_path: str = ""):
        if full_path.startswith("api") or full_path.startswith("uploads") or full_path in ["docs", "redoc", "openapi.json", "health"]:
            return {"detail": "Not Found"}
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/", tags=["Health"])
    async def root():
        return {"status": "ok", "message": "AlArabia Fi Buyutikum API is running!"}
