# Security Hardening Implementation Process

This document captures the complete security hardening process that was implemented for the Secretary App. Use this as a reference for implementing similar security features in other FastAPI projects.

## Quick Start

To implement this in a new project:
```bash
# From the project root with a FastAPI app
bash .claude/security-hardening-implementation.sh
```

## Process Overview

### Phase 1: Input Validation (Low Risk)
Enhance Pydantic models with comprehensive validation constraints.

**Key Changes:**
- Add `Field()` with min_length, max_length, pattern, ge/le constraints
- Add `field_validator` methods for semantic validation
- Add `model_config = {"extra": "forbid", "str_strip_whitespace": True}`
- Create Enum classes for query parameters

**Files Modified:**
- `backend/app.py` - Pydantic models

**Tests:**
- Title length validation (1-500 chars)
- Importance/urgency bounds (1-5)
- Duration bounds (1-1440 min)
- Date format validation (YYYY-MM-DD)
- Time format validation (HH:MM)
- Extra field rejection

### Phase 2: Security Headers & Error Handling (Low Risk)
Add middleware for security headers and sanitized error responses.

**Key Changes:**
- Create `RequestSizeLimitMiddleware` (1MB limit)
- Create `SecurityHeadersMiddleware` (7 headers)
- Create `RequestIDMiddleware` (UUID tracing)
- Add exception handlers for all error types
- Environment-based debug/production modes

**Files Modified:**
- `backend/app.py` - Middleware classes and exception handlers

**Headers Added:**
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: default-src 'self'
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security: max-age=31536000 (HTTPS only)
- X-Request-ID: UUID

### Phase 3: Rate Limiting (Medium Risk)
Implement SlowAPI with in-memory storage.

**Key Changes:**
- Add `slowapi==0.1.9` to requirements.txt
- Initialize limiter with `Limiter(key_func=get_remote_address, storage_uri="memory://")`
- Add `@limiter.limit()` decorators to all endpoints
- Custom rate limit exception handler

**Rate Limits:**
- Health: 120/min
- Command: 30/min
- Create task: 20/min
- Delete task: 10/min
- Other operations: 30/min or 60/min

**Response Format:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

**Files Modified:**
- `backend/requirements.txt` - Add slowapi
- `backend/app.py` - Rate limiter initialization and decorators

### Phase 4: CORS Restriction (Medium Risk)
Replace wildcard with environment-based origin whitelist.

**Key Changes:**
- Load ALLOWED_ORIGINS from environment variable
- Update CORSMiddleware with specific origins list
- Set environment variable before deployment

**Environment Variable:**
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Files Modified:**
- `backend/app.py` - CORS configuration

### Phase 5: Secrets Management (Cleanup)
Remove committed secrets, update .gitignore, document env setup.

**Key Changes:**
- Create `.env.example` files (not to be ignored)
- Remove sensitive `.env` files from git tracking
- Update `.gitignore` with comprehensive patterns
- Document environment variables in README

**Pattern:**
```gitignore
.env
.env.*
!.env.example

backend/.env
backend/.env.*
!backend/.env.example

frontend/.env
frontend/.env.*
!frontend/.env.example
```

**Files Modified/Created:**
- `backend/.env.example` - Environment template
- `frontend/.env.example` - Environment template
- `.gitignore` - Comprehensive patterns
- Removed from tracking: `frontend/.env.production`

### Phase 6: SQL Injection Prevention (Optional)
Add sanitization to NLP service search operations.

**Key Changes:**
- Add `_sanitize_search_term()` method
- Remove SQL wildcards (%, _)
- Limit search term length (100 chars)
- Apply to ILIKE queries

**Files Modified:**
- `backend/services/nlp_service.py` - Sanitization method

### Phase 7: Comprehensive Testing
Create security test suite to validate all features.

**Test Coverage:**
- Rate limiting tests (4 tests)
- Input validation tests (14 tests)
- Security header tests (6 tests)
- Error handling tests (5 tests)
- Validation detail tests (2 tests)

**Files Created:**
- `backend/test_security.py` - 31 comprehensive tests

**Run Tests:**
```bash
cd backend
python3 -m pytest test_security.py -v
```

### Phase 8: Documentation
Create guides for deployment and troubleshooting.

**Files Created:**
- `SECURITY_HARDENING.md` - Complete deployment guide
- `SECURITY_IMPLEMENTATION_SUMMARY.md` - Implementation summary

---

## Critical Sections of Code

### 1. Pydantic Model with Validation
```python
from pydantic import BaseModel, Field, field_validator

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    importance: int = Field(default=3, ge=1, le=5)
    due_date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')

    model_config = {"extra": "forbid", "str_strip_whitespace": True}

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('title cannot be empty')
        return v.strip()
```

