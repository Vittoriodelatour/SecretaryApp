from dateparser import parse
from datetime import datetime, timedelta
from typing import Optional, Tuple
import re

def parse_natural_date(text: str) -> Optional[str]:
    """
    Parse natural language date from text.
    Returns ISO format date string (YYYY-MM-DD) or None if not found.
    """
    # Remove common date-related words to clean the text
    cleaned = text.lower()

    # Handle special cases first
    if 'today' in cleaned:
        return datetime.now().strftime('%Y-%m-%d')
    if 'tomorrow' in cleaned:
        return (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

    # Try dateparser for more complex dates
    parsed = parse(cleaned, settings={'RETURN_AS_TIMEZONE_AWARE': False})
    if parsed:
        return parsed.strftime('%Y-%m-%d')

    return None

def parse_natural_time(text: str) -> Optional[str]:
    """
    Parse natural language time from text.
    Returns HH:MM format string or None if not found.
    """
    text_lower = text.lower()

    # Look for time patterns like "2pm", "14:30", "2:30 pm", etc.
    time_patterns = [
        r'\b(\d{1,2}):(\d{2})\s*(am|pm)?\b',  # HH:MM am/pm
        r'\b(\d{1,2})(am|pm)\b',  # H am/pm (e.g., "2pm")
    ]

    for pattern in time_patterns:
        match = re.search(pattern, text_lower)
        if match:
            if len(match.groups()) == 3:  # HH:MM am/pm format
                hour = int(match.group(1))
                minute = int(match.group(2))
                meridiem = match.group(3)

                if meridiem and meridiem == 'pm' and hour != 12:
                    hour += 12
                elif meridiem and meridiem == 'am' and hour == 12:
                    hour = 0

                return f"{hour:02d}:{minute:02d}"
            elif len(match.groups()) == 2:  # H am/pm format
                hour = int(match.group(1))
                meridiem = match.group(2)

                if meridiem == 'pm' and hour != 12:
                    hour += 12
                elif meridiem == 'am' and hour == 12:
                    hour = 0

                return f"{hour:02d}:00"

    return None

def extract_date_and_time(text: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Extract both date and time from natural language text.
    Returns tuple of (date_str, time_str) in ISO formats.
    """
    date = parse_natural_date(text)
    time = parse_natural_time(text)
    return date, time
