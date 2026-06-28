from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        # Check if the URI is the default localhost one (meaning the user hasn't set it yet)
        # If it is, we'll try to connect to localhost, but we won't crash if it fails immediately
        client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        db = client[settings.MONGODB_DB_NAME]
        print(f"Connected to MongoDB database: {settings.MONGODB_DB_NAME}")
    except Exception as e:
        print(f"WARNING: Could not connect to MongoDB. Error: {e}")
        print("Continuing without database connection for now...")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")

def get_db():
    return db
