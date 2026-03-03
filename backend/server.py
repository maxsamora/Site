from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, UploadFile, File, Header
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import hashlib
import time
import uuid
import re
import html
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Admin credentials from environment - NEVER expose these
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
ADMIN_IP_ALLOWLIST = [ip.strip() for ip in os.environ.get('ADMIN_IP_ALLOWLIST', '').split(',') if ip.strip()]

# Validate admin credentials exist
if not ADMIN_USERNAME or not ADMIN_PASSWORD:
    raise RuntimeError("ADMIN_USERNAME and ADMIN_PASSWORD must be set in environment variables")

# Upload settings
UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
ALLOWED_MIME_TYPES = {'image/png', 'image/jpeg', 'image/webp'}

# Rate limiting storage
rate_limit_storage: Dict[str, List[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 30  # requests per window

# Comment-specific rate limiting
comment_rate_limit: Dict[str, List[float]] = defaultdict(list)
COMMENT_RATE_LIMIT_WINDOW = 60  # seconds
COMMENT_RATE_LIMIT_MAX = 5  # comments per minute per IP

# Vote rate limiting
vote_rate_limit: Dict[str, List[float]] = defaultdict(list)
VOTE_RATE_LIMIT_WINDOW = 60
VOTE_RATE_LIMIT_MAX = 10  # votes per minute per IP

# Admin login protection
ADMIN_LOGIN_ATTEMPTS: Dict[str, List[float]] = defaultdict(list)
MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_TIME = 300  # 5 minutes

# Challenge token storage for bot protection
challenge_tokens: Dict[str, float] = {}
CHALLENGE_TOKEN_EXPIRY = 300  # 5 minutes

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)  # Disable all docs
api_router = APIRouter(prefix="/api")
security = HTTPBasic()

# ============= LOGGING SETUP =============
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(ROOT_DIR / 'security.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('security')

def log_admin_access(request: Request, action: str, success: bool, details: str = ""):
    """Log admin access attempts - never log passwords or sensitive data"""
    client_ip = request.client.host if request.client else "unknown"
    log_msg = f"ADMIN_ACCESS | IP: {client_ip} | Action: {action} | Success: {success}"
    if details:
        log_msg += f" | Details: {details}"
    if success:
        logger.info(log_msg)
    else:
        logger.warning(log_msg)

def log_comment_submission(request: Request, writeup_id: str, success: bool, reason: str = ""):
    """Log comment submissions for abuse monitoring"""
    client_ip = request.client.host if request.client else "unknown"
    timestamp = datetime.now(timezone.utc).isoformat()
    log_msg = f"COMMENT | IP: {client_ip} | Writeup: {writeup_id} | Time: {timestamp} | Success: {success}"
    if reason:
        log_msg += f" | Reason: {reason}"
    logger.info(log_msg)

# ============= SECURITY MIDDLEWARE =============

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), payment=()"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        
        # Strengthened CSP - removed 'unsafe-inline' from script-src
        # Note: 'unsafe-inline' still needed for style-src due to Tailwind/CSS-in-JS
        csp = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob:; "
            "connect-src 'self'; "
            "object-src 'none'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "upgrade-insecure-requests;"
        )
        response.headers["Content-Security-Policy"] = csp
        
        # HSTS for HTTPS
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Clean old entries
        rate_limit_storage[client_ip] = [
            t for t in rate_limit_storage[client_ip] 
            if current_time - t < RATE_LIMIT_WINDOW
        ]
        
        # Check rate limit
        if len(rate_limit_storage[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
            logger.warning(f"RATE_LIMIT | IP: {client_ip} | Exceeded {RATE_LIMIT_MAX_REQUESTS} requests")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )
        
        rate_limit_storage[client_ip].append(current_time)
        return await call_next(request)

# Add middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)

# ============= AUTH HELPERS =============

def check_login_lockout(client_ip: str) -> bool:
    """Check if IP is locked out due to failed attempts"""
    current_time = time.time()
    ADMIN_LOGIN_ATTEMPTS[client_ip] = [
        t for t in ADMIN_LOGIN_ATTEMPTS[client_ip]
        if current_time - t < LOGIN_LOCKOUT_TIME
    ]
    return len(ADMIN_LOGIN_ATTEMPTS[client_ip]) >= MAX_LOGIN_ATTEMPTS

def record_failed_login(client_ip: str):
    """Record a failed login attempt"""
    ADMIN_LOGIN_ATTEMPTS[client_ip].append(time.time())

def verify_admin(request: Request, credentials: HTTPBasicCredentials = Depends(security)) -> bool:
    """Verify admin credentials with timing-safe comparison"""
    client_ip = request.client.host if request.client else "unknown"
    
    # Check IP allowlist if configured
    if ADMIN_IP_ALLOWLIST:
        if client_ip not in ADMIN_IP_ALLOWLIST:
            log_admin_access(request, "LOGIN", False, "IP not in allowlist")
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Check lockout
    if check_login_lockout(client_ip):
        log_admin_access(request, "LOGIN", False, "Account locked")
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
    
    # Timing-safe comparison - never reveal which field is wrong
    username_correct = secrets.compare_digest(credentials.username.encode(), ADMIN_USERNAME.encode())
    password_correct = secrets.compare_digest(credentials.password.encode(), ADMIN_PASSWORD.encode())
    
    if not (username_correct and password_correct):
        record_failed_login(client_ip)
        log_admin_access(request, "LOGIN", False, "Invalid credentials")
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    log_admin_access(request, "LOGIN", True)
    return True

# ============= RATE LIMITING HELPERS =============

def check_comment_rate_limit(client_ip: str) -> bool:
    """Check if IP has exceeded comment rate limit"""
    current_time = time.time()
    comment_rate_limit[client_ip] = [
        t for t in comment_rate_limit[client_ip]
        if current_time - t < COMMENT_RATE_LIMIT_WINDOW
    ]
    return len(comment_rate_limit[client_ip]) >= COMMENT_RATE_LIMIT_MAX

def record_comment(client_ip: str):
    """Record a comment submission"""
    comment_rate_limit[client_ip].append(time.time())

def check_vote_rate_limit(client_ip: str) -> bool:
    """Check if IP has exceeded vote rate limit"""
    current_time = time.time()
    vote_rate_limit[client_ip] = [
        t for t in vote_rate_limit[client_ip]
        if current_time - t < VOTE_RATE_LIMIT_WINDOW
    ]
    return len(vote_rate_limit[client_ip]) >= VOTE_RATE_LIMIT_MAX

def record_vote(client_ip: str):
    """Record a vote"""
    vote_rate_limit[client_ip].append(time.time())

# ============= BOT PROTECTION =============

def generate_challenge_token() -> str:
    """Generate a challenge token for bot protection"""
    token = secrets.token_urlsafe(32)
    challenge_tokens[token] = time.time()
    # Clean expired tokens
    current_time = time.time()
    expired = [t for t, ts in challenge_tokens.items() if current_time - ts > CHALLENGE_TOKEN_EXPIRY]
    for t in expired:
        del challenge_tokens[t]
    return token

def verify_challenge_token(token: str) -> bool:
    """Verify and consume a challenge token"""
    if not token or token not in challenge_tokens:
        return False
    token_time = challenge_tokens.get(token, 0)
    if time.time() - token_time > CHALLENGE_TOKEN_EXPIRY:
        if token in challenge_tokens:
            del challenge_tokens[token]
        return False
    del challenge_tokens[token]  # Single use
    return True

# ============= MODELS =============

class WriteupCreate(BaseModel):
    title: str
    description: str
    content: str
    difficulty: str
    tags: List[str]
    skills: List[str] = []
    techniques: List[str] = []
    cves: List[str] = []
    platform: str
    machine_name: Optional[str] = None
    cover_image: Optional[str] = None
    os_type: Optional[str] = None
    tools_used: List[str] = []

class WriteupUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    difficulty: Optional[str] = None
    tags: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    techniques: Optional[List[str]] = None
    cves: Optional[List[str]] = None
    platform: Optional[str] = None
    machine_name: Optional[str] = None
    cover_image: Optional[str] = None
    os_type: Optional[str] = None
    tools_used: Optional[List[str]] = None
    published: Optional[bool] = None

class WriteupResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    content: str
    difficulty: str
    tags: List[str]
    skills: List[str] = []
    techniques: List[str] = []
    cves: List[str] = []
    platform: str
    machine_name: Optional[str]
    cover_image: Optional[str]
    os_type: Optional[str] = None
    tools_used: List[str] = []
    published: bool
    views: int
    upvotes: int
    downvotes: int
    created_at: str
    updated_at: str

class CommentCreate(BaseModel):
    content: str
    author_name: str
    challenge_token: str  # Bot protection token

class CommentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    content: str
    writeup_id: str
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
    url: Optional[str] = None
    content: Optional[str] = None
    category: str

class ResourceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    url: Optional[str] = None
    content: Optional[str] = None
    category: str
    created_at: str

# ============= INPUT SANITIZATION (STRICT) =============

def sanitize_html_strict(content: str) -> str:
    """Strict HTML sanitization - escape all HTML"""
    if not content:
        return content
    return html.escape(content)

def sanitize_markdown(content: str) -> str:
    """Sanitize markdown content to prevent XSS - very strict"""
    if not content:
        return content
    
    # Remove ALL script-related content
    content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.IGNORECASE | re.DOTALL)
    content = re.sub(r'<script[^>]*/?>', '', content, flags=re.IGNORECASE)
    
    # Remove ALL event handlers (on*)
    content = re.sub(r'\s+on\w+\s*=\s*["\'][^"\']*["\']', '', content, flags=re.IGNORECASE)
    content = re.sub(r'\s+on\w+\s*=\s*[^\s>]+', '', content, flags=re.IGNORECASE)
    
    # Remove javascript: URLs completely
    content = re.sub(r'javascript\s*:', '', content, flags=re.IGNORECASE)
    
    # Remove vbscript: URLs
    content = re.sub(r'vbscript\s*:', '', content, flags=re.IGNORECASE)
    
    # Remove data: URLs for HTML content (allow data:image)
    content = re.sub(r'data\s*:\s*text/html', '', content, flags=re.IGNORECASE)
    
    # Remove dangerous tags
    dangerous_tags = ['iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea', 'style', 'link', 'meta', 'base', 'svg', 'math']
    for tag in dangerous_tags:
        content = re.sub(rf'<{tag}[^>]*>.*?</{tag}>', '', content, flags=re.IGNORECASE | re.DOTALL)
        content = re.sub(rf'<{tag}[^>]*/?\s*>', '', content, flags=re.IGNORECASE)
    
    # Remove expression() CSS hack
    content = re.sub(r'expression\s*\([^)]*\)', '', content, flags=re.IGNORECASE)
    
    # Remove -moz-binding CSS hack
    content = re.sub(r'-moz-binding\s*:', '', content, flags=re.IGNORECASE)
    
    # Remove behavior CSS hack
    content = re.sub(r'behavior\s*:', '', content, flags=re.IGNORECASE)
    
    # Remove url() with javascript
    content = re.sub(r'url\s*\(\s*["\']?\s*javascript:', 'url(', content, flags=re.IGNORECASE)
    
    return content

