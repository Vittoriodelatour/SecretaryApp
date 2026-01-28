# Personal Secretary Web App

A voice-enabled personal secretary web application for task management, calendar scheduling, and smart prioritization. Accessible from any device via public URL.

## Features

- **Voice Commands**: Use Web Speech API for hands-free task management
- **Natural Language Processing**: Pattern-matching command parsing (no AI required)
- **Task Management**: Create, complete, and organize tasks
- **Calendar View**: Visual 7-day calendar with time blocks
- **Priority Matrix**: Eisenhower Matrix for task prioritization
- **Real-time Responses**: Audio feedback for confirmations and results
- **Responsive Design**: Mobile-first UI with touch-friendly controls
- **PWA Ready**: Install as app on phone or desktop

## Tech Stack

**Frontend:**
- React 18 + Create React App
- TailwindCSS 3.4+ for styling
- Lucide React for icons
- Web Speech API (native browser voice)
- Axios for HTTP requests
- Deployed on Vercel (free tier)

**Backend:**
- FastAPI 0.109+ (Python)
- SQLite + SQLAlchemy ORM
- Pattern-matching NLP (regex + dateparser)
- CORS enabled for cross-origin requests
- Deployed on Railway.app (free tier)

## Project Structure

```
secretary-app/
├── backend/
│   ├── app.py                    # FastAPI application
│   ├── requirements.txt          # Python dependencies
│   ├── database/
│   │   ├── models.py             # SQLAlchemy models
│   │   └── database.py           # DB initialization
│   ├── services/
│   │   ├── nlp_service.py        # Command parsing
│   │   └── task_service.py       # Task CRUD operations
│   └── utils/
│       └── date_parser.py        # Natural date parsing
└── frontend/
    ├── package.json              # Node dependencies
    ├── tailwind.config.js        # TailwindCSS config
    └── src/
        ├── App.js                # Main component
        ├── components/
        │   ├── VoiceInput.js     # Microphone interface
        │   ├── CommandInput.js   # Text + voice combo
        │   ├── TaskList.js       # Task display
        │   ├── CalendarView.js   # Calendar grid
        │   └── PriorityMatrix.js # Eisenhower Matrix
        ├── services/
        │   ├── api.js            # Backend API client
        │   └── speechService.js  # Web Speech API wrapper
        └── utils/
            └── dateUtils.js      # Date formatting
```

## Getting Started

### Prerequisites

- Node.js 16+ (for frontend)
- Python 3.8+ (for backend)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd secretary-app/backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the server:
   ```bash
   uvicorn app:app --reload
   ```

   Backend will be available at: `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd secretary-app/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   Frontend will open at: `http://localhost:3000`

4. Configure the API URL in development:
   - The frontend automatically connects to `http://localhost:8000` by default
   - For production, set `REACT_APP_API_URL` environment variable

## Command Examples

Try these voice or text commands:

- **Add tasks**: "Add task call dentist tomorrow at 2pm"
- **List tasks**: "What are my tasks for today"
- **Complete tasks**: "Complete task number 1" or "Mark done finish report"
- **View tasks**: "Show urgent tasks" or "What's on my schedule"
- **Delete tasks**: "Delete task call dentist"

## Database Schema

### Task Table
- `id`: Primary key
- `title`: Task title (required)
- `description`: Task description (optional)
- `importance`: 1-5 scale (default: 3)
- `urgency`: 1-5 scale (default: 3)
- `due_date`: ISO date format (YYYY-MM-DD)
- `due_time`: Time in HH:MM format
- `duration_minutes`: Estimated duration (optional)
- `status`: 'pending', 'in_progress', or 'completed'
- `task_type`: 'calendar' or 'checklist'
- `completed_at`: Completion timestamp
- `created_at`, `updated_at`: Timestamps

### Tag Table
- `id`: Primary key
- `name`: Tag name (unique)
- `color`: Hex color code

## API Endpoints

### Command Processing
```
POST /api/command
  Request: { "text": "add task call dentist tomorrow" }
  Response: { "success": true, "action": "task_created", "message": "...", "task": {...} }
```

### Task Management
```
GET    /api/tasks              # List tasks with filters
POST   /api/tasks              # Create a task manually
GET    /api/tasks/{id}         # Get specific task
PUT    /api/tasks/{id}         # Update task
PATCH  /api/tasks/{id}/complete # Mark task complete
DELETE /api/tasks/{id}         # Delete task
```

