from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from database.models import Task, TaskStatus, TaskType, Tag


class TaskService:
    """Service for task management operations."""

    @staticmethod
    def create_task(
        db: Session,
        title: str,
        description: Optional[str] = None,
        importance: int = 3,
        urgency: int = 3,
        due_date: Optional[str] = None,
        due_time: Optional[str] = None,
        duration_minutes: Optional[int] = None,
        task_type: TaskType = TaskType.checklist,
    ) -> Task:
        """Create a new task."""
        # Validate importance and urgency are 1-5
        importance = max(1, min(5, importance))
        urgency = max(1, min(5, urgency))

        task = Task(
            title=title,
            description=description,
            importance=importance,
            urgency=urgency,
            due_date=due_date,
            due_time=due_time,
            duration_minutes=duration_minutes,
            task_type=task_type,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def get_task(db: Session, task_id: int) -> Optional[Task]:
        """Get a task by ID."""
        return db.query(Task).filter(Task.id == task_id).first()

    @staticmethod
    def get_all_tasks(
        db: Session,
        status: Optional[TaskStatus] = None,
        date_filter: Optional[str] = None,
        sort_by: str = 'due_date',
    ) -> List[Task]:
        """Get tasks with optional filtering and sorting."""
        query = db.query(Task)

        # Filter by status
        if status:
            query = query.filter(Task.status == status)
        else:
            # Default: show only pending and in_progress tasks
            query = query.filter(Task.status != TaskStatus.completed)

        # Filter by date
        if date_filter == 'today':
            today = datetime.now().strftime('%Y-%m-%d')
            query = query.filter(Task.due_date == today)
        elif date_filter == 'tomorrow':
            tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            query = query.filter(Task.due_date == tomorrow)
        elif date_filter == 'week':
            today = datetime.now()
            end_of_week = today + timedelta(days=7)
            today_str = today.strftime('%Y-%m-%d')
            end_str = end_of_week.strftime('%Y-%m-%d')
            query = query.filter(and_(Task.due_date >= today_str, Task.due_date <= end_str))
        elif date_filter == 'month':
            today = datetime.now()
            end_of_month = today + timedelta(days=30)
            today_str = today.strftime('%Y-%m-%d')
            end_str = end_of_month.strftime('%Y-%m-%d')
            query = query.filter(and_(Task.due_date >= today_str, Task.due_date <= end_str))

        # Sort
        if sort_by == 'urgency':
            query = query.order_by(Task.urgency.desc(), Task.due_date)
        elif sort_by == 'importance':
            query = query.order_by(Task.importance.desc(), Task.due_date)
        elif sort_by == 'due_date':
            query = query.order_by(Task.due_date, Task.due_time)
        else:
            query = query.order_by(Task.created_at.desc())

        return query.all()

    @staticmethod
    def update_task(
        db: Session,
        task_id: int,
        updates: Dict[str, Any],
    ) -> Optional[Task]:
        """Update a task."""
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None

        # Update allowed fields
        allowed_fields = [
            'title', 'description', 'importance', 'urgency',
            'due_date', 'due_time', 'duration_minutes', 'status', 'task_type'
        ]

        for field, value in updates.items():
            if field in allowed_fields and value is not None:
                setattr(task, field, value)

        task.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def complete_task(db: Session, task_id: int) -> Optional[Task]:
        """Mark a task as completed."""
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None

        task.status = TaskStatus.completed
        task.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def delete_task(db: Session, task_id: int) -> bool:
        """Delete a task."""
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return False

        db.delete(task)
        db.commit()
        return True

    @staticmethod
    def get_priority_matrix(
        db: Session,
        include_completed: bool = False,
    ) -> Dict[str, List[Task]]:
        """
        Get tasks grouped by importance and urgency (Eisenhower Matrix).
        Returns dict with quadrants: 'urgent_important', 'not_urgent_important', etc.
        """
        query = db.query(Task)

        if not include_completed:
            query = query.filter(Task.status != TaskStatus.completed)

        tasks = query.all()

        quadrants = {
            'urgent_important': [],
            'not_urgent_important': [],
            'urgent_not_important': [],
            'not_urgent_not_important': [],
        }

        for task in tasks:
            # 3 is the midpoint of 1-5 scale
            if task.urgency >= 3 and task.importance >= 3:
                quadrants['urgent_important'].append(task)
            elif task.urgency < 3 and task.importance >= 3:
                quadrants['not_urgent_important'].append(task)
            elif task.urgency >= 3 and task.importance < 3:
                quadrants['urgent_not_important'].append(task)
            else:
                quadrants['not_urgent_not_important'].append(task)

        return quadrants

    @staticmethod
    def get_calendar_view(
        db: Session,
        start_date: str,
        end_date: str,
    ) -> Dict[str, List[Task]]:
        """
        Get tasks for calendar view, organized by date.
        Dates should be in ISO format (YYYY-MM-DD).
        """
        query = db.query(Task).filter(
            and_(
                Task.due_date >= start_date,
                Task.due_date <= end_date,
                Task.status != TaskStatus.completed,
            )
        ).order_by(Task.due_date, Task.due_time)

        tasks = query.all()

        # Organize by date
        calendar = {}
        for task in tasks:
            if task.due_date not in calendar:
                calendar[task.due_date] = []
            calendar[task.due_date].append(task)

        return calendar
