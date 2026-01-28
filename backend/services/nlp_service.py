import re
from typing import Dict, Any, Optional
from utils.date_parser import extract_date_and_time

class NLPService:
    """Natural language processing service for command parsing."""

    def __init__(self):
        self.importance_keywords = {
            'high': ['urgent', 'critical', 'important', 'asap', 'high priority', 'priority'],
            'low': ['low priority', 'whenever', 'someday', 'eventually', 'low'],
        }

    def parse_command(self, text: str) -> Dict[str, Any]:
        """
        Parse a natural language command and extract intent and entities.
        Returns a dict with 'intent' and 'entities' keys.
        """
        text_lower = text.lower().strip()

        # Detect intent
        intent = self._detect_intent(text_lower)

        if intent == 'add_task':
            return self._parse_add_task(text)
        elif intent == 'list_tasks':
            return self._parse_list_tasks(text)
        elif intent == 'complete_task':
            return self._parse_complete_task(text)
        elif intent == 'delete_task':
            return self._parse_delete_task(text)
        elif intent == 'unknown':
            return {
                'intent': 'unknown',
                'entities': {},
                'message': 'I did not understand that command. Try "add task", "show tasks", or "complete task".'
            }

        return {'intent': intent, 'entities': {}}

    def _detect_intent(self, text: str) -> str:
        """Detect the intent of the command."""
        add_patterns = [
            r'\b(add|create|schedule|remind me to|set up)\b',
            r'\b(i need to|gotta|have to)\b'
        ]
        list_patterns = [
            r'\b(show|list|what are|get|display)\b.*\b(task|tasks|todo|schedule)\b',
            r'\b(what\'s|whats)\b.*\b(on my|my)\b.*\b(agenda|schedule|plate)\b',
        ]
        complete_patterns = [
            r'\b(complete|finish|done|mark done|mark as done|check off|finished)\b',
        ]
        delete_patterns = [
            r'\b(delete|remove|cancel|clear)\b.*\b(task|tasks)\b',
        ]

        for pattern in add_patterns:
            if re.search(pattern, text):
                return 'add_task'

        for pattern in list_patterns:
            if re.search(pattern, text):
                return 'list_tasks'

        for pattern in complete_patterns:
            if re.search(pattern, text):
                return 'complete_task'

        for pattern in delete_patterns:
            if re.search(pattern, text):
                return 'delete_task'

        return 'unknown'

    def _parse_add_task(self, text: str) -> Dict[str, Any]:
        """Parse an 'add task' command."""
        text_lower = text.lower()

        # Extract title: remove command words and extra context
        title = text
        remove_patterns = [
            r'\b(add|create|schedule|remind me to|set up|i need to|gotta|have to)\b',
        ]
        for pattern in remove_patterns:
            title = re.sub(pattern, '', title, flags=re.IGNORECASE)

        title = title.strip()

        # Remove date/time from title for cleaner extraction
        title = re.sub(r'\b(today|tomorrow|next\s+\w+|in\s+\d+\s+days?|at\s+\d+(?:am|pm)?)\b', '', title, flags=re.IGNORECASE)
        title = title.strip()

        # Extract date and time
        date, time = extract_date_and_time(text)

        # Extract importance level
        importance = self._extract_importance(text)

        entities = {
            'title': title,
        }
        if date:
            entities['due_date'] = date
        if time:
            entities['due_time'] = time
        if importance:
            entities['importance'] = importance

        return {
            'intent': 'add_task',
            'entities': entities,
        }

    def _parse_list_tasks(self, text: str) -> Dict[str, Any]:
        """Parse a 'list tasks' command."""
        text_lower = text.lower()

        entities = {}

        # Extract date filter
        if 'today' in text_lower:
            entities['date_filter'] = 'today'
        elif 'tomorrow' in text_lower:
            entities['date_filter'] = 'tomorrow'
        elif 'this week' in text_lower or 'week' in text_lower:
            entities['date_filter'] = 'week'
        elif 'this month' in text_lower or 'month' in text_lower:
            entities['date_filter'] = 'month'

        # Extract urgency filter
        if 'urgent' in text_lower or 'critical' in text_lower:
            entities['urgency_filter'] = 'high'

        # Extract importance filter
        if 'important' in text_lower:
            entities['importance_filter'] = 'high'

        # Extract sort criteria
        if 'urgency' in text_lower or 'urgent' in text_lower:
            entities['sort_by'] = 'urgency'
        elif 'importance' in text_lower:
            entities['sort_by'] = 'importance'
        elif 'date' in text_lower or 'due' in text_lower:
            entities['sort_by'] = 'due_date'

        return {
            'intent': 'list_tasks',
            'entities': entities,
        }

    def _parse_complete_task(self, text: str) -> Dict[str, Any]:
        """Parse a 'complete task' command."""
        text_lower = text.lower()

        # Try to extract task identifier (number or title)
        entities = {}

        # Look for task number
        number_match = re.search(r'#?(\d+)', text)
        if number_match:
            entities['task_id'] = int(number_match.group(1))

        # Try to extract task title
        title = text
        remove_patterns = [
            r'\b(complete|finish|done|mark done|mark as done|check off|finished|task)\b'
        ]
        for pattern in remove_patterns:
            title = re.sub(pattern, '', title, flags=re.IGNORECASE)
        title = title.strip()

        if title and len(title) > 1:
            entities['task_title'] = title

        return {
            'intent': 'complete_task',
            'entities': entities,
        }

    def _parse_delete_task(self, text: str) -> Dict[str, Any]:
        """Parse a 'delete task' command."""
        text_lower = text.lower()

        entities = {}

        # Look for task number
        number_match = re.search(r'#?(\d+)', text)
        if number_match:
            entities['task_id'] = int(number_match.group(1))

        # Try to extract task title
        title = text
        remove_patterns = [
            r'\b(delete|remove|cancel|clear|task)\b'
        ]
        for pattern in remove_patterns:
            title = re.sub(pattern, '', title, flags=re.IGNORECASE)
        title = title.strip()

        if title and len(title) > 1:
            entities['task_title'] = title

        return {
            'intent': 'delete_task',
            'entities': entities,
        }

    def _extract_importance(self, text: str) -> Optional[int]:
        """Extract importance level (1-5) from text."""
        text_lower = text.lower()

        for keyword in self.importance_keywords['high']:
            if keyword in text_lower:
                return 5

        for keyword in self.importance_keywords['low']:
            if keyword in text_lower:
                return 1

        # Default importance (medium)
        return None
