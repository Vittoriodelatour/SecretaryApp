#!/usr/bin/env python3
"""Simple test script for backend API."""

from database.database import init_db
from database.models import Task
from services.nlp_service import NLPService
from services.task_service import TaskService
from database.database import SessionLocal

def test_database():
    """Test database initialization and basic operations."""
    print("Testing database...")
    init_db()
    print("✓ Database initialized")

def test_nlp():
    """Test NLP service."""
    print("\nTesting NLP service...")
    nlp = NLPService()

    # Test add_task intent
    result = nlp.parse_command("add task call dentist tomorrow at 2pm")
    assert result['intent'] == 'add_task'
    assert 'call dentist' in result['entities']['title']
    print("✓ Add task parsing works")

    # Test list_tasks intent
    result = nlp.parse_command("show tasks for today")
    assert result['intent'] == 'list_tasks'
    print("✓ List tasks parsing works")

    # Test complete_task intent
    result = nlp.parse_command("complete task number 1")
    assert result['intent'] == 'complete_task'
    print("✓ Complete task parsing works")

def test_task_service():
    """Test task service."""
    print("\nTesting task service...")
    db = SessionLocal()

    # Create a task
    task = TaskService.create_task(
        db=db,
        title="Test task",
        importance=5,
        urgency=4,
        due_date="2026-01-29",
    )
    assert task.id is not None
    print(f"✓ Created task: {task.title} (ID: {task.id})")

    # Get the task
    retrieved = TaskService.get_task(db, task.id)
    assert retrieved.title == "Test task"
    print("✓ Retrieved task successfully")

    # Update the task
    updated = TaskService.update_task(
        db=db,
        task_id=task.id,
        updates={'title': 'Updated task'}
    )
    assert updated.title == 'Updated task'
    print("✓ Updated task successfully")

    # Complete the task
    completed = TaskService.complete_task(db, task.id)
    assert completed.status.value == 'completed'
    print("✓ Completed task successfully")

    # Delete the task
    success = TaskService.delete_task(db, task.id)
    assert success
    print("✓ Deleted task successfully")

    db.close()

def main():
    """Run all tests."""
    print("=" * 50)
    print("Personal Secretary Backend Tests")
    print("=" * 50)

    try:
        test_database()
        test_nlp()
        test_task_service()

        print("\n" + "=" * 50)
        print("✓ All tests passed!")
        print("=" * 50)
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
