# Quick Start Guide

Get the Personal Secretary app running locally in 5 minutes.

## Prerequisites

- Node.js 16+ ([download](https://nodejs.org/))
- Python 3.8+ ([download](https://www.python.org/))
- Git

## Installation

### 1. Start Backend (Terminal Window 1)

```bash
cd secretary-app/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
python3 -m uvicorn app:app --reload
```

✓ Backend running at: `http://localhost:8000`

Check it's working:
```bash
curl http://localhost:8000/health
```

### 2. Start Frontend (Terminal Window 2)

```bash
cd secretary-app/frontend

# Install dependencies
npm install

# Start development server
npm start
```

✓ Frontend opens at: `http://localhost:3000`

## First Steps

1. **Allow Microphone Access**
   - Click microphone button
   - Browser will prompt for permission
   - Click "Allow"

2. **Try a Voice Command**
   - Click the blue microphone button
   - Speak: "Add task call dentist tomorrow at 2pm"
   - Button turns red while listening
   - Command is processed automatically

3. **Try a Text Command**
   - Type: "What are my tasks for today"
   - Click "Send"
   - See tasks listed below

4. **Explore Views**
   - **Task List**: See all tasks
   - **Calendar**: See tasks on a 7-day calendar
   - **Priority Matrix**: See tasks in Eisenhower Matrix (Urgent/Important)

## Example Commands

Copy-paste these to try quickly:

### Add Tasks
- "Add task finish report by Friday"
- "Remind me to call mom tomorrow at 3pm"
- "Schedule doctor appointment next Monday"

### List Tasks
- "Show tasks for today"
- "What are my urgent tasks"
- "What's on my schedule for this week"

### Complete Tasks
- "Complete task number 1"
- "Mark done finish report"
- "Finished that doctor appointment"

### Delete Tasks
- "Delete task call dentist"
- "Remove that report task"

## Troubleshooting

### Backend Won't Start
```bash
# Make sure Python 3.8+ is installed
python3 --version

# Try installing requirements again
pip install -r requirements.txt

# If port 8000 is in use, try different port:
python3 -m uvicorn app:app --reload --port 8001
```

### Frontend Won't Connect
```bash
# Check backend is running
curl http://localhost:8000/health

# If using different backend port, update .env
echo "REACT_APP_API_URL=http://localhost:8001/api" > .env.local

# Restart frontend (npm start)
```

### Voice Not Working
- Chrome works best
- Check microphone is connected
- Verify browser permission granted
- Try typing commands instead

### Database Errors
```bash
# Delete database to start fresh
rm backend/secretary.db

# Backend will create new database on first run
```

## Next Steps

After confirming it works locally:

1. **Deploy to Production** (see [DEPLOYMENT.md](./DEPLOYMENT.md))
   - Deploy backend to Railway.app
   - Deploy frontend to Vercel
   - Get public URLs accessible from anywhere

2. **Customize**
   - Change colors in `tailwind.config.js`
   - Add more NLP patterns in `nlp_service.py`
   - Add more commands and features

3. **Use on Mobile**
   - Deploy and get public URL
   - Open on phone in Chrome or Safari
   - Add to home screen (PWA)
   - Use like a native app

## Project Structure

```
secretary-app/
├── backend/              # Python FastAPI
│   ├── app.py           # Main API server
│   ├── database/        # Database models
│   ├── services/        # Business logic
│   └── utils/           # Helpers (NLP, dates)
└── frontend/            # React web app
    ├── public/          # HTML template
    ├── src/
    │   ├── App.js       # Main component
    │   ├── components/  # UI components
    │   ├── services/    # API client
    │   └── utils/       # Helpers
    └── package.json     # Dependencies
```

## Common Tasks

### Add a New Voice Command Pattern

Edit `backend/services/nlp_service.py`:

```python
def _detect_intent(self, text: str) -> str:
    # Add new pattern at top
    new_patterns = [r'\b(snooze|postpone|delay)\b']
    for pattern in new_patterns:
        if re.search(pattern, text):
            return 'snooze_task'
    # ... rest of code
```

### Change Task Colors

Edit `frontend/tailwind.config.js`:

```javascript
colors: {
    primary: '#3B82F6',      // Blue
    urgent: '#EF4444',        // Red
    important: '#F59E0B',     // Amber
    // Add more:
    completed: '#10B981',     // Green
}
```

### Add a New Field to Tasks

1. Update database model: `backend/database/models.py`
2. Update Pydantic schema: `backend/app.py` (TaskResponse)
3. Update task service: `backend/services/task_service.py`
4. Update UI components: `frontend/src/components/*.js`

## Tips & Tricks

1. **Test NLP parsing**:
   ```bash
   python3 backend/test_api.py
   ```

2. **Check database content**:
   ```bash
   sqlite3 backend/secretary.db "SELECT * FROM task;"
   ```

3. **Clear all tasks**:
   ```bash
   sqlite3 backend/secretary.db "DELETE FROM task;"
   ```

4. **View logs** (backend):
   - Terminal will show all API requests
   - Look for errors and timestamps

5. **View logs** (frontend):
   - Browser DevTools (F12 → Console)
   - See network requests under Network tab

## Getting Help

1. Check [README.md](./README.md) for detailed docs
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
3. Check browser console (F12) for errors
4. Look at backend logs in terminal
5. Try test commands first: `python3 backend/test_api.py`

---

**Happy task managing!** 🚀

Next: Read [DEPLOYMENT.md](./DEPLOYMENT.md) to go live
