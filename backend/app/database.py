from urllib.parse import quote_plus, urlparse, urlunparse
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = None
db = None

def _build_safe_uri(uri: str) -> str:
    """
    Automatically URL-encodes the username and password in a MongoDB URI
    so that special characters (like @, #, !, %) don't cause connection errors.
    """
    try:
        parsed = urlparse(uri)
        # Only encode if username/password are present and not already encoded
        if parsed.username and parsed.password:
            safe_user = quote_plus(parsed.username)
            safe_pass = quote_plus(parsed.password)
            # Rebuild netloc with encoded credentials
            host = parsed.hostname
            port = f":{parsed.port}" if parsed.port else ""
            new_netloc = f"{safe_user}:{safe_pass}@{host}{port}"
            safe_uri = urlunparse(parsed._replace(netloc=new_netloc))
            return safe_uri
    except Exception:
        pass
    return uri

async def connect_to_mongo():
    global client, db
    try:
        safe_uri = _build_safe_uri(settings.MONGODB_URI)
        client = AsyncIOMotorClient(safe_uri, serverSelectionTimeoutMS=5000)
        # Ping the server to verify connection before proceeding
        await client.admin.command('ping')
        db = client[settings.MONGODB_DB_NAME]
        print(f"[SUCCESS] Connected to MongoDB database: '{settings.MONGODB_DB_NAME}'")
    except Exception as e:
        print(f"[WARNING] Could not connect to MongoDB. Error: {e}")
        print("   Continuing without database connection. Forms will still work (mock mode).")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")

def get_db():
    return db

