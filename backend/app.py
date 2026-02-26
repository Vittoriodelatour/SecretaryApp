import os
import logging
import uuid
from typing import Optional, List, Literal
from datetime import datetime, timedelta
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

from database.database import get_db, init_db
from database.models import Task, TaskStatus, TaskType
from services.nlp_service import NLPService
from services.task_service import TaskService

# ==================== Environment & Logging ====================

ENV = os.getenv("ENV", "development")
IS_PRODUCTION = ENV == "production"
DEBUG = os.getenv("DEBUG", "False").lower() == "true" and not IS_PRODUCTION

logging.basicConfig(level=logging.INFO if IS_PRODUCTION else logging.DEBUG)
logger = logging.getLogger(__name__)

# ==================== Rate Limiter ====================

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri="memory://",
)

# ==================== Security Middleware ====================


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


# ==================== FastAPI App Initialization ====================

app = FastAPI(
    title="Personal Secretary API",
    debug=DEBUG,
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
)

# Add rate limiter exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add middleware in order (important - order matters)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware, max_upload_size=1_000_000)

# Load CORS configuration from environment
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=3600,
)

# Initialize NLP service
nlp_service = NLPService()

# ==================== Query Parameter Enums ====================


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


# ==================== Pydantic Models ====================


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
        "extra": "forbid",
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
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError("due_date must be in YYYY-MM-DD format")
        return v

    @field_validator("due_time")
    @classmethod
    def validate_due_time(cls, v: Optional[str]) -> Optional[str]:
        if v:
            try:
                datetime.strptime(v, "%H:%M")
            except ValueError:
                raise ValueError("due_time must be in HH:MM format")
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


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    importance: int
    urgency: int
    due_date: Optional[str]
    due_time: Optional[str]
    duration_minutes: Optional[int]
    status: str
    task_type: str
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


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


class CommandResponse(BaseModel):
    success: bool
    action: str
    message: str
    task: Optional[TaskResponse] = None
    tasks: Optional[List[TaskResponse]] = None


# ==================== Exception Handlers ====================


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all handler to prevent internal details from leaking."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}", exc_info=True)

    error_message = (
        "An internal error occurred. Please try again later."
        if IS_PRODUCTION
        else str(exc)
    )
    detail = None if IS_PRODUCTION else None

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


# ==================== Startup Event ====================


@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info(f"Application started in {ENV} mode")
    logger.info(f"Allowed CORS origins: {ALLOWED_ORIGINS}")


# ==================== Health Check ====================


@app.get("/health")
@limiter.limit("120/minute")
async def health_check(request: Request):
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


# ==================== Command Processing ====================


@app.post("/api/command")
@limiter.limit("30/minute")
async def process_command(
    request: Request, command: CommandRequest, db: Session = Depends(get_db)
):
    """Process a natural language command."""
    text = command.text.strip()

    if not text:
        return {
            "success": False,
            "action": "error",
            "message": "Command cannot be empty",
        }

    # Parse the command
    parsed = nlp_service.parse_command(text)
    intent = parsed.get("intent")
    entities = parsed.get("entities", {})

    # Handle unknown intent
    if intent == "unknown":
        return {
            "success": False,
            "action": "unknown_command",
            "message": entities.get(
                "message",
                "I did not understand that command.",
            ),
        }

    # Handle add_task
    if intent == "add_task":
        if not entities.get("title"):
            return {
                "success": False,
                "action": "error",
                "message": "Could not extract task title",
            }

        task = TaskService.create_task(
            db=db,
            title=entities["title"],
            importance=entities.get("importance", 3),
            urgency=entities.get("urgency", 3),
            due_date=entities.get("due_date"),
            due_time=entities.get("due_time"),
            task_type=TaskType.calendar if entities.get("due_time") else TaskType.checklist,
        )

        message = f"Task '{task.title}' added"
        if task.due_date:
            message += f" for {task.due_date}"
            if task.due_time:
                message += f" at {task.due_time}"

        return {
            "success": True,
            "action": "task_created",
            "message": message,
            "task": TaskResponse.model_validate(task),
        }

    # Handle list_tasks
    elif intent == "list_tasks":
        date_filter = entities.get("date_filter")
        sort_by = entities.get("sort_by", "due_date")

        tasks = TaskService.get_all_tasks(
            db=db,
            status=TaskStatus.pending,
            date_filter=date_filter,
            sort_by=sort_by,
        )

        message = f"Found {len(tasks)} task"
        message += "s" if len(tasks) != 1 else ""
        if date_filter:
            message += f" for {date_filter}"

        return {
            "success": True,
            "action": "tasks_listed",
            "message": message,
            "tasks": [TaskResponse.model_validate(t) for t in tasks],
        }

    # Handle complete_task
    elif intent == "complete_task":
        task_id = entities.get("task_id")
        task_title = entities.get("task_title")

        task = None
        if task_id:
            task = TaskService.get_task(db, task_id)

        if not task and task_title:
            # Search by title
            task = db.query(Task).filter(Task.title.ilike(f"%{task_title}%")).first()

        if not task:
            return {
                "success": False,
                "action": "error",
                "message": "Could not find task to complete",
            }

        completed_task = TaskService.complete_task(db, task.id)
        return {
            "success": True,
            "action": "task_completed",
            "message": f"Task '{completed_task.title}' marked as complete",
            "task": TaskResponse.model_validate(completed_task),
        }

    # Handle delete_task
    elif intent == "delete_task":
        task_id = entities.get("task_id")
        task_title = entities.get("task_title")

        task = None
        if task_id:
            task = TaskService.get_task(db, task_id)

        if not task and task_title:
            # Search by title
            task = db.query(Task).filter(Task.title.ilike(f"%{task_title}%")).first()

        if not task:
            return {
                "success": False,
                "action": "error",
                "message": "Could not find task to delete",
            }

        task_title = task.title
        TaskService.delete_task(db, task.id)
        return {
            "success": True,
            "action": "task_deleted",
            "message": f"Task '{task_title}' deleted",
        }

    return {"success": False, "action": "error", "message": "Unknown intent"}


