from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'ctf-writeup-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============= MODELS =============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    username: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class WriteupCreate(BaseModel):
    title: str
    description: str
    content: str  # Markdown content
    difficulty: str  # easy, medium, hard, insane
    tags: List[str]
    platform: str  # htb, offsec, other
    machine_name: Optional[str] = None
    cover_image: Optional[str] = None

class WriteupUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    difficulty: Optional[str] = None
    tags: Optional[List[str]] = None
    platform: Optional[str] = None
    machine_name: Optional[str] = None
    cover_image: Optional[str] = None
    published: Optional[bool] = None

class WriteupResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    content: str
    difficulty: str
    tags: List[str]
    platform: str
    machine_name: Optional[str]
    cover_image: Optional[str]
    author_id: str
    author_name: str
    published: bool
    views: int
    upvotes: int
    downvotes: int
    created_at: str
    updated_at: str

class CommentCreate(BaseModel):
    content: str
    writeup_id: str

class CommentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    content: str
    writeup_id: str
    author_id: str
    author_name: str
    created_at: str

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class ResourceCreate(BaseModel):
    title: str
    description: str
    url: str
    category: str  # tools, tutorials, platforms, communities

class ResourceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    url: str
    category: str
    created_at: str

# ============= AUTH HELPERS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            return None
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        return user
    except:
        return None

# ============= AUTH ROUTES =============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "username": user_data.username,
        "password_hash": hash_password(user_data.password),
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            username=user_data.username,
            created_at=now
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            username=user["username"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        username=current_user["username"],
        created_at=current_user["created_at"]
    )

# ============= WRITEUP ROUTES =============

@api_router.post("/writeups", response_model=WriteupResponse)
async def create_writeup(writeup_data: WriteupCreate, current_user: dict = Depends(get_current_user)):
    writeup_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    writeup_doc = {
        "id": writeup_id,
        "title": writeup_data.title,
        "description": writeup_data.description,
        "content": writeup_data.content,
        "difficulty": writeup_data.difficulty,
        "tags": writeup_data.tags,
        "platform": writeup_data.platform,
        "machine_name": writeup_data.machine_name,
        "cover_image": writeup_data.cover_image,
        "author_id": current_user["id"],
        "author_name": current_user["username"],
        "published": True,
        "views": 0,
        "upvotes": 0,
        "downvotes": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.writeups.insert_one(writeup_doc)
    del writeup_doc["_id"] if "_id" in writeup_doc else None
    
    return WriteupResponse(**writeup_doc)

@api_router.get("/writeups", response_model=List[WriteupResponse])
async def get_writeups(
    search: Optional[str] = None,
    difficulty: Optional[str] = None,
    platform: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 20,
    skip: int = 0
):
    query = {"published": True}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"machine_name": {"$regex": search, "$options": "i"}}
        ]
    
    if difficulty:
        query["difficulty"] = difficulty
    
    if platform:
        query["platform"] = platform
    
    if tag:
        query["tags"] = tag
    
    writeups = await db.writeups.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [WriteupResponse(**w) for w in writeups]

@api_router.get("/writeups/featured", response_model=List[WriteupResponse])
async def get_featured_writeups():
    writeups = await db.writeups.find(
        {"published": True}, 
        {"_id": 0}
    ).sort("upvotes", -1).limit(6).to_list(6)
    return [WriteupResponse(**w) for w in writeups]

@api_router.get("/writeups/{writeup_id}", response_model=WriteupResponse)
async def get_writeup(writeup_id: str):
    writeup = await db.writeups.find_one({"id": writeup_id}, {"_id": 0})
    if not writeup:
        raise HTTPException(status_code=404, detail="Writeup not found")
    
    # Increment views
    await db.writeups.update_one({"id": writeup_id}, {"$inc": {"views": 1}})
    writeup["views"] += 1
    
    return WriteupResponse(**writeup)

