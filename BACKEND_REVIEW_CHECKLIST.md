# Backend Code Review Checklist

## 🔴 CRITICAL ISSUES (Fix Immediately)

### app.py

- [ ] **Line 557**: `status_enum` logic is broken - only handles `pending`, missing logic for `completed` and `all` statuses
  - Issue: Only `pending` returns a status, others get `None`, which breaks filtering
  - Fix: Implement proper status enum conversion for all values

- [ ] **Line 608**: Using deprecated `.dict()` method on Pydantic models (v2 compatible)
  - Issue: Should use `.model_dump()` for Pydantic v2
  - Current: `task_data.dict(exclude_unset=True)`
  - Fix: `task_data.model_dump(exclude_unset=True)`

- [ ] **Line 654**: HTTPException with status code order is wrong
  - Issue: `raise HTTPException(400, "...")` - positional args are swapped
  - Current: `HTTPException(status_code, detail)`
  - Should be: `HTTPException(status_code=400, detail="...")`

- [ ] **Line 659**: Inconsistent exception handling in date validation
  - Issue: Re-raising exception with string check is fragile
  - Fix: Create custom validation function

### database/database.py

- [ ] **Line 11**: SQLite `check_same_thread=False` in production is unsafe
  - Issue: This disables thread safety checks, can cause race conditions
  - Current environment: No environment detection for production
  - Fix: Only use this flag in development, add proper connection pooling for production

### utils/date_parser.py

- [ ] **Line 21**: `dateparser.parse()` without timezone handling could cause issues
  - Issue: Users in different timezones may get unexpected dates
  - Fix: Add explicit timezone handling or use user's local timezone

---

## 🟠 HIGH PRIORITY ISSUES (Fix Soon)

### app.py

- [ ] **Missing input validation**: Command text length validated (1-1000), but NLP parsing doesn't have length limits
  - Issue: Regex patterns could hang on very long strings
  - Fix: Add reasonable limits to NLP processing

- [ ] **Line 296**: Unreachable code - `detail` variable never used
  - Current: `detail = None if IS_PRODUCTION else None` (always None)
  - Fix: Remove or implement proper error detail handling

- [ ] **Security**: Content-Security-Policy is too strict (`default-src 'self'`)
  - Issue: If frontend CDN changes, API will break due to CSP
  - Fix: Make CSP configurable via environment variable

- [ ] **Rate limiting**: Memory-based rate limiter won't work in production with multiple workers
  - Issue: `storage_uri="memory://"` only tracks rates per process, not globally
  - Current: Good for single-instance, bad for scaled deployment
  - Fix: Use Redis-based rate limiter for production

- [ ] **Line 458**: `TaskResponse.from_orm()` deprecated in Pydantic v2
  - Should use: `TaskResponse.model_validate(task)` instead

### services/task_service.py

- [ ] **Line 68**: Using `datetime.now()` instead of `datetime.utcnow()`
  - Issue: Date filtering will break if server timezone differs from user's
  - Fix: Use UTC consistently everywhere or add timezone support

- [ ] **Line 79**: Month filter only adds 30 days (should be dynamic)
  - Issue: February will include too many days, May will miss days
  - Fix: Use calendar library to get actual month end

- [ ] **Line 92**: Sorting by `due_time` with NULL values in SQLite behaves unpredictably
  - Issue: NULLs sort first in SQLite but last in other databases
  - Fix: Use `isnull()` to explicitly handle NULL times

- [ ] **Lines 171-180**: Priority matrix uses hardcoded value `3` as threshold
  - Issue: This is 3 on a 1-5 scale, but not documented why 3 is the cutoff
  - Fix: Add comments or constants explaining the logic

### services/nlp_service.py

- [ ] **Line 91**: Regex pattern for time removal too broad
  - Current: `r'\b(today|tomorrow|next\s+\w+|...)`
  - Issue: Removes useful words like "next meeting" → "meeting"
  - Fix: More targeted pattern that preserves context

- [ ] **Line 232**: Sanitization only removes `%` and `_` wildcards
  - Issue: Still vulnerable to SQL injection via special characters
  - Current approach is incomplete (relies on Pydantic validation)
  - Fix: Use proper parameterized queries (already done, but add comment)

- [ ] **No null/empty validation**: What if `title` becomes empty after cleaning?
  - Current: Line 88 strips but doesn't validate if empty
  - Fix: Return error if title becomes empty after processing

### models.py

- [ ] **Line 34**: `due_date` stored as String instead of Date type
  - Issue: No database-level date validation, can store invalid dates
  - Fix: Use `Date` column type with validation, or document why string is needed

- [ ] **Line 40**: Using mutable default `datetime.utcnow` instead of function
  - Current: `default=datetime.utcnow` (missing parentheses = shares same time)
  - Fix: `default=lambda: datetime.utcnow()` or use `func.now()`

