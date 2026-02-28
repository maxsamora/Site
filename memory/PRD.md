# ZeroDay.log - CTF Writeup Blog Platform

## Original Problem Statement
Build a user-friendly, clean website for posting Capture The Flag (CTF) challenges and solutions from Hack The Box and Offensive Security. User wanted a personal blog style like Medium for posting CTF writeups with dark hacker/cyberpunk theme.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python 3.11)
- **Database**: MongoDB
- **Authentication**: JWT-based auth

## User Personas
1. **Primary User (Blog Owner)**: Posts CTF writeups, manages content
2. **Visitors**: Read writeups, search archive, use resources

## Core Requirements (Implemented)
1. ✅ Homepage with hero section, featured/latest writeups, stats
2. ✅ User authentication (register/login with JWT)
3. ✅ Create/Edit/Delete writeups with markdown support
4. ✅ Searchable archive with filters (difficulty, platform, tags)
5. ✅ Individual writeup pages with comments
6. ✅ Upvote/downvote system for writeups
7. ✅ Resources page with CTF tools/links
8. ✅ Contact form
9. ✅ Responsive dark cyberpunk design
10. ✅ Profile page showing user's writeups

## What's Been Implemented (Jan 2026)
- Full authentication system with JWT tokens
- Complete CRUD for writeups with markdown content
- Comments system on writeups
- Voting system (upvote/downvote)
- Search and filter functionality
- Stats API showing writeup count, user count, popular tags
- Resources page with default CTF resources
- Contact form submission
- Dark cyberpunk theme with Unbounded + JetBrains Mono fonts

## API Endpoints
- POST /api/auth/register, /api/auth/login, /api/auth/me
- GET/POST/PUT/DELETE /api/writeups
- GET /api/writeups/featured
- POST /api/writeups/{id}/vote
- GET/POST/DELETE /api/comments
- GET/POST/DELETE /api/resources
- POST /api/contact
- GET /api/stats

## P0 Features (Done)
- [x] User registration/login
- [x] Create and view writeups
- [x] Archive with search
- [x] Markdown rendering

## P1 Features (Future)
- [ ] Rich text/WYSIWYG editor option
- [ ] Image upload for writeups (currently URL only)
- [ ] Social login (Google/GitHub OAuth)
- [ ] Email notifications for new writeups

## P2 Features (Backlog)
- [ ] Series/collections for related writeups
- [ ] Syntax highlighting in code blocks
- [ ] User following/bookmarks
- [ ] RSS feed for new writeups
- [ ] SEO meta tags per writeup

## Next Tasks
1. Add more writeups with real CTF content
2. Configure custom domain if needed
3. Set up social media links in footer
4. Consider adding syntax highlighting library (highlight.js)