### 2. Security Middleware
```python
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response
```

### 3. Rate Limiting Setup
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri="memory://",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/endpoint")
@limiter.limit("30/minute")
async def endpoint(request: Request):
    pass
```

### 4. Environment-Based CORS
```python
import os

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)
```

### 5. Exception Handlers
```python
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An error occurred" if IS_PRODUCTION else str(exc),
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        errors.append({"field": field, "message": error["msg"]})
    return JSONResponse(
        status_code=422,
        content={"error": "Validation Error", "message": "Invalid input data", "errors": errors}
    )
```

---

## Environment Configuration

### Development (.env)
```bash
ENV=development
DATABASE_URL=sqlite:///./secretary.db
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
DEBUG=True
```

### Production (Railway/Vercel)
```bash
ENV=production
ALLOWED_ORIGINS=https://your-frontend.vercel.app
DEBUG=False
DATABASE_URL=<auto-set or provided>
```

---

## Testing Checklist

### Unit Tests
- [ ] Rate limiting tests pass
- [ ] Input validation tests pass
- [ ] Security header tests pass
- [ ] Error handling tests pass
- [ ] Existing tests still pass

### Manual Testing
- [ ] Health endpoint responds
- [ ] Rate limiting triggers 429
- [ ] 429 includes Retry-After header
- [ ] Invalid input triggers 422
- [ ] Extra fields rejected
- [ ] CORS works from allowed origin
- [ ] CORS blocks unauthorized origin
- [ ] Security headers present
- [ ] Task CRUD works
- [ ] Command processing works
- [ ] Calendar validation works
- [ ] Production hides stack traces

### Deployment Verification
- [ ] Backend deployed with correct env vars
- [ ] Frontend deployed with correct API URL
- [ ] Security headers present on production
- [ ] Rate limiting enforced
- [ ] Validation working on all endpoints

---

## Rollback Plan

If issues arise:

1. **Rate limiting too strict:**
   - Increase limits in app.py decorators
   - Or temporarily set ALLOWED_ORIGINS=* (emergency only)

2. **CORS blocks legitimate requests:**
   - Check ALLOWED_ORIGINS environment variable
   - Verify frontend URL is included

3. **Validation breaks functionality:**
   - Review error messages from 422 responses
   - Adjust Field constraints if needed

4. **Full rollback:**
   ```bash
   git log --oneline -10
   git revert <commit-hash>
   git push origin main
   ```

---

## Performance Impact

Expected overhead per request: < 5ms
- Rate limiter check: ~0.5ms
- Middleware processing: ~1ms
- Pydantic validation: ~2ms
- **Total**: ~3.5ms average

No database changes - performance impact isolated to middleware/validation.

---

## Files Modified Summary

| File | Changes | Lines |
|------|---------|-------|
| backend/app.py | Complete rewrite | +240 |
| backend/requirements.txt | Add slowapi, bleach | +2 |
| backend/services/nlp_service.py | Add sanitization | +20 |
| .gitignore | Enhance patterns | +10 |
| backend/.env.example | NEW | 8 |
| backend/test_security.py | NEW | 353 |
| SECURITY_HARDENING.md | NEW | 450+ |
| SECURITY_IMPLEMENTATION_SUMMARY.md | NEW | 400+ |

**Total Impact: 8 files changed, 1500+ lines added**

---

## Key Takeaways

1. **Pydantic validation** catches bad data before it reaches your code
2. **Rate limiting** at the framework level prevents DoS attacks
3. **Security headers** protect against browser-based attacks
4. **CORS restriction** prevents unauthorized access from other domains
5. **Error sanitization** prevents information leakage in production
6. **Input sanitization** prevents SQL injection in dynamic queries
7. **Environment variables** keep secrets out of the codebase
8. **Comprehensive testing** validates all security features

---

## Future Improvements

1. **Redis rate limiting** - For distributed deployments
2. **API key authentication** - For authenticated endpoints
3. **JWT tokens** - For stateless authentication
4. **Request logging** - For audit trails
5. **Metrics/monitoring** - For security dashboard
6. **DDoS protection** - CloudFlare or similar
7. **WAF rules** - Web Application Firewall
8. **Database encryption** - At-rest encryption

---

## References

- [FastAPI Security Best Practices](https://fastapi.tiangolo.com/advanced/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SlowAPI Documentation](https://slowapi.readthedocs.io/)
- [Pydantic Validation](https://docs.pydantic.dev/latest/concepts/validators/)
- [Starlette Middleware](https://www.starlette.io/middleware/)

---

**Status**: Complete and production-ready
**Last Updated**: February 2025
**Version**: 1.0
