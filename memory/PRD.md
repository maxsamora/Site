# ZeroDay.log - Offensive Security Portfolio

## Original Problem Statement
Professional offensive security portfolio for Maxwell Ferreira with comprehensive security hardening (OWASP Top 10 protections).

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI + DOMPurify
- **Backend**: FastAPI (Python 3.11) with security middleware
- **Database**: MongoDB
- **Authentication**: HTTP Basic Auth (admin only, credentials in env vars)

## Security Features Implemented

### Authentication & Access Control
- HTTP Basic Auth for admin panel at `/admin`
- Credentials stored ONLY in environment variables
- Rate limiting (30 requests/minute global)
- Login lockout after 5 failed attempts (5 min)
- Optional IP allowlist support
- All write/edit/delete routes require admin auth
- Timing-safe credential comparison

### Public Comment Security
- Challenge tokens required (bot protection)
- Rate limiting: 5 comments/minute per IP
- Strict HTML sanitization (all HTML escaped)
- No script tags, event handlers, or javascript: URLs allowed
- Author names sanitized to alphanumeric only
- IP logging for abuse monitoring (hashed for privacy)

### Content Security Policy (Strengthened)
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob:;
connect-src 'self';
object-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

### Additional Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- X-XSS-Protection: 1; mode=block
- Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
- X-Permitted-Cross-Domain-Policies: none
- Strict-Transport-Security (on HTTPS)

### Image Upload Security
- UUID filenames only
- MIME type + magic byte validation
- PNG, JPG, WebP only (no SVG)
- Max size 5MB
- Path traversal protection

## API Endpoints

### Public (No Auth)
- GET /api/writeups, /api/writeups/featured, /api/writeups/{id}
- GET /api/resources, /api/stats, /api/challenge
- GET /api/comments/{writeup_id}
- POST /api/contact
- POST /api/writeups/{id}/vote (rate limited)
- POST /api/comments (requires challenge token, rate limited)

### Admin (HTTP Basic Auth Required)
- All /api/admin/* endpoints
- POST /api/admin/upload

## Pages
- / - Homepage
- /writeups - Writeup archive with filters
- /writeup/:id - Individual writeup
- /resources - Security resources
- /about - Professional bio
- /contact - Contact form
- /admin - Admin panel (protected)

## Security Logging
- All admin access logged
- Failed login attempts logged
- Comment submissions logged with IP hash
- Upload attempts logged
- Passwords/secrets NEVER logged

## Environment Variables Required
- MONGO_URL
- DB_NAME
- ADMIN_USERNAME
- ADMIN_PASSWORD
- ADMIN_IP_ALLOWLIST (optional)
- CORS_ORIGINS

## Next Tasks
1. Set up custom domain with HTTPS for HSTS
2. Add first CTF writeups
3. Consider adding CAPTCHA for comments if spam increases
4. Set up automated backups
