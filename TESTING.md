# Testing Checklist

Complete testing guide for the Personal Secretary app.

## Unit Tests

### Backend Tests

Run backend tests:
```bash
cd backend
python3 test_api.py
```

Expected output:
```
==================================================
Personal Secretary Backend Tests
==================================================
Testing database...
✓ Database initialized

Testing NLP service...
✓ Add task parsing works
✓ List tasks parsing works
✓ Complete task parsing works

Testing task service...
✓ Created task: Test task (ID: 1)
✓ Retrieved task successfully
✓ Updated task successfully
✓ Completed task successfully
✓ Deleted task successfully

==================================================
✓ All tests passed!
==================================================
```

## Manual Testing

### 1. Voice Recognition Tests

**Chrome Desktop:**
- [ ] Click microphone button
- [ ] Button shows "Listening..." state
- [ ] Speak clearly: "Add task test voice"
- [ ] See transcript in real-time
- [ ] Task appears in list
- [ ] Audio response plays: "Task added..."
- [ ] Button returns to normal state

**Safari iOS:**
- [ ] Open in Safari on iPhone
- [ ] Microphone button is touch-sized (44x44px)
- [ ] Click triggers microphone permission prompt
- [ ] Grant permission
- [ ] Click button again to listen
- [ ] Speak command
- [ ] Task appears on screen
- [ ] Can see updated list on refresh

**Chrome Android:**
- [ ] Open in Chrome on Android phone
- [ ] Microphone button is accessible
- [ ] Grant microphone permission
- [ ] Speak command
- [ ] Task is created
- [ ] List updates in real-time

**Firefox & Other Browsers:**
- [ ] Page loads successfully
- [ ] Microphone button shows compatibility message
- [ ] Text input still works
- [ ] Can use app without voice

### 2. Command Parsing Tests

**Add Task Commands:**
- [ ] "Add task finish project"
- [ ] "Add task call mom tomorrow"
- [ ] "Add task dinner at 7pm tonight"
- [ ] "Add urgent task fix bug by Friday"
- [ ] "Add low priority task someday project"
- [ ] Verify importance/urgency extracted correctly

**List Task Commands:**
- [ ] "Show tasks"
- [ ] "What are my tasks for today"
- [ ] "Show urgent tasks"
- [ ] "Important tasks"
- [ ] "What's on my schedule"
- [ ] Verify filters applied correctly

**Complete Task Commands:**
- [ ] "Complete task 1"
- [ ] "Mark done finished report"
- [ ] "Complete the dentist task"
- [ ] Verify task removed from active list

**Delete Task Commands:**
- [ ] "Delete task 1"
- [ ] "Remove that task"
- [ ] "Cancel dentist appointment"
- [ ] Verify task deleted with confirmation

**Edge Cases:**
- [ ] Unclear/nonsense command: "The quick brown fox"
- [ ] Partial command: "Add task"
- [ ] Empty input: Press send with no text
- [ ] Very long task title: 100+ character task
- [ ] Special characters in title: Task with @#$%
- [ ] Multiple tasks with same name

### 3. UI/UX Tests

**Task List View:**
- [ ] Tasks display with title and due date
- [ ] Importance/urgency badges show correct colors
- [ ] Check button works (completes task)
- [ ] Delete button removes task
- [ ] Sort by urgency works
- [ ] Sort by importance works
- [ ] Sort by date works
- [ ] Loading spinner shows during operations
- [ ] Empty state message shows when no tasks

**Calendar View:**
- [ ] Shows 7-day calendar
- [ ] Today highlighted in blue
- [ ] Tasks appear in correct day
- [ ] Task time shows if scheduled
- [ ] Scroll shows previous/next week (if implemented)
- [ ] Color coding by urgency/importance works
- [ ] Empty state for no tasks

**Priority Matrix:**
- [ ] 2x2 grid displays correctly
- [ ] Tasks in correct quadrant:
  - [ ] Urgent & Important (top-left/red)
  - [ ] Important (top-right/yellow)
  - [ ] Urgent (bottom-left/orange)
  - [ ] Low Priority (bottom-right/green)
- [ ] Task count shown per quadrant
- [ ] Empty state message if no tasks

**Responsive Design:**
- [ ] Desktop (1920x1080): All content visible
- [ ] Tablet (768x1024): Touch targets adequate
- [ ] Mobile (375x667):
  - [ ] Bottom navigation works
  - [ ] Input fields reach 16px font
  - [ ] Touch targets 44x44px minimum
  - [ ] No horizontal scrolling
  - [ ] Layout stacks vertically

### 4. Cross-Browser Testing

Test on all major browsers:

**Chrome (Latest):**
- [ ] All features work
- [ ] Voice recognition works
- [ ] No console errors
- [ ] Performance: page loads < 2s

**Safari (Latest):**
- [ ] Page renders correctly
- [ ] Voice recognition works
- [ ] TailwindCSS styles apply
- [ ] iOS compatibility

**Firefox (Latest):**
- [ ] All features functional
- [ ] Voice recognition works
- [ ] Console shows no errors

**Edge (Latest):**
- [ ] Page loads
- [ ] All features work
- [ ] Voice recognition works

### 5. Mobile Testing

**iPhone (iOS 14.5+):**
- [ ] Can add "to home screen"
- [ ] App icon visible
- [ ] Launches as fullscreen
- [ ] Microphone works in app
- [ ] All touch targets accessible
- [ ] No horizontal scrolling

