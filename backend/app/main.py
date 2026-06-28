from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import admissions, students, instructors, contact, auth, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(
    title="AlArabia Fi Buyutikum LMS API",
    description="Backend API for managing admissions, students, instructors, and the admin dashboard.",
    version="1.0.0",
    lifespan=lifespan
)

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
app.include_router(contact.router)

@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "AlArabia Fi Buyutikum API is running!"}
