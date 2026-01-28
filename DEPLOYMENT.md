# Deployment Guide

Complete guide to deploying the Personal Secretary app to production.

## Prerequisites

- GitHub account (for code storage)
- Railway.app account (free tier)
- Vercel account (free tier)
- Backend and frontend code pushed to GitHub

## Step-by-Step Deployment

### Phase 1: Deploy Backend to Railway

#### 1.1 Create Railway Account

1. Visit [https://railway.app](https://railway.app)
2. Sign up with GitHub (easiest option)
3. Authorize Railway to access your repos

#### 1.2 Create Railway Project

1. Click "Create New" → "Project"
2. Select "Deploy from GitHub repo"
3. Choose your `secretary-app` repository
4. Select the repository and authorize
5. Railway auto-detects Python/FastAPI

#### 1.3 Configure Environment Variables

1. In Railway dashboard, go to your project
2. Click "Variables" tab
3. Add environment variables:

```
DATABASE_URL=sqlite:///./secretary.db
PYTHON_VERSION=3.9
```

#### 1.4 Deploy Backend

1. Select the root directory as `backend` in deployment settings
2. Click "Deploy"
3. Wait for deployment to complete
4. Get your backend URL from the deployment info (e.g., `https://secretary-backend-production.railway.app`)

#### 1.5 Test Backend Deployment

```bash
curl https://secretary-backend-production.railway.app/health
```

Expected response:
```json
{"status": "ok", "timestamp": "2026-01-28T..."}
```

### Phase 2: Deploy Frontend to Vercel

#### 2.1 Create Vercel Account

1. Visit [https://vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel to access your repos

#### 2.2 Import Project

1. Click "Add New..." → "Project"
2. Select "Import Git Repository"
3. Enter your `secretary-app` GitHub repo URL
4. Click "Continue"

#### 2.3 Configure Build Settings

1. **Framework Preset**: Select "Create React App"
2. **Root Directory**: Set to `frontend`
3. **Environment Variables**:
   - Name: `REACT_APP_API_URL`
   - Value: `https://secretary-backend-production.railway.app/api`

#### 2.4 Deploy Frontend

1. Click "Deploy"
2. Wait for deployment to complete
3. Get your frontend URL (e.g., `https://secretary.vercel.app`)

#### 2.5 Test Frontend

1. Open `https://secretary.vercel.app` in your browser
2. Verify it loads and connects to backend
3. Test a voice command

### Phase 3: Configure CORS

After both are deployed, update the backend to allow your frontend domain:

#### Option A: Update via Railway Dashboard

1. Go to Railway project → Variables
2. Add or update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://secretary.vercel.app
   ```
3. Redeploy the backend

#### Option B: Update Code

Edit `/backend/app.py` and update CORS configuration:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://secretary.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then push to GitHub to trigger redeploy.

### Phase 4: Verify Production Deployment

1. **Open frontend**: `https://secretary.vercel.app`
2. **Test voice command**:
   - Click microphone button
   - Say: "Add task test task tomorrow"
   - Verify task appears in list
3. **Test text command**:
   - Type: "show tasks for tomorrow"
   - Verify it lists the task
4. **Check calendar**: Switch to calendar view
5. **Check priority matrix**: Switch to matrix view

## Environment Variables Reference

### Backend (Railway)

```bash
DATABASE_URL=sqlite:///./secretary.db
PYTHON_VERSION=3.9
ALLOWED_ORIGINS=https://secretary.vercel.app
```

### Frontend (Vercel)

```bash
REACT_APP_API_URL=https://secretary-backend-production.railway.app/api
```

## Custom Domain Setup (Optional)

### Add Custom Domain to Vercel

1. In Vercel project settings
2. Go to "Domains"
3. Add your custom domain (e.g., `secretary.yourdomain.com`)
4. Follow DNS configuration instructions
5. Update CORS in backend to allow new domain

### Update Backend CORS

Change in Railway:
```
ALLOWED_ORIGINS=https://secretary.yourdomain.com
```

## Monitoring & Logs

### View Backend Logs (Railway)

1. Go to Railway project dashboard
2. Click "Logs" tab
3. See real-time server logs
4. Useful for debugging issues

### View Frontend Logs (Vercel)

1. Go to Vercel project dashboard
2. Click "Analytics" tab
3. Check "Function" logs for API calls
4. Check "Build" logs for deployment issues

## Scaling (Future)

### If Database Gets Large

1. Switch from SQLite to PostgreSQL
2. In Railway: Add PostgreSQL service
3. Update `DATABASE_URL` to PostgreSQL connection string
4. Deploy

### If Traffic Increases

1. Railway and Vercel auto-scale
2. Monitor usage in dashboards
3. Upgrade plan if needed (both have paid tiers)

## Troubleshooting Deployment

### Frontend Won't Connect to Backend

**Symptoms**:
- Network errors in browser console
- CORS errors

**Fix**:
1. Check `REACT_APP_API_URL` environment variable in Vercel
2. Verify backend URL is correct and accessible
3. Check CORS configuration in Railway environment variables
4. Redeploy both frontend and backend

### Tasks Not Saving

**Symptoms**:
- Tasks created but disappear on refresh
- Database errors in logs

**Fix**:
1. Check Railway logs for database errors
2. Verify `DATABASE_URL` is set in Railway
3. Check file permissions on Railway
4. Restart the Railway deployment

### Voice Recognition Not Working

**Symptoms**:
- Microphone button doesn't respond
- "Browser not supported" message

**Fix**:
1. Test in Chrome (best support)
2. Verify microphone permissions granted
3. Check browser console for errors
4. Test on different device/browser

## Backup & Data Recovery

### Backup Database

Since we use SQLite file:

1. Via Railway file explorer
2. Download `secretary.db` regularly
3. Store in safe location

### Switch to PostgreSQL (Recommended for Production)

For better reliability and backups:

1. Create PostgreSQL database
2. Update `DATABASE_URL` in Railway
3. Migrate data using `sqlalchemy`
4. Deploy

## SSL/HTTPS

Both Railway and Vercel provide free SSL certificates automatically. Your URLs are secure by default.

## Analytics & Monitoring

### Track Usage

1. **Vercel Analytics**: Built-in, shows page performance
2. **Railway Metrics**: Shows CPU, memory, database usage
3. **Custom Analytics**: Add to frontend if needed

### Set Up Alerts (Optional)

1. Railway: Project Settings → Alerts
2. Vercel: Project Settings → Notifications
3. Get notified of deployment failures

## Cost Estimate

**Free Tier**:
- Vercel: Free for static sites and serverless functions
- Railway: $5/month included free tier, overage charges
- Total: $0-5/month for personal use

**With Custom Domain**:
- Domain registration: $5-15/year
- No additional hosting costs with free tiers

## Next Steps After Deployment

1. **Test thoroughly** in production
2. **Share URL** with team/users
3. **Add to home screen** on mobile (PWA)
4. **Monitor logs** for issues
5. **Plan improvements** based on usage

## Support

If deployment issues occur:
1. Check deployment logs (Railway & Vercel dashboards)
2. Review error messages in browser console
3. Test backend directly with curl
4. Check environment variables are set correctly
5. Review GitHub repo for latest code

---

**Last Updated**: January 2026
**Status**: Production Ready