def sanitize_comment_content(content: str) -> str:
    """Extra strict sanitization for comments - no HTML allowed"""
    if not content:
        return content
    
    # First, remove null bytes
    content = content.replace('\x00', '')
    
    # Limit length
    content = content[:2000]
    
    # Escape ALL HTML - comments should be plain text
    content = html.escape(content)
    
    # Remove any remaining potential XSS vectors
    content = re.sub(r'javascript\s*:', '', content, flags=re.IGNORECASE)
    content = re.sub(r'vbscript\s*:', '', content, flags=re.IGNORECASE)
    content = re.sub(r'data\s*:', '', content, flags=re.IGNORECASE)
    
    return content

def sanitize_author_name(name: str) -> str:
    """Sanitize author name - alphanumeric, spaces, and basic punctuation only"""
    if not name:
        return "Anonymous"
    
    # Remove null bytes
    name = name.replace('\x00', '')
    
    # Limit length
    name = name[:50]
    
    # Escape HTML
    name = html.escape(name)
    
    # Remove potential XSS
    name = re.sub(r'javascript\s*:', '', name, flags=re.IGNORECASE)
    
    # Only allow safe characters
    name = re.sub(r'[^\w\s\.\-\']+', '', name)
    
    return name.strip() or "Anonymous"

def sanitize_input(text: str) -> str:
    """Basic input sanitization"""
    if not text:
        return text
    # Remove null bytes
    text = text.replace('\x00', '')
    # Limit length
    return text[:10000]

