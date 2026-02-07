# Security Hardening Implementation Checklist

Use this checklist to ensure all security features are properly implemented in your FastAPI application.

## Pre-Implementation
- [ ] Read `.claude/security-hardening-process.md` for complete overview
- [ ] Backup current `backend/app.py`
- [ ] Ensure project has `backend/` directory with `app.py`
- [ ] Git repository initialized and working

## Automated Setup
- [ ] Run: `bash .claude/security-hardening-implementation.sh`
- [ ] Verify dependencies added to `requirements.txt`
- [ ] Verify `.env.example` files created
- [ ] Verify `.gitignore` updated
- [ ] Verify `test_security.py` created

## Dependencies (in requirements.txt)
- [ ] `slowapi==0.1.9` - Rate limiting
- [ ] `bleach==6.1.0` - HTML sanitization
- [ ] Run: `pip install -r requirements.txt`

## Pydantic Validation (in app.py)
- [ ] Import Pydantic: `from pydantic import BaseModel, Field, field_validator`
- [ ] Create TaskCreate model with:
  - [ ] `title: str = Field(..., min_length=1, max_length=500)`
  - [ ] `importance: int = Field(default=3, ge=1, le=5)`
  - [ ] `urgency: int = Field(default=3, ge=1, le=5)`
  - [ ] `due_date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')`
  - [ ] `due_time: Optional[str] = Field(None, pattern=r'^([01]\d|2[0-3]):([0-5]\d)$')`
  - [ ] `duration_minutes: Optional[int] = Field(None, ge=1, le=1440)`
  - [ ] `model_config = {"extra": "forbid", "str_strip_whitespace": True}`
- [ ] Create @field_validator methods for:
  - [ ] `title` - cannot be empty after strip
  - [ ] `due_date` - valid date format
  - [ ] `due_time` - valid time format
- [ ] Create CommandRequest model with text validation
- [ ] Create TaskUpdate model with optional field constraints
- [ ] Create Query parameter Enums:
  - [ ] TaskStatusQuery
  - [ ] DateFilterQuery
  - [ ] SortByQuery

## Rate Limiting (in app.py)
- [ ] Import SlowAPI: `from slowapi import Limiter`
- [ ] Initialize limiter: `limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")`
- [ ] Add to app: `app.state.limiter = limiter`
- [ ] Add exception handler: `app.add_exception_handler(RateLimitExceeded, ...)`
- [ ] Add decorator to all endpoints with appropriate limits:
  - [ ] GET /health - 120/minute
  - [ ] POST /api/command - 30/minute
  - [ ] POST /api/tasks - 20/minute
  - [ ] DELETE /api/tasks/{id} - 10/minute
  - [ ] GET /api/tasks - 60/minute
  - [ ] PUT /api/tasks/{id} - 30/minute
  - [ ] PATCH /api/tasks/{id}/complete - 30/minute
  - [ ] GET /api/calendar - 30/minute
  - [ ] GET /api/priority-matrix - 30/minute
- [ ] Test rate limiting with: `for i in {1..130}; do curl http://localhost:8000/health; done`

## Security Middleware (in app.py)
- [ ] Import: `from starlette.middleware.base import BaseHTTPMiddleware`
- [ ] Create RequestSizeLimitMiddleware:
  - [ ] Check content-length header
  - [ ] Reject if > 1MB with 413 response
- [ ] Create SecurityHeadersMiddleware:
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Content-Security-Policy: default-src 'self'
  - [ ] Referrer-Policy: strict-origin-when-cross-origin
  - [ ] Strict-Transport-Security (HTTPS only)
- [ ] Create RequestIDMiddleware:
  - [ ] Generate UUID for each request
  - [ ] Store in request.state.request_id
  - [ ] Add to response headers (X-Request-ID)
- [ ] Register middleware in correct order:
  - [ ] RequestIDMiddleware first
  - [ ] SecurityHeadersMiddleware
  - [ ] RequestSizeLimitMiddleware
  - [ ] CORSMiddleware last

## Error Handling (in app.py)
- [ ] Create global exception handler:
  - [ ] Log all errors
  - [ ] Sanitize response in production
  - [ ] Include stack trace in development only
- [ ] Create validation error handler:
  - [ ] Extract field names from error locations
  - [ ] Return 422 with field-level errors
- [ ] Create SQLAlchemy error handler:
  - [ ] Log error
  - [ ] Return generic 500 response
  - [ ] Never expose schema details
- [ ] Create HTTP exception handler:
  - [ ] Return consistent format
  - [ ] Sanitize in production
- [ ] Create rate limit exception handler:
  - [ ] Return 429 with retry_after
  - [ ] Include Retry-After header

## CORS Configuration (in app.py)
- [ ] Import os: `import os`
- [ ] Load ALLOWED_ORIGINS:
  ```python
  ALLOWED_ORIGINS = os.getenv(
      "ALLOWED_ORIGINS",
      "http://localhost:3000,http://localhost:3001"
  ).split(",")
  ```
- [ ] Update CORSMiddleware:
  - [ ] `allow_origins=ALLOWED_ORIGINS` (not ["*"])
  - [ ] `allow_credentials=True`
  - [ ] `allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"]`
  - [ ] `allow_headers=["Content-Type", "Authorization"]`
  - [ ] `max_age=3600`

## Environment Configuration (in app.py)
- [ ] Add environment variables:
  - [ ] `ENV = os.getenv("ENV", "development")`
  - [ ] `IS_PRODUCTION = ENV == "production"`
  - [ ] `DEBUG = os.getenv("DEBUG", "False").lower() == "true" and not IS_PRODUCTION`
- [ ] Add logging:
  - [ ] `logging.basicConfig(level=logging.INFO if IS_PRODUCTION else logging.DEBUG)`
  - [ ] `logger = logging.getLogger(__name__)`