### Calendar & Priority
```
GET    /api/calendar          # Get calendar view (date range)
GET    /api/priority-matrix   # Get Eisenhower Matrix view
```

## Deployment

### Deploy Backend to Railway

1. Create a [Railway.app](https://railway.app) account
2. Connect your GitHub repository
3. Railway auto-detects Python/FastAPI
4. Set environment variables:
   ```
   DATABASE_URL=sqlite:///./secretary.db
   ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
   ```
5. Deploy - Get your backend URL (e.g., `https://secretary-backend.railway.app`)

### Deploy Frontend to Vercel

1. Create a [Vercel](https://vercel.com) account
2. Import your GitHub repository
3. Configure build settings:
   - Framework: Create React App
   - Root directory: `frontend`
4. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app/api
   ```
5. Deploy - Get your frontend URL (e.g., `https://secretary.vercel.app`)

### Update CORS in Backend

After deployment, update `app.py` to allow your frontend domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://secretary.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Voice Interface

### Desktop (Chrome, Firefox, Safari)
1. Click the microphone button
2. Allow microphone access when prompted
3. Speak your command
4. Results appear in real-time with audio feedback

### Mobile (iOS, Android)
1. Open in Chrome or Safari
2. Grant microphone permission
3. Large mic button for easy tapping
4. Visual feedback with animated pulse
5. Larger text for readability

## Testing

### Manual Test Checklist

**Voice Recognition:**
- [ ] Chrome desktop: microphone permission works
- [ ] Safari iOS: microphone permission works
- [ ] Chrome Android: microphone permission works
- [ ] Add task with date parsing
- [ ] List tasks filtered by date
- [ ] Error handling for unclear speech

**Command Parsing:**
- [ ] "add task X on Y date" extracts date correctly
- [ ] "urgent task" sets high importance
- [ ] "show tasks by urgency" sorts correctly
- [ ] Ambiguous commands provide helpful error

**UI/UX:**
- [ ] Mobile responsive (test on iPhone, Android)
- [ ] Calendar displays tasks at correct times
- [ ] Priority matrix drag-and-drop (future feature)
- [ ] Task completion toggles work
- [ ] Loading states appear appropriately

## Natural Language Processing Details

### Intent Detection

The NLP service recognizes these intents:

1. **add_task**: "add task", "schedule", "remind me to"
2. **list_tasks**: "show tasks", "what are my tasks"
3. **complete_task**: "complete", "mark done", "finished"
4. **delete_task**: "delete task", "cancel", "remove"

### Date Parsing

Understands relative dates:
- "today", "tomorrow"
- "next Monday", "in 3 days"
- "Friday at 2pm", "next week"
- "January 31st", "2/15"

### Importance Extraction

Keyword-based importance levels:
- **High (5)**: "urgent", "critical", "important", "asap"
- **Medium (3)**: Default when no keywords present
- **Low (1)**: "low priority", "whenever", "someday"

## Browser Compatibility

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Chrome, Safari (iOS 14.5+)
- **Voice API Support**:
  - Chrome: Full support
  - Firefox: Full support
  - Safari: Limited (iOS 14.5+ has some limitations)

## Performance Targets

- Initial load: < 2 seconds
- Command processing: < 500ms
- Voice recognition latency: < 1 second
- Calendar render: < 300ms

## Troubleshooting

### Backend won't start
- Check Python version (3.8+)
- Verify virtual environment is activated
- Run `pip install -r requirements.txt` again

### Frontend won't connect to backend
- Ensure backend is running on localhost:8000
- Check browser console for CORS errors
- Verify `REACT_APP_API_URL` environment variable

### Voice recognition not working
- Check browser microphone permission
- Ensure microphone is connected and working
- Try different browser (Chrome has best support)
- Check internet connection (some implementations use cloud services)

### Tasks not persisting
- Verify `secretary.db` is created in backend directory
- Check file permissions
- Ensure SQLite is installed

## Future Enhancements

- Recurring tasks ("every Monday at 9am")
- Email task creation
- Google Calendar sync
- Time blocking suggestions
- Productivity analytics
- Dark mode
- Multiple task lists/projects
- Collaboration features
- Native mobile apps

## License

MIT License - Feel free to use for personal projects

## Support

For issues or feedback:
- Check existing issues on GitHub
- Review browser console for error messages
- Test with the example commands first

---

**Version**: 1.0.0
**Last Updated**: January 2026
