from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

from database.database import get_db, init_db
from database.models import Task, TaskStatus, TaskType
from services.nlp_service import NLPService
from services.task_service import TaskService

# Initialize FastAPI app
app = FastAPI(title="Personal Secretary API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Initialize NLP service
nlp_service = NLPService()

# ==================== Pydantic Models ====================

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    importance: int = 3
    urgency: int = 3
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    task_type: str = "checklist"

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    importance: Optional[int] = None
    urgency: Optional[int] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    status: Optional[str] = None
    task_type: Optional[str] = None

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
    text: str

class CommandResponse(BaseModel):
    success: bool
    action: str
    message: str
    task: Optional[TaskResponse] = None
    tasks: Optional[List[TaskResponse]] = None

# ==================== Health Check ====================

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

# ==================== Command Processing ====================

@app.post("/api/command")
async def process_command(request: CommandRequest, db: Session = Depends(get_db)):
    """Process a natural language command."""
    text = request.text.strip()

    if not text:
        return {"success": False, "action": "error", "message": "Command cannot be empty"}

    # Parse the command
    parsed = nlp_service.parse_command(text)
    intent = parsed.get('intent')
    entities = parsed.get('entities', {})

    # Handle unknown intent
    if intent == 'unknown':
        return {
            "success": False,
            "action": "unknown_command",
            "message": entities.get('message', 'I did not understand that command.')
        }

    # Handle add_task
    if intent == 'add_task':
        if not entities.get('title'):
            return {"success": False, "action": "error", "message": "Could not extract task title"}

        task = TaskService.create_task(
            db=db,
            title=entities['title'],
            importance=entities.get('importance', 3),
            urgency=entities.get('urgency', 3),
            due_date=entities.get('due_date'),
            due_time=entities.get('due_time'),
            task_type=TaskType.calendar if entities.get('due_time') else TaskType.checklist,
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
            "task": TaskResponse.from_orm(task)
        }

    # Handle list_tasks
    elif intent == 'list_tasks':
        date_filter = entities.get('date_filter')
        sort_by = entities.get('sort_by', 'due_date')

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
            "tasks": [TaskResponse.from_orm(t) for t in tasks]
        }

    # Handle complete_task
    elif intent == 'complete_task':
        task_id = entities.get('task_id')
        task_title = entities.get('task_title')

        task = None
        if task_id:
            task = TaskService.get_task(db, task_id)

        if not task and task_title:
            # Search by title
            all_tasks = db.query(Task).filter(Task.title.ilike(f"%{task_title}%")).first()
            task = all_tasks

        if not task:
            return {
                "success": False,
                "action": "error",
                "message": "Could not find task to complete"
            }

        completed_task = TaskService.complete_task(db, task.id)
        return {
            "success": True,
            "action": "task_completed",
            "message": f"Task '{completed_task.title}' marked as complete",
            "task": TaskResponse.from_orm(completed_task)
        }

    # Handle delete_task
    elif intent == 'delete_task':
        task_id = entities.get('task_id')
        task_title = entities.get('task_title')

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
                "message": "Could not find task to delete"
            }

        task_title = task.title
        TaskService.delete_task(db, task.id)
        return {
            "success": True,
            "action": "task_deleted",
            "message": f"Task '{task_title}' deleted"
        }

    return {"success": False, "action": "error", "message": "Unknown intent"}

# ==================== Task Management ====================

@app.get("/api/tasks", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[str] = Query("pending"),
    date_filter: Optional[str] = None,
    sort_by: str = "due_date",
    db: Session = Depends(get_db)
):
    """Get tasks with optional filtering."""
    status_enum = TaskStatus.pending if status == "pending" else None
    tasks = TaskService.get_all_tasks(
        db=db,
        status=status_enum,
        date_filter=date_filter,
        sort_by=sort_by,
    )
    return [TaskResponse.from_orm(t) for t in tasks]

@app.post("/api/tasks", response_model=TaskResponse)
async def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
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
    return TaskResponse.from_orm(task)

@app.get("/api/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a specific task."""
    task = TaskService.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.from_orm(task)

@app.put("/api/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task_data: TaskUpdate, db: Session = Depends(get_db)):
    """Update a task."""
    task = TaskService.update_task(db, task_id, task_data.dict(exclude_unset=True))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.from_orm(task)

@app.patch("/api/tasks/{task_id}/complete", response_model=TaskResponse)
async def complete_task(task_id: int, db: Session = Depends(get_db)):
    """Mark a task as completed."""
    task = TaskService.complete_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.from_orm(task)

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task."""
    success = TaskService.delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True, "message": "Task deleted"}

# ==================== Calendar & Priority Views ====================

@app.get("/api/calendar")
async def get_calendar(
    start_date: str = Query(...),
    end_date: str = Query(...),
    db: Session = Depends(get_db)
):
    """Get calendar view of tasks."""
    calendar = TaskService.get_calendar_view(db, start_date, end_date)
    return {
        date: [TaskResponse.from_orm(t) for t in tasks]
        for date, tasks in calendar.items()
    }

@app.get("/api/priority-matrix")
async def get_priority_matrix(db: Session = Depends(get_db)):
    """Get tasks organized by priority matrix (Eisenhower Matrix)."""
    matrix = TaskService.get_priority_matrix(db)
    return {
        quadrant: [TaskResponse.from_orm(t) for t in tasks]
        for quadrant, tasks in matrix.items()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
