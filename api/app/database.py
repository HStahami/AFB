from urllib.parse import quote_plus, unquote_plus, urlparse, urlunparse
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = None
db = None

def _build_safe_uri(uri: str) -> str:
    """
    Safely sanitizes and URL-encodes MongoDB URI credentials.
    Prevents double-encoding and handles wrapped quotes from env dashboards.
    """
    if not uri or not isinstance(uri, str):
        return uri or "mongodb://localhost:27017"
    
    uri_str = uri.strip()
    if (uri_str.startswith('"') and uri_str.endswith('"')) or (uri_str.startswith("'") and uri_str.endswith("'")):
        uri_str = uri_str[1:-1].strip()

    try:
        parsed = urlparse(uri_str)
        if parsed.username and parsed.password:
            raw_user = unquote_plus(parsed.username)
            raw_pass = unquote_plus(parsed.password)
            safe_user = quote_plus(raw_user)
            safe_pass = quote_plus(raw_pass)
            host = parsed.hostname or ""
            port = f":{parsed.port}" if parsed.port else ""
            new_netloc = f"{safe_user}:{safe_pass}@{host}{port}"
            safe_uri = urlunparse(parsed._replace(netloc=new_netloc))
            return safe_uri
    except Exception:
        pass
    return uri_str

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
    global client, db
    if db is None:
        try:
            safe_uri = _build_safe_uri(settings.MONGODB_URI)
            client = AsyncIOMotorClient(safe_uri, serverSelectionTimeoutMS=5000)
            db = client[settings.MONGODB_DB_NAME]
        except Exception as e:
            print(f"[WARNING] Lazy connect failed: {e}")
    return db