---

## 🟡 MEDIUM PRIORITY ISSUES (Should Fix)

### app.py

- [ ] **Line 128-130**: CORS allowed origins from env, but no validation
  - Issue: If env var is malformed, CORS setup silently fails
  - Fix: Validate and log CORS configuration at startup

- [ ] **Line 392**: Health check returns UTC time but no timezone indicator
  - Issue: Clients won't know if time is UTC or local
  - Fix: Add timezone info or use ISO format with Z suffix

- [ ] **Missing pagination**: `/api/tasks` endpoint has no pagination
  - Issue: With many tasks, response will be huge
  - Fix: Add limit/offset query parameters

- [ ] **No task creation timestamp validation**: Users can technically set creation dates in past
  - Issue: `created_at` auto-generated but could be manipulated via DB
  - Fix: Add explicit timestamp on API side

### services/task_service.py

- [ ] **Line 47**: Query doesn't have `.first()` error handling
  - Current: Returns None silently
  - Fix: Add logging for missing tasks

- [ ] **No transaction rollback on partial failure**: If `db.commit()` fails, data state is unclear
  - Issue: No explicit error handling for database failures
  - Fix: Wrap commits in try/except with rollback

### utils/date_parser.py

- [ ] **Dependency on external library**: `dateparser` library adds overhead
  - Issue: Slower than regex-based parsing for common cases
  - Fix: Use regex first, fallback to dateparser

- [ ] **No validation of parsed dates**: Can parse dates far in past/future
  - Issue: User could accidentally create task for year 2050
  - Fix: Add reasonable bounds (e.g., ±2 years from today)

---

## 🔵 LOW PRIORITY / IMPROVEMENTS

### General

- [ ] Add comprehensive docstrings to all endpoint functions
- [ ] Add input logging (without sensitive data) for debugging
- [ ] Add database query performance monitoring
- [ ] Create database migration scripts for production updates
- [ ] Add API versioning (e.g., `/api/v1/`) for future compatibility

### Testing

- [ ] No unit tests for NLP parsing logic
- [ ] No integration tests for database operations
- [ ] No load testing to verify rate limiter works
- [ ] Missing edge case tests (e.g., leap years, daylight saving time)

### Logging

- [ ] Line 383: Logging CORS origins exposes configuration in production
  - Fix: Only log in development mode

- [ ] No request/response logging for debugging
- [ ] No error tracking integration (Sentry, etc.)

### API Design

- [ ] No API documentation beyond OpenAPI (add README with examples)
- [ ] PUT vs PATCH inconsistency - only PATCH for complete, PUT for update
  - Fix: Standardize on one pattern

- [ ] Calendar endpoint requires start/end dates but no default
  - Fix: Add sensible defaults (e.g., today to 7 days ahead)

### Database

- [ ] No backup/recovery procedures documented
- [ ] SQLite not suitable for production with multiple concurrent users
  - Fix: Plan migration to PostgreSQL before scaling

- [ ] No data validation at database level (e.g., importance must be 1-5)
  - Current: Only validated in Pydantic
  - Fix: Add CHECK constraints in schema

---

## ✅ THINGS THAT ARE GOOD

- ✅ Excellent security headers implementation
- ✅ Request size limit prevents DoS attacks
- ✅ Good Pydantic model validation with field validators
- ✅ Rate limiting implemented and configured
- ✅ Exception handlers prevent information leakage in production
- ✅ Proper use of dependency injection for database sessions
- ✅ NLP service cleanly separated from API logic
- ✅ Task service provides good business logic abstraction

---

## 📋 ACTION ITEMS (Priority Order)

1. **CRITICAL**: Fix status enum handling in GET /api/tasks
2. **CRITICAL**: Fix database thread safety for production
3. **CRITICAL**: Update Pydantic v2 deprecated methods
4. **HIGH**: Fix month filter date calculation
5. **HIGH**: Fix time sorting with NULL values
6. **HIGH**: Replace memory-based rate limiter with Redis
7. **HIGH**: Add timezone consistency (UTC everywhere)
8. **MEDIUM**: Add pagination to task endpoints
9. **MEDIUM**: Add date parsing bounds validation
10. **LOW**: Add comprehensive API documentation

---

## 🚀 BEFORE PRODUCTION DEPLOYMENT

- [ ] Switch from SQLite to PostgreSQL
- [ ] Set up proper database backups
- [ ] Configure Redis for distributed rate limiting
- [ ] Set environment variables for all configuration
- [ ] Add database connection pooling
- [ ] Set up error tracking (Sentry)
- [ ] Create database migration scripts
- [ ] Add comprehensive logging system
- [ ] Test with load testing tool (locust)
- [ ] Audit all security headers are production-appropriate