- [ ] Update FastAPI initialization:
  - [ ] `debug=DEBUG`
  - [ ] `docs_url="/docs" if DEBUG else None`
  - [ ] `redoc_url="/redoc" if DEBUG else None`
- [ ] Add startup event:
  - [ ] Log environment details
  - [ ] Log allowed CORS origins

## SQL Injection Prevention (in services/nlp_service.py)
- [ ] Add `_sanitize_search_term()` method:
  - [ ] Remove % character
  - [ ] Remove _ character
  - [ ] Limit length to 100 characters
- [ ] Apply to `_parse_complete_task()`:
  - [ ] Sanitize task_title before returning
- [ ] Apply to `_parse_delete_task()`:
  - [ ] Sanitize task_title before returning

## Secrets Management (.gitignore)
- [ ] Add patterns to .gitignore:
  - [ ] `.env` (all variants)
  - [ ] `.env.*` (all variants)
  - [ ] `!.env.example` (exception for template)
  - [ ] `backend/.env*` with exception
  - [ ] `frontend/.env*` with exception
- [ ] Remove sensitive files from git:
  - [ ] `git rm --cached frontend/.env.production` (if exists)
  - [ ] `git rm --cached backend/.env` (if exists)
- [ ] Create .env files from templates:
  - [ ] `cp backend/.env.example backend/.env`
  - [ ] `cp frontend/.env.example frontend/.env`
- [ ] Edit .env files with real values (keep out of git)

## Testing (in backend/test_security.py)
### Test Rate Limiting
- [ ] Test health endpoint rate limit (120/min)
- [ ] Test create task rate limit (20/min)
- [ ] Test command rate limit (30/min)
- [ ] Test 429 response format

### Test Input Validation
- [ ] Test title length (too long)
- [ ] Test title empty
- [ ] Test importance out of range
- [ ] Test urgency out of range
- [ ] Test due_date format
- [ ] Test due_time format
- [ ] Test duration negative/too large
- [ ] Test extra fields rejected
- [ ] Test command text too long
- [ ] Test calendar date range validation

### Test Security Headers
- [ ] Test X-Frame-Options present
- [ ] Test X-Content-Type-Options present
- [ ] Test X-XSS-Protection present
- [ ] Test CSP present
- [ ] Test Referrer-Policy present
- [ ] Test X-Request-ID present (UUID format)

### Test Error Handling
- [ ] Test 404 error format
- [ ] Test 422 validation error format
- [ ] Test request size limit
- [ ] Test endpoint responds

### Run All Tests
```bash
cd backend
python3 -m pip install pytest httpx
python3 -m pytest test_security.py -v
python3 -m pytest  # Run all tests including existing ones
```
- [ ] All security tests pass (31 tests)
- [ ] All existing tests pass (no regressions)

## Documentation
- [ ] Review `SECURITY_HARDENING.md`
- [ ] Review `SECURITY_IMPLEMENTATION_SUMMARY.md`
- [ ] Understand all security features
- [ ] Plan deployment strategy

## Deployment Configuration

### Railway (Backend)
Set these environment variables in Railway dashboard:
- [ ] `ENV=production`
- [ ] `ALLOWED_ORIGINS=https://your-frontend.vercel.app`
- [ ] `DEBUG=False`
- [ ] `DATABASE_URL=<auto or provided>`

### Vercel (Frontend)
Set this environment variable in Vercel dashboard:
- [ ] `REACT_APP_API_URL=https://your-backend.up.railway.app/api`

## Pre-Deployment Verification
- [ ] All security tests pass
- [ ] All existing tests pass
- [ ] No console errors in local development
- [ ] Rate limiting triggers correctly
- [ ] CORS works with allowed origins
- [ ] Security headers present
- [ ] Error responses sanitized

## Deployment
- [ ] Commit changes:
  ```bash
  git add .
  git commit -m "Implement comprehensive security hardening"
  ```
- [ ] Deploy to Railway (backend)
- [ ] Deploy to Vercel (frontend)
- [ ] Verify deployment successful

## Post-Deployment Verification
- [ ] Check security headers: `curl -I https://your-api/health`
- [ ] Test rate limiting: Send 130 requests
- [ ] Test validation: POST invalid data
- [ ] Test CORS: Request from another domain
- [ ] Monitor logs for errors
- [ ] Verify performance acceptable

## Troubleshooting Checklist
- [ ] Rate limit responses correct format?
- [ ] CORS working from allowed origins?
- [ ] CORS blocking unauthorized origins?
- [ ] Validation errors helpful and detailed?
- [ ] Security headers present on all responses?
- [ ] Production mode sanitizes errors?
- [ ] Development mode shows full errors?
- [ ] Database queries still performant?
- [ ] Rate limits appropriate for your use case?

## Final Verification
- [ ] All 31 security tests pass ✓
- [ ] All existing tests pass ✓
- [ ] No breaking changes to API ✓
- [ ] Frontend works without modifications ✓
- [ ] Performance acceptable (< 5ms overhead) ✓
- [ ] Documentation complete ✓
- [ ] Rollback plan understood ✓

---

## Quick Command Reference

```bash
# Run setup script
bash .claude/security-hardening-implementation.sh

# Install dependencies
cd backend && pip install -r requirements.txt

# Run security tests
cd backend && python3 -m pytest test_security.py -v

# Run all tests
cd backend && python3 -m pytest -v

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Commit changes
git add .
git commit -m "Implement comprehensive security hardening"

# Check for security headers
curl -I http://localhost:8000/health

# Test rate limiting
for i in {1..130}; do curl -s http://localhost:8000/health; done
```

---

**Status**: Use this checklist to track your implementation progress
**Last Updated**: February 2025
**Version**: 1.0
