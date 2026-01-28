from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

# Association table for Task-Tag relationship
task_tag_association = Table(
    'task_tag',
    Base.metadata,
    Column('task_id', Integer, ForeignKey('task.id')),
    Column('tag_id', Integer, ForeignKey('tag.id'))
)

class TaskStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"

class TaskType(str, enum.Enum):
    calendar = "calendar"
    checklist = "checklist"

class Task(Base):
    __tablename__ = 'task'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    importance = Column(Integer, default=3)  # 1-5 scale
    urgency = Column(Integer, default=3)  # 1-5 scale
    due_date = Column(String(10), nullable=True, index=True)  # ISO format: YYYY-MM-DD
    due_time = Column(String(5), nullable=True)  # HH:MM format
    duration_minutes = Column(Integer, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.pending, index=True)
    task_type = Column(Enum(TaskType), default=TaskType.checklist)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tags = relationship(
        "Tag",
        secondary=task_tag_association,
        back_populates="tasks",
        cascade="all, delete"
    )

class Tag(Base):
    __tablename__ = 'tag'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    color = Column(String(7), default="#3B82F6")  # Hex color
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tasks = relationship(
        "Task",
        secondary=task_tag_association,
        back_populates="tags"
    )
