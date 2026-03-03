# ZeroDay.log - Offensive Security Portfolio

## Original Problem Statement
Transform ZeroDay.log from a CTF blog into a professional offensive security portfolio for Maxwell Ferreira, with comprehensive OWASP Top 10 security hardening.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI + DOMPurify
- **Backend**: FastAPI (Python 3.11) with security middleware
- **Database**: MongoDB
- **Authentication**: HTTP Basic Auth (admin only)
- **Security**: OWASP Top 10 protections implemented

## Security Features Implemented (Jan 2026)

### Authentication & Access Control
- ✅ Public auth removed (no login/register for visitors)
- ✅ HTTP Basic Auth for admin panel
- ✅ Credentials stored in environment variables (ADMIN_USERNAME, ADMIN_PASSWORD)
- ✅ Rate limiting (30 requests/minute, 5 failed login attempts = lockout)
- ✅ Optional IP allowlist support (ADMIN_IP_ALLOWLIST)
- ✅ Session storage (not localStorage) for admin auth
- ✅ All write/edit/delete routes require admin auth

### Image Upload Security
- ✅ UUID filenames (no original filename used)
- ✅ MIME type validation
- ✅ Magic byte validation (PNG, JPG, WebP only)
- ✅ SVG blocked
- ✅ Max size 5MB
- ✅ Path traversal protection
- ✅ Directory listing disabled
- ✅ Paste and drag-drop support in editor

### OWASP Top 10 Protections
1. **Injection**: Parameterized queries (MongoDB), no eval, input sanitization
2. **XSS**: DOMPurify sanitization, markdown sanitizer, script/event handler removal
3. **CSRF**: Origin validation, honeypot fields
4. **Security Misconfiguration**: Security headers (CSP, X-Frame-Options, etc.)
5. **Rate Limiting**: 30 req/min global, 5 login attempts max
6. **Logging**: Admin access logged, failed auth logged (no passwords)

### Security Headers
- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: no-referrer
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HTTPS)

## Admin Credentials
- Username: `maxwell`
- Password: Check `/app/backend/.env` (auto-generated)
- Access: `/admin`

## API Endpoints

### Public (No Auth)
- GET /api/writeups, /api/writeups/featured, /api/writeups/{id}
- GET /api/resources, /api/stats
- GET /api/comments/{writeup_id}
- POST /api/contact
- POST /api/writeups/{id}/vote
- POST /api/comments

### Admin (HTTP Basic Auth Required)
- GET /api/admin/verify
- GET /api/admin/writeups
- POST /api/admin/writeups
- PUT /api/admin/writeups/{id}
- DELETE /api/admin/writeups/{id}
- POST /api/admin/resources
- DELETE /api/admin/resources/{id}
- DELETE /api/admin/comments/{id}
- POST /api/admin/upload

## Pages
- / - Homepage with Maxwell Ferreira identity
- /writeups - Writeup archive with filters
- /writeup/:id - Individual writeup with public comments/voting
- /resources - Security resources and checklists
- /about - Professional bio
- /contact - Contact form
- /admin - Admin login (HTTP Basic Auth)
- /admin/writeup/new - Create writeup
- /admin/writeup/:id - Edit writeup

## Next Tasks
1. Set up custom domain with HTTPS
2. Update social media links in footer and About page
3. Add first real CTF writeups
4. Consider adding syntax highlighting (highlight.js)
5. Set up backup for MongoDB data