# ============= IMAGE UPLOAD VALIDATION =============

def get_image_type(file_bytes: bytes) -> Optional[str]:
    """Validate image by magic bytes"""
    if len(file_bytes) < 12:
        return None
    # PNG: 89 50 4E 47
    if file_bytes[:4] == b'\x89PNG':
        return 'png'
    # JPEG: FF D8 FF
    if file_bytes[:3] == b'\xff\xd8\xff':
        return 'jpeg'
    # WebP: RIFF....WEBP
    if file_bytes[:4] == b'RIFF' and file_bytes[8:12] == b'WEBP':
        return 'webp'
    return None

def is_safe_filename(filename: str) -> bool:
    """Check for path traversal attempts"""
    if not filename:
        return False
    if '..' in filename or '/' in filename or '\\' in filename:
        return False
    if '\x00' in filename:
        return False
    return True

# ============= PUBLIC ROUTES (READ ONLY) =============

@api_router.get("/writeups", response_model=List[WriteupResponse])
async def get_writeups(
    search: Optional[str] = None,
    difficulty: Optional[str] = None,
    platform: Optional[str] = None,
    tag: Optional[str] = None,
    skill: Optional[str] = None,
    technique: Optional[str] = None,
    os_type: Optional[str] = None,
    limit: int = 20,
    skip: int = 0
):
    query = {"published": True}
    
    if search:
        search = sanitize_input(search)
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"machine_name": {"$regex": search, "$options": "i"}},
            {"cves": {"$regex": search, "$options": "i"}}
        ]
    
    if difficulty:
        query["difficulty"] = sanitize_input(difficulty)
    if platform:
        query["platform"] = sanitize_input(platform)
    if tag:
        query["tags"] = sanitize_input(tag)
    if skill:
        query["skills"] = sanitize_input(skill)
    if technique:
        query["techniques"] = sanitize_input(technique)
    if os_type:
        query["os_type"] = sanitize_input(os_type)
    
    writeups = await db.writeups.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(min(limit, 100)).to_list(min(limit, 100))
    
    for w in writeups:
        w.setdefault("skills", [])
        w.setdefault("techniques", [])
        w.setdefault("cves", [])
        w.setdefault("os_type", None)
        w.setdefault("tools_used", [])
    
    return [WriteupResponse(**w) for w in writeups]