@api_router.put("/writeups/{writeup_id}", response_model=WriteupResponse)
async def update_writeup(writeup_id: str, writeup_data: WriteupUpdate, current_user: dict = Depends(get_current_user)):
    writeup = await db.writeups.find_one({"id": writeup_id}, {"_id": 0})
    if not writeup:
        raise HTTPException(status_code=404, detail="Writeup not found")
    
    if writeup["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in writeup_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.writeups.update_one({"id": writeup_id}, {"$set": update_data})
    
    updated = await db.writeups.find_one({"id": writeup_id}, {"_id": 0})
    return WriteupResponse(**updated)

@api_router.delete("/writeups/{writeup_id}")
async def delete_writeup(writeup_id: str, current_user: dict = Depends(get_current_user)):
    writeup = await db.writeups.find_one({"id": writeup_id}, {"_id": 0})
    if not writeup:
        raise HTTPException(status_code=404, detail="Writeup not found")
    
    if writeup["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.writeups.delete_one({"id": writeup_id})
    await db.comments.delete_many({"writeup_id": writeup_id})
    
    return {"message": "Writeup deleted"}

@api_router.post("/writeups/{writeup_id}/vote")
async def vote_writeup(writeup_id: str, vote: str, current_user: dict = Depends(get_current_user)):
    if vote not in ["up", "down"]:
        raise HTTPException(status_code=400, detail="Vote must be 'up' or 'down'")
    
    writeup = await db.writeups.find_one({"id": writeup_id})
    if not writeup:
        raise HTTPException(status_code=404, detail="Writeup not found")
    
    # Check if user already voted
    existing_vote = await db.votes.find_one({"writeup_id": writeup_id, "user_id": current_user["id"]})
    
    if existing_vote:
        if existing_vote["vote"] == vote:
            # Remove vote
            await db.votes.delete_one({"writeup_id": writeup_id, "user_id": current_user["id"]})
            if vote == "up":
                await db.writeups.update_one({"id": writeup_id}, {"$inc": {"upvotes": -1}})
            else:
                await db.writeups.update_one({"id": writeup_id}, {"$inc": {"downvotes": -1}})
            return {"message": "Vote removed"}
        else:
            # Change vote
            await db.votes.update_one(
                {"writeup_id": writeup_id, "user_id": current_user["id"]},
                {"$set": {"vote": vote}}
            )
            if vote == "up":
                await db.writeups.update_one({"id": writeup_id}, {"$inc": {"upvotes": 1, "downvotes": -1}})
            else:
                await db.writeups.update_one({"id": writeup_id}, {"$inc": {"upvotes": -1, "downvotes": 1}})
            return {"message": "Vote changed"}
    else:
        # New vote
        await db.votes.insert_one({
            "id": str(uuid.uuid4()),
            "writeup_id": writeup_id,
            "user_id": current_user["id"],
            "vote": vote
        })
        if vote == "up":
            await db.writeups.update_one({"id": writeup_id}, {"$inc": {"upvotes": 1}})
        else:
            await db.writeups.update_one({"id": writeup_id}, {"$inc": {"downvotes": 1}})
        return {"message": "Vote added"}

@api_router.get("/writeups/{writeup_id}/user-vote")
async def get_user_vote(writeup_id: str, current_user: dict = Depends(get_current_user)):
    vote = await db.votes.find_one({"writeup_id": writeup_id, "user_id": current_user["id"]}, {"_id": 0})
    return {"vote": vote["vote"] if vote else None}

# ============= COMMENT ROUTES =============

@api_router.post("/comments", response_model=CommentResponse)
async def create_comment(comment_data: CommentCreate, current_user: dict = Depends(get_current_user)):
    writeup = await db.writeups.find_one({"id": comment_data.writeup_id})
    if not writeup:
        raise HTTPException(status_code=404, detail="Writeup not found")
    
    comment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    comment_doc = {
        "id": comment_id,
        "content": comment_data.content,
        "writeup_id": comment_data.writeup_id,
        "author_id": current_user["id"],
        "author_name": current_user["username"],
        "created_at": now
    }
    
    await db.comments.insert_one(comment_doc)
    
    return CommentResponse(**comment_doc)

@api_router.get("/comments/{writeup_id}", response_model=List[CommentResponse])
async def get_comments(writeup_id: str):
    comments = await db.comments.find({"writeup_id": writeup_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [CommentResponse(**c) for c in comments]

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user: dict = Depends(get_current_user)):
    comment = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.comments.delete_one({"id": comment_id})
    return {"message": "Comment deleted"}

# ============= RESOURCE ROUTES =============

@api_router.post("/resources", response_model=ResourceResponse)
async def create_resource(resource_data: ResourceCreate, current_user: dict = Depends(get_current_user)):
    resource_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    resource_doc = {
        "id": resource_id,
        "title": resource_data.title,
        "description": resource_data.description,
        "url": resource_data.url,
        "category": resource_data.category,
        "created_at": now
    }
    
    await db.resources.insert_one(resource_doc)
    
    return ResourceResponse(**resource_doc)

@api_router.get("/resources", response_model=List[ResourceResponse])
async def get_resources(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    
    resources = await db.resources.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [ResourceResponse(**r) for r in resources]

@api_router.delete("/resources/{resource_id}")
async def delete_resource(resource_id: str, current_user: dict = Depends(get_current_user)):
    await db.resources.delete_one({"id": resource_id})
    return {"message": "Resource deleted"}

# ============= CONTACT ROUTE =============

@api_router.post("/contact")
async def submit_contact(message: ContactMessage):
    contact_doc = {
        "id": str(uuid.uuid4()),
        "name": message.name,
        "email": message.email,
        "subject": message.subject,
        "message": message.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.contact_messages.insert_one(contact_doc)
    return {"message": "Message sent successfully"}

# ============= STATS ROUTE =============

@api_router.get("/stats")
async def get_stats():
    writeup_count = await db.writeups.count_documents({"published": True})
    user_count = await db.users.count_documents({})
    
    # Get all tags
    pipeline = [
        {"$match": {"published": True}},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    tags = await db.writeups.aggregate(pipeline).to_list(10)
    
    return {
        "writeup_count": writeup_count,
        "user_count": user_count,
        "popular_tags": [{"tag": t["_id"], "count": t["count"]} for t in tags]
    }

@api_router.get("/")
async def root():
    return {"message": "ZeroDay.log API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