# ==================== Task Management ====================


@app.get("/api/tasks", response_model=List[TaskResponse])
@limiter.limit("60/minute")
async def get_tasks(
    request: Request,
    status: TaskStatusQuery = Query(TaskStatusQuery.pending),
    date_filter: Optional[DateFilterQuery] = Query(None),
    sort_by: SortByQuery = Query(SortByQuery.due_date),
    db: Session = Depends(get_db),
):
    """Get tasks with optional filtering."""
    # Map query enum to TaskStatus enum
    status_map = {
        "pending": TaskStatus.pending,
        "completed": TaskStatus.completed,
        "in_progress": TaskStatus.in_progress,
        "all": None,  # None means no status filter
    }
    status_enum = status_map.get(status.value)

    tasks = TaskService.get_all_tasks(
        db=db,
        status=status_enum,
        date_filter=date_filter.value if date_filter else None,
        sort_by=sort_by.value,
    )
    return [TaskResponse.model_validate(t) for t in tasks]


@app.post("/api/tasks", response_model=TaskResponse)
@limiter.limit("20/minute")
async def create_task(
    request: Request, task_data: TaskCreate, db: Session = Depends(get_db)
):
    """Create a new task manually."""
    task_type = TaskType.calendar if task_data.due_time else TaskType.checklist

    task = TaskService.create_task(
        db=db,
        title=task_data.title,
        description=task_data.description,
        importance=task_data.importance,
        urgency=task_data.urgency,
        due_date=task_data.due_date,
        due_time=task_data.due_time,
        duration_minutes=task_data.duration_minutes,
        task_type=task_type,
    )
    return TaskResponse.model_validate(task)


@app.get("/api/tasks/{task_id}", response_model=TaskResponse)
@limiter.limit("60/minute")
async def get_task(request: Request, task_id: int, db: Session = Depends(get_db)):
    """Get a specific task."""
    task = TaskService.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.model_validate(task)


@app.put("/api/tasks/{task_id}", response_model=TaskResponse)
@limiter.limit("30/minute")
async def update_task(
    request: Request,
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
):
    """Update a task."""
    task = TaskService.update_task(db, task_id, task_data.model_dump(exclude_unset=True))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.model_validate(task)


@app.patch("/api/tasks/{task_id}/complete", response_model=TaskResponse)
@limiter.limit("30/minute")
async def complete_task(
    request: Request, task_id: int, db: Session = Depends(get_db)
):
    """Mark a task as completed."""
    task = TaskService.complete_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.model_validate(task)


@app.delete("/api/tasks/{task_id}")
@limiter.limit("10/minute")
async def delete_task(request: Request, task_id: int, db: Session = Depends(get_db)):
    """Delete a task."""
    success = TaskService.delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True, "message": "Task deleted"}


# ==================== Calendar & Priority Views ====================


@app.get("/api/calendar")
@limiter.limit("30/minute")
async def get_calendar(
    request: Request,
    start_date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    db: Session = Depends(get_db),
):
    """Get calendar view of tasks."""
    # Validate date range
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()

        if start > end:
            raise HTTPException(
                status_code=400,
                detail="start_date must be before or equal to end_date"
            )

        if (end - start).days > 365:
            raise HTTPException(
                status_code=400,
                detail="Date range cannot exceed 365 days"
            )
    except ValueError as e:
        if "exceed 365 days" in str(e) or "before or equal" in str(e):
            raise
        raise HTTPException(
            status_code=400,
            detail="Invalid date format"
        )

    calendar = TaskService.get_calendar_view(db, start_date, end_date)
    return {
        date: [TaskResponse.model_validate(t) for t in tasks]
        for date, tasks in calendar.items()
    }


@app.get("/api/priority-matrix")
@limiter.limit("30/minute")
async def get_priority_matrix(request: Request, db: Session = Depends(get_db)):
    """Get tasks organized by priority matrix (Eisenhower Matrix)."""
    matrix = TaskService.get_priority_matrix(db)
    return {
        quadrant: [TaskResponse.model_validate(t) for t in tasks]
        for quadrant, tasks in matrix.items()
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