@api_router.get("/writeups/featured", response_model=List[WriteupResponse])
async def get_featured_writeups():
    writeups = await db.writeups.find({"published": True}, {"_id": 0}).sort("upvotes", -1).limit(6).to_list(6)
    
    for w in writeups:
        w.setdefault("skills", [])
        w.setdefault("techniques", [])
        w.setdefault("cves", [])
        w.setdefault("os_type", None)
        w.setdefault("tools_used", [])
    
    return [WriteupResponse(**w) for w in writeups]

@api_router.get("/writeups/{writeup_id}", response_model=WriteupResponse)
async def get_writeup(writeup_id: str):
    writeup_id = sanitize_input(writeup_id)
    writeup = await db.writeups.find_one({"id": writeup_id, "published": True}, {"_id": 0})
    if not writeup:
        raise HTTPException(status_code=404, detail="Writeup not found")
    
    await db.writeups.update_one({"id": writeup_id}, {"$inc": {"views": 1}})
    writeup["views"] += 1
    
    writeup.setdefault("skills", [])
    writeup.setdefault("techniques", [])
    writeup.setdefault("cves", [])
    writeup.setdefault("os_type", None)
    writeup.setdefault("tools_used", [])
    
    return WriteupResponse(**writeup)

@api_router.get("/comments/{writeup_id}", response_model=List[CommentResponse])
async def get_comments(writeup_id: str):
    writeup_id = sanitize_input(writeup_id)
    comments = await db.comments.find({"writeup_id": writeup_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [CommentResponse(**c) for c in comments]

@api_router.get("/resources", response_model=List[ResourceResponse])
async def get_resources(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = sanitize_input(category)
    
    resources = await db.resources.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for r in resources:
        r.setdefault("content", None)
    
    return [ResourceResponse(**r) for r in resources]

@api_router.get("/stats")
async def get_stats():
    writeup_count = await db.writeups.count_documents({"published": True})
    
    difficulty_pipeline = [
        {"$match": {"published": True}},
        {"$group": {"_id": "$difficulty", "count": {"$sum": 1}}}
    ]
    difficulty_dist = await db.writeups.aggregate(difficulty_pipeline).to_list(10)
    
    platform_pipeline = [
        {"$match": {"published": True}},
        {"$group": {"_id": "$platform", "count": {"$sum": 1}}}
    ]
    platform_dist = await db.writeups.aggregate(platform_pipeline).to_list(10)
    
    tags_pipeline = [
        {"$match": {"published": True}},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 15}
    ]
    tags = await db.writeups.aggregate(tags_pipeline).to_list(15)
    
    skills_pipeline = [
        {"$match": {"published": True, "skills": {"$exists": True, "$ne": []}}},
        {"$unwind": "$skills"},
        {"$group": {"_id": "$skills", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    skills = await db.writeups.aggregate(skills_pipeline).to_list(10)
    
    views_pipeline = [
        {"$match": {"published": True}},
        {"$group": {"_id": None, "total": {"$sum": "$views"}}}
    ]
    views_result = await db.writeups.aggregate(views_pipeline).to_list(1)
    total_views = views_result[0]["total"] if views_result else 0
    
    return {
        "machines_owned": writeup_count,
        "total_views": total_views,
        "difficulty_distribution": {d["_id"]: d["count"] for d in difficulty_dist if d["_id"]},
        "platform_distribution": {p["_id"]: p["count"] for p in platform_dist if p["_id"]},
        "popular_tags": [{"tag": t["_id"], "count": t["count"]} for t in tags],
        "popular_skills": [{"skill": s["_id"], "count": s["count"]} for s in skills]
    }

@api_router.post("/contact")
async def submit_contact(message: ContactMessage, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    
    contact_doc = {
        "id": str(uuid.uuid4()),
        "name": sanitize_html_strict(message.name)[:100],
        "email": message.email,
        "subject": sanitize_html_strict(message.subject)[:200],
        "message": sanitize_html_strict(message.message)[:5000],
        "client_ip": hashlib.sha256(client_ip.encode()).hexdigest()[:16],  # Hashed for privacy
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.contact_messages.insert_one(contact_doc)
    return {"message": "Message sent successfully"}

# Challenge token endpoint for bot protection
@api_router.get("/challenge")
async def get_challenge_token():
    """Get a challenge token for comment/vote submission"""
    token = generate_challenge_token()
    return {"token": token, "expires_in": CHALLENGE_TOKEN_EXPIRY}

# Public voting with rate limiting
@api_router.post("/writeups/{writeup_id}/vote")
async def vote_writeup(writeup_id: str, vote: str, request: Request):
    if vote not in ["up", "down"]:
        raise HTTPException(status_code=400, detail="Invalid vote")
    
    client_ip = request.client.host if request.client else "unknown"
    
    # Check vote rate limit
    if check_vote_rate_limit(client_ip):
        logger.warning(f"VOTE_RATE_LIMIT | IP: {client_ip}")
        raise HTTPException(status_code=429, detail="Too many votes. Please slow down.")
    
    writeup_id = sanitize_input(writeup_id)
    writeup = await db.writeups.find_one({"id": writeup_id, "published": True})
    if not writeup:
        raise HTTPException(status_code=404, detail="Writeup not found")
    
    # IP-based voting
    vote_key = hashlib.sha256(f"{writeup_id}:{client_ip}".encode()).hexdigest()
    
    existing_vote = await db.votes.find_one({"vote_key": vote_key})
    
    record_vote(client_ip)
    
    if existing_vote:
        if existing_vote["vote"] == vote:
            await db.votes.delete_one({"vote_key": vote_key})
            inc_field = "upvotes" if vote == "up" else "downvotes"
            await db.writeups.update_one({"id": writeup_id}, {"$inc": {inc_field: -1}})
            return {"message": "Vote removed"}
        else:
            await db.votes.update_one({"vote_key": vote_key}, {"$set": {"vote": vote}})
            if vote == "up":
                await db.writeups.update_one({"id": writeup_id}, {"$inc": {"upvotes": 1, "downvotes": -1}})
            else:
                await db.writeups.update_one({"id": writeup_id}, {"$inc": {"upvotes": -1, "downvotes": 1}})
            return {"message": "Vote changed"}
    else:
        await db.votes.insert_one({"vote_key": vote_key, "writeup_id": writeup_id, "vote": vote})
        inc_field = "upvotes" if vote == "up" else "downvotes"
        await db.writeups.update_one({"id": writeup_id}, {"$inc": {inc_field: 1}})
        return {"message": "Vote added"}

# Secure public comments with rate limiting and bot protection
@api_router.post("/comments", response_model=CommentResponse)
async def create_public_comment(
    writeup_id: str,
    comment_data: CommentCreate,
    request: Request,
    x_honeypot: Optional[str] = Header(None)
):
    client_ip = request.client.host if request.client else "unknown"
    
    # Honeypot check
    if x_honeypot:
        log_comment_submission(request, writeup_id, False, "Honeypot triggered")
        raise HTTPException(status_code=400, detail="Invalid request")
    
    # Verify challenge token (bot protection)
    if not verify_challenge_token(comment_data.challenge_token):
        log_comment_submission(request, writeup_id, False, "Invalid challenge token")
        raise HTTPException(status_code=400, detail="Invalid or expired token. Please refresh and try again.")
    
    # Check comment rate limit
    if check_comment_rate_limit(client_ip):
        log_comment_submission(request, writeup_id, False, "Rate limit exceeded")
        raise HTTPException(status_code=429, detail="Too many comments. Please wait a minute.")
    
    writeup_id = sanitize_input(writeup_id)
    writeup = await db.writeups.find_one({"id": writeup_id, "published": True})
    if not writeup:
        log_comment_submission(request, writeup_id, False, "Writeup not found")
        raise HTTPException(status_code=404, detail="Writeup not found")
    
    # Strict sanitization
    sanitized_content = sanitize_comment_content(comment_data.content)
    sanitized_author = sanitize_author_name(comment_data.author_name)
    
    if not sanitized_content.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    
    comment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    comment_doc = {
        "id": comment_id,
        "content": sanitized_content,
        "writeup_id": writeup_id,
        "author_name": sanitized_author,
        "client_ip_hash": hashlib.sha256(client_ip.encode()).hexdigest()[:16],
        "created_at": now
    }
    
    await db.comments.insert_one(comment_doc)
    record_comment(client_ip)
    log_comment_submission(request, writeup_id, True)
    
    return CommentResponse(
        id=comment_id,
        content=sanitized_content,
        writeup_id=writeup_id,
        author_name=sanitized_author,
        created_at=now
    )

# ============= ADMIN ROUTES (PROTECTED) =============

@api_router.get("/admin/verify")
async def verify_admin_access(request: Request, authenticated: bool = Depends(verify_admin)):
    """Verify admin credentials - returns minimal info"""
    return {"authenticated": True}

@api_router.post("/admin/writeups", response_model=WriteupResponse)
async def admin_create_writeup(
    request: Request,
    writeup_data: WriteupCreate,
    authenticated: bool = Depends(verify_admin)
):
    log_admin_access(request, "CREATE_WRITEUP", True, f"Title: {writeup_data.title[:50]}")
    
    writeup_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    writeup_doc = {
        "id": writeup_id,
        "title": sanitize_input(writeup_data.title),
        "description": sanitize_input(writeup_data.description),
        "content": sanitize_markdown(writeup_data.content),
        "difficulty": sanitize_input(writeup_data.difficulty),
        "tags": [sanitize_input(t) for t in writeup_data.tags],
        "skills": [sanitize_input(s) for s in writeup_data.skills],
        "techniques": [sanitize_input(t) for t in writeup_data.techniques],
        "cves": [sanitize_input(c) for c in writeup_data.cves],
        "platform": sanitize_input(writeup_data.platform),
        "machine_name": sanitize_input(writeup_data.machine_name) if writeup_data.machine_name else None,
        "cover_image": writeup_data.cover_image,
        "os_type": sanitize_input(writeup_data.os_type) if writeup_data.os_type else None,
        "tools_used": [sanitize_input(t) for t in writeup_data.tools_used],
        "published": True,
        "views": 0,
        "upvotes": 0,
        "downvotes": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.writeups.insert_one(writeup_doc)
    if "_id" in writeup_doc:
        del writeup_doc["_id"]
    
    return WriteupResponse(**writeup_doc)

@api_router.get("/admin/writeups", response_model=List[WriteupResponse])
async def admin_get_all_writeups(
    request: Request,
    authenticated: bool = Depends(verify_admin)
):
    writeups = await db.writeups.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for w in writeups:
        w.setdefault("skills", [])
        w.setdefault("techniques", [])
        w.setdefault("cves", [])
        w.setdefault("os_type", None)
        w.setdefault("tools_used", [])
    
    return [WriteupResponse(**w) for w in writeups]

@api_router.put("/admin/writeups/{writeup_id}", response_model=WriteupResponse)
async def admin_update_writeup(
    request: Request,
    writeup_id: str,
    writeup_data: WriteupUpdate,
    authenticated: bool = Depends(verify_admin)
):
    writeup_id = sanitize_input(writeup_id)
    writeup = await db.writeups.find_one({"id": writeup_id}, {"_id": 0})
    if not writeup:
        raise HTTPException(status_code=404, detail="Writeup not found")
    
    log_admin_access(request, "UPDATE_WRITEUP", True, f"ID: {writeup_id[:8]}")
    
    update_data = {}
    if writeup_data.title is not None:
        update_data["title"] = sanitize_input(writeup_data.title)
    if writeup_data.description is not None:
        update_data["description"] = sanitize_input(writeup_data.description)
    if writeup_data.content is not None:
        update_data["content"] = sanitize_markdown(writeup_data.content)
    if writeup_data.difficulty is not None:
        update_data["difficulty"] = sanitize_input(writeup_data.difficulty)
    if writeup_data.tags is not None:
        update_data["tags"] = [sanitize_input(t) for t in writeup_data.tags]
    if writeup_data.skills is not None:
        update_data["skills"] = [sanitize_input(s) for s in writeup_data.skills]
    if writeup_data.techniques is not None:
        update_data["techniques"] = [sanitize_input(t) for t in writeup_data.techniques]
    if writeup_data.cves is not None:
        update_data["cves"] = [sanitize_input(c) for c in writeup_data.cves]
    if writeup_data.platform is not None:
        update_data["platform"] = sanitize_input(writeup_data.platform)
    if writeup_data.machine_name is not None:
        update_data["machine_name"] = sanitize_input(writeup_data.machine_name)
    if writeup_data.cover_image is not None:
        update_data["cover_image"] = writeup_data.cover_image
    if writeup_data.os_type is not None:
        update_data["os_type"] = sanitize_input(writeup_data.os_type)
    if writeup_data.tools_used is not None:
        update_data["tools_used"] = [sanitize_input(t) for t in writeup_data.tools_used]
    if writeup_data.published is not None:
        update_data["published"] = writeup_data.published
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.writeups.update_one({"id": writeup_id}, {"$set": update_data})
    
    updated = await db.writeups.find_one({"id": writeup_id}, {"_id": 0})
    updated.setdefault("skills", [])
    updated.setdefault("techniques", [])
    updated.setdefault("cves", [])
    updated.setdefault("os_type", None)
    updated.setdefault("tools_used", [])
    
    return WriteupResponse(**updated)

@api_router.delete("/admin/writeups/{writeup_id}")
async def admin_delete_writeup(
    request: Request,
    writeup_id: str,
    authenticated: bool = Depends(verify_admin)
):
    writeup_id = sanitize_input(writeup_id)
    writeup = await db.writeups.find_one({"id": writeup_id})
    if not writeup:
        raise HTTPException(status_code=404, detail="Writeup not found")
    
    log_admin_access(request, "DELETE_WRITEUP", True, f"ID: {writeup_id[:8]}")
    
    await db.writeups.delete_one({"id": writeup_id})
    await db.comments.delete_many({"writeup_id": writeup_id})
    await db.votes.delete_many({"writeup_id": writeup_id})
    
    return {"message": "Writeup deleted"}

@api_router.post("/admin/resources", response_model=ResourceResponse)
async def admin_create_resource(
    request: Request,
    resource_data: ResourceCreate,
    authenticated: bool = Depends(verify_admin)
):
    log_admin_access(request, "CREATE_RESOURCE", True, f"Title: {resource_data.title[:50]}")
    
    resource_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    resource_doc = {
        "id": resource_id,
        "title": sanitize_input(resource_data.title),
        "description": sanitize_input(resource_data.description),
        "url": resource_data.url,
        "content": sanitize_markdown(resource_data.content) if resource_data.content else None,
        "category": sanitize_input(resource_data.category),
        "created_at": now
    }
    
    await db.resources.insert_one(resource_doc)
    
    return ResourceResponse(**resource_doc)

@api_router.delete("/admin/resources/{resource_id}")
async def admin_delete_resource(
    request: Request,
    resource_id: str,
    authenticated: bool = Depends(verify_admin)
):
    resource_id = sanitize_input(resource_id)
    log_admin_access(request, "DELETE_RESOURCE", True, f"ID: {resource_id[:8]}")
    await db.resources.delete_one({"id": resource_id})
    return {"message": "Resource deleted"}

@api_router.delete("/admin/comments/{comment_id}")
async def admin_delete_comment(
    request: Request,
    comment_id: str,
    authenticated: bool = Depends(verify_admin)
):
    comment_id = sanitize_input(comment_id)
    log_admin_access(request, "DELETE_COMMENT", True, f"ID: {comment_id[:8]}")
    await db.comments.delete_one({"id": comment_id})
    return {"message": "Comment deleted"}

# ============= SECURE IMAGE UPLOAD =============

@api_router.post("/admin/upload")
async def admin_upload_image(
    request: Request,
    file: UploadFile = File(...),
    authenticated: bool = Depends(verify_admin)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        log_admin_access(request, "UPLOAD", False, f"Invalid extension: {ext}")
        raise HTTPException(status_code=400, detail=f"Invalid file type")
    
    contents = await file.read()
    
    if len(contents) > MAX_UPLOAD_SIZE:
        log_admin_access(request, "UPLOAD", False, "File too large")
        raise HTTPException(status_code=400, detail="File too large")
    
    detected_type = get_image_type(contents)
    if not detected_type:
        log_admin_access(request, "UPLOAD", False, "Invalid magic bytes")
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    if file.content_type not in ALLOWED_MIME_TYPES:
        log_admin_access(request, "UPLOAD", False, f"Invalid MIME: {file.content_type}")
        raise HTTPException(status_code=400, detail="Invalid content type")
    
    secure_filename = f"{uuid.uuid4().hex}.{detected_type}"
    file_path = UPLOAD_DIR / secure_filename
    
    if not str(file_path.resolve()).startswith(str(UPLOAD_DIR.resolve())):
        log_admin_access(request, "UPLOAD", False, "Path traversal attempt")
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    with open(file_path, 'wb') as f:
        f.write(contents)
    
    log_admin_access(request, "UPLOAD", True, f"File: {secure_filename}")
    
    return {
        "url": f"/api/uploads/{secure_filename}",
        "filename": secure_filename,
        "markdown": f"![image](/api/uploads/{secure_filename})"
    }

@api_router.get("/uploads/{filename}")
async def get_upload(filename: str):
    if not is_safe_filename(filename):
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    file_path = UPLOAD_DIR / filename
    
    if not str(file_path.resolve()).startswith(str(UPLOAD_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    content_types = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp'
    }
    
    return FileResponse(
        file_path,
        media_type=content_types.get(ext, 'application/octet-stream'),
        headers={
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "public, max-age=31536000"
        }
    )

@api_router.get("/")
async def root():
    return {"status": "ok"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
