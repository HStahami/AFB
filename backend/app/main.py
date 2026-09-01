from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import admissions, students, instructors, modules, slots, contact, auth, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("uploads", exist_ok=True)
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(
    title="AlArabia Fi Buyutikum LMS API",
    description="Backend API for managing admissions, students, instructors, modules, slots, and the admin dashboard.",
    version="1.0.0",
    lifespan=lifespan
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(admissions.router)
app.include_router(students.router)
app.include_router(instructors.router)
app.include_router(modules.router)
app.include_router(slots.router)
app.include_router(contact.router)

from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", tags=["Frontend"])
    async def serve_spa(full_path: str = ""):
        if full_path.startswith("api") or full_path.startswith("uploads") or full_path in ["docs", "redoc", "openapi.json"]:
            return {"detail": "Not Found"}
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/", tags=["Health"])
    async def root():
        return {"status": "ok", "message": "AlArabia Fi Buyutikum API is running!"}