**Android (Chrome):**
- [ ] Can install as app
- [ ] Home screen shortcut works
- [ ] Fullscreen mode available
- [ ] Voice works
- [ ] Performance acceptable

### 6. Data Persistence Tests

**Local Testing:**
- [ ] Create task with browser dev tools open
- [ ] Refresh page
- [ ] [ ] Task still exists
- [ ] [ ] No data loss
- [ ] Complete task
- [ ] Refresh page
- [ ] [ ] Task marked complete
- [ ] Delete task
- [ ] Refresh page
- [ ] [ ] Task removed

**Production Testing:**
- [ ] Create task on phone
- [ ] Close browser
- [ ] Wait 5 minutes
- [ ] Reopen app
- [ ] [ ] Task still there
- [ ] Open on different device
- [ ] [ ] Same tasks visible

### 7. Error Handling Tests

**Backend Offline:**
- [ ] Disconnect internet
- [ ] Try to send command
- [ ] [ ] Error message shows
- [ ] Reconnect internet
- [ ] [ ] Can send commands again

**Invalid Commands:**
- [ ] Type nonsense: "xyzabc"
- [ ] [ ] Helpful error message
- [ ] Send empty command
- [ ] [ ] Error message shown
- [ ] Very long command (500+ chars)
- [ ] [ ] Handled gracefully

**Network Errors:**
- [ ] Throttle network to 3G
- [ ] Send command
- [ ] [ ] Shows loading state
- [ ] [ ] Eventually completes or errors
- [ ] Disconnect during operation
- [ ] [ ] Error message appears

### 8. Voice-to-Speech Tests

**Response Audio:**
- [ ] Task created: Hear confirmation
- [ ] Task completed: Hear acknowledgment
- [ ] Error: Hear error message
- [ ] Multiple responses don't overlap
- [ ] Volume is reasonable
- [ ] Speech is clear and understandable

## Performance Testing

### Load Time
- [ ] First load: < 2 seconds
- [ ] Subsequent loads: < 1 second
- [ ] Command response: < 500ms
- [ ] Voice processing: < 1 second

### Resource Usage
- [ ] Bundle size: Check `npm run build` output
  - [ ] React bundle: < 100KB
  - [ ] CSS: < 50KB
  - [ ] Total: < 300KB
- [ ] Memory usage: Monitor in DevTools

### API Response Times
- [ ] GET /api/tasks: < 100ms
- [ ] POST /api/command: < 500ms
- [ ] PATCH /api/tasks/{id}/complete: < 100ms
- [ ] GET /api/priority-matrix: < 200ms

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all elements
- [ ] Focus visible on all buttons
- [ ] Enter activates buttons
- [ ] Shift+Tab goes backwards

### Screen Reader
- [ ] Microphone button labeled
- [ ] Task items readable
- [ ] Error messages announced
- [ ] Instructions clear

### Color Contrast
- [ ] Text on buttons: WCAG AA (4.5:1)
- [ ] Task colors: Colorblind accessible
- [ ] Error messages: Not color-only

### Font Size
- [ ] Minimum 16px on mobile
- [ ] Can zoom to 200%
- [ ] Text not cut off

## Deployment Verification

### Pre-Deployment
- [ ] All tests pass
- [ ] No console errors
- [ ] No security warnings
- [ ] Build completes successfully

### Post-Deployment
- [ ] Frontend loads from production URL
- [ ] Backend API responds
- [ ] CORS errors don't appear
- [ ] Create task works end-to-end
- [ ] Voice recognition works
- [ ] Data persists across sessions

## Stress Testing (Advanced)

### Large Data Set
- [ ] Create 100 tasks
- [ ] UI still responsive
- [ ] List loads < 1s
- [ ] Filtering works
- [ ] No memory leaks

### Rapid Interactions
- [ ] Spam voice commands
- [ ] [ ] No crashes
- [ ] [ ] Proper queue/cancel behavior
- [ ] Click buttons rapidly
- [ ] [ ] No duplicate actions
- [ ] [ ] Loading states prevent duplicates

## Test Reporting

### Create Test Report

For each test section, mark:
- ✅ = All tests passed
- ⚠️ = Some tests failed
- ❌ = Critical failure

Example:
```
## Test Results - January 28, 2026

### Voice Recognition
✅ Chrome Desktop
✅ Safari iOS
⚠️ Firefox (audio playback not working)
❌ Edge (voice recognition not responding)

### Command Parsing
✅ All add_task patterns
✅ All list_tasks patterns
⚠️ Delete task pattern inconsistent with hyphens

### UI/UX
✅ Desktop responsive design
✅ Mobile layout
⚠️ Calendar view slow with 50+ tasks

### Overall Status: READY FOR PRODUCTION
```

## Continuous Testing

### Before Each Deployment
1. Run backend tests: `python3 test_api.py`
2. Run quick manual check (5 commands)
3. Test on mobile device
4. Check console for errors
5. Verify production API works

### Weekly Checks
1. Test on multiple browsers
2. Test on new device/OS version
3. Check analytics for errors
4. Monitor logs for issues
5. Review user feedback

## Test Environments

### Local Development
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- Database: `backend/secretary.db`

### Staging (Production-like, Private)
- Backend: `https://secretary-staging.railway.app`
- Frontend: `https://secretary-staging.vercel.app`
- Create before production release

### Production (Public)
- Backend: `https://secretary-api.railway.app`
- Frontend: `https://secretary.vercel.app`
- Monitor with analytics

---

**Test Coverage Goal**: 100% of user features
**Quality Gate**: All manual tests pass before production
**Regression Testing**: Before each release

