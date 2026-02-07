# FastAPI Security Hardening Code Template
# Copy and adapt these sections to your app.py file

# ==================== IMPORTS ====================
# Add these imports to your existing imports:

import os
import logging
import uuid
from typing import Optional, List, Literal
from enum import Enum

from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded


# ==================== ENVIRONMENT & LOGGING ====================
# Add this configuration section near the top:

ENV = os.getenv("ENV", "development")
IS_PRODUCTION = ENV == "production"
DEBUG = os.getenv("DEBUG", "False").lower() == "true" and not IS_PRODUCTION

logging.basicConfig(level=logging.INFO if IS_PRODUCTION else logging.DEBUG)
logger = logging.getLogger(__name__)


# ==================== RATE LIMITER ====================
# Initialize the rate limiter:

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri="memory://",
)


# ==================== SECURITY MIDDLEWARE ====================
# Add these middleware classes before the FastAPI app initialization:

class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Limit request body size to prevent DoS attacks."""

    def __init__(self, app, max_upload_size: int = 1_000_000):  # 1MB
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request: Request, call_next):
        if request.method in ["POST", "PUT", "PATCH"]:
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > self.max_upload_size:
                return JSONResponse(
                    status_code=413,
                    content={
                        "error": "Request too large",
                        "message": f"Request body must be less than {self.max_upload_size / 1000}KB",
                    },
                )
        response = await call_next(request)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Enable XSS filter
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Content Security Policy
        response.headers["Content-Security-Policy"] = "default-src 'self'"

        # HSTS (only on HTTPS)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Add unique request ID for tracing."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        return response


# ==================== FASTAPI APP INITIALIZATION ====================
# Update your FastAPI initialization:

app = FastAPI(
    title="Your API Title",
    debug=DEBUG,
    docs_url="/docs" if DEBUG else None,  # Hide in production
    redoc_url="/redoc" if DEBUG else None,  # Hide in production
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add middleware in correct order (ORDER MATTERS!)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware, max_upload_size=1_000_000)

# Configure CORS with environment variable
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
    max_age=3600,
)


# ==================== QUERY PARAMETER ENUMS ====================
# Add these enums for type-safe query parameters:

class TaskStatusQuery(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    all = "all"


class DateFilterQuery(str, Enum):
    today = "today"
    tomorrow = "tomorrow"
    week = "week"
    month = "month"


class SortByQuery(str, Enum):
    due_date = "due_date"
    urgency = "urgency"
    importance = "importance"
    created_at = "created_at"


# ==================== PYDANTIC MODELS ====================
# Add validation to your Pydantic models:

class TaskCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Task title",
    )
    description: Optional[str] = Field(None, max_length=5000)
    importance: int = Field(default=3, ge=1, le=5)
    urgency: int = Field(default=3, ge=1, le=5)
    due_date: Optional[str] = Field(
        None, pattern=r"^\d{4}-\d{2}-\d{2}$", max_length=10
    )
    due_time: Optional[str] = Field(
        None, pattern=r"^([01]\d|2[0-3]):([0-5]\d)$", max_length=5
    )
    duration_minutes: Optional[int] = Field(None, ge=1, le=1440)
    task_type: Literal["calendar", "checklist"] = Field(default="checklist")

    model_config = {
        "extra": "forbid",  # Reject unexpected fields
        "str_strip_whitespace": True,
    }

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("title cannot be empty")
        return v.strip()

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, v: Optional[str]) -> Optional[str]:
        if v:
            try:
                from datetime import datetime
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError("due_date must be in YYYY-MM-DD format")
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    importance: Optional[int] = Field(None, ge=1, le=5)
    urgency: Optional[int] = Field(None, ge=1, le=5)
    due_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    due_time: Optional[str] = Field(None, pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    duration_minutes: Optional[int] = Field(None, ge=1, le=1440)
    status: Optional[Literal["pending", "in_progress", "completed"]] = None
    task_type: Optional[Literal["calendar", "checklist"]] = None

    model_config = {
        "extra": "forbid",
        "str_strip_whitespace": True,
    }


class CommandRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)

    model_config = {
        "extra": "forbid",
        "str_strip_whitespace": True,
    }

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("command text cannot be empty")
        return v.strip()


# ==================== EXCEPTION HANDLERS ====================
# Add these exception handlers:

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all handler to prevent internal details from leaking."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}", exc_info=True)

    error_message = (
        "An internal error occurred. Please try again later."
        if IS_PRODUCTION
        else str(exc)
    )

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": error_message,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with clear messages."""
    errors = exc.errors()
    formatted_errors = []

    for error in errors:
        field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        formatted_errors.append({
            "field": field,
            "message": error["msg"],
        })

    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "message": "Invalid input data",
            "errors": formatted_errors,
        },
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors without exposing schema."""
    logger.error(f"Database error on {request.url.path}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "error": "Database Error",
            "message": "A database error occurred. Please try again later.",
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with consistent format."""
    detail = exc.detail if not IS_PRODUCTION else "An error occurred"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "Request Error",
            "message": detail,
        },
    )


@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded with Retry-After header."""
    retry_after = "60"
    if "Retry after" in exc.detail:
        retry_after = exc.detail.split("Retry after ")[1].split()[0]

    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": "Too many requests. Please try again later.",
            "retry_after": int(retry_after),
        },
        headers={"Retry-After": retry_after},
    )


# ==================== STARTUP EVENT ====================
# Add startup logging:

@app.on_event("startup")
async def startup_event():
    # Your existing startup code here (e.g., init_db())
    logger.info(f"Application started in {ENV} mode")
    logger.info(f"Allowed CORS origins: {ALLOWED_ORIGINS}")


# ==================== ENDPOINT DECORATORS ====================
# Add @limiter.limit() decorator to all endpoints:

# Example endpoints with rate limiting:

@app.get("/health")
@limiter.limit("120/minute")
async def health_check(request: Request):
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.post("/api/command")
@limiter.limit("30/minute")
async def process_command(request: Request, command: CommandRequest, db: Session = Depends(get_db)):
    # Your endpoint logic here
    pass


@app.get("/api/tasks")
@limiter.limit("60/minute")
async def get_tasks(
    request: Request,
    status: TaskStatusQuery = Query(TaskStatusQuery.pending),
    date_filter: Optional[DateFilterQuery] = Query(None),
    sort_by: SortByQuery = Query(SortByQuery.due_date),
    db: Session = Depends(get_db),
):
    # Your endpoint logic here
    # Use status.value, sort_by.value, etc. for actual values
    pass


@app.post("/api/tasks")
@limiter.limit("20/minute")
async def create_task(request: Request, task_data: TaskCreate, db: Session = Depends(get_db)):
    # Your endpoint logic here
    pass


@app.put("/api/tasks/{task_id}")
@limiter.limit("30/minute")
async def update_task(
    request: Request,
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
):
    # Your endpoint logic here
    pass


@app.delete("/api/tasks/{task_id}")
@limiter.limit("10/minute")
async def delete_task(request: Request, task_id: int, db: Session = Depends(get_db)):
    # Your endpoint logic here
    pass


# ==================== NOTES ====================
#
# 1. Add @limiter.limit() decorator to ALL endpoints
# 2. Always include `request: Request` as first parameter for rate limiting
# 3. Adjust rate limits based on your actual use case
# 4. Test all endpoints with rate limiting tests
# 5. Use Query() with Enum for type-safe query parameters
# 6. Validate dates and times with regex patterns
# 7. Set ALLOWED_ORIGINS environment variable before deployment
# 8. Keep DEBUG=False in production
# 9. Monitor logs for security issues
# 10. Run tests to verify all features work
#
