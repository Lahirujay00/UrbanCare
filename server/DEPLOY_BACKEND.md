# Deploying Backend to Vercel

## Important: Deploy Server Folder Separately

The backend (`urban-care-back.vercel.app`) should be deployed as a **separate project** from the `server/` folder only.

## Steps to Deploy Backend:

### Option 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Create New Project** (or go to existing `urban-care-back` project)
3. **Important Settings:**
   - **Root Directory**: `server` ⚠️ (This is critical!)
   - **Framework Preset**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`

4. **Environment Variables** (Settings → Environment Variables):
   ```
   NODE_ENV=production
   VERCEL=1
   MONGODB_URI=mongodb+srv://admin:1234@cluster0.di9quiu.mongodb.net/urbancare?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your_secure_jwt_secret_here
   JWT_EXPIRE=7d
   CLIENT_URL=https://urban-care-front.vercel.app
   ```

5. **Deploy**

### Option 2: Via CLI

```powershell
# Navigate to project root
cd D:\projects\UrbanCare

# Deploy server folder only
vercel --prod --cwd server

# Or set as default directory in vercel.json (already done)
```

## Project Structure for Vercel:

When Vercel deploys the `server/` folder:
```
server/                    ← Root directory for deployment
├── api/
│   └── index.js          ← Serverless function entry point
├── server.js             ← Express app
├── routes/
├── models/
├── package.json
└── vercel.json           ← Server-specific config
```

## Verify Deployment:

After deployment, test:
```powershell
# Test health endpoint
curl https://urban-care-back.vercel.app/health

# Or in PowerShell
Invoke-RestMethod https://urban-care-back.vercel.app/health
```

Expected response:
```json
{
  "success": true,
  "message": "UrbanCare API is running",
  "timestamp": "2025-11-24T...",
  "environment": "production"
}
```

## Common Issues:

### 1. "Cannot find module" error
**Cause**: Root directory not set to `server/`
**Fix**: Set Root Directory to `server` in project settings

### 2. Routes don't work
**Cause**: vercel.json routing issue
**Fix**: Use the simplified vercel.json with rewrites (already updated)

### 3. MongoDB connection timeout
**Cause**: Environment variables not set
**Fix**: Add all environment variables in Vercel dashboard

## Two Separate Deployments:

You should have TWO separate Vercel projects:

1. **Frontend** (`urban-care-front.vercel.app`)
   - Deploy from: `client/` folder
   - Env vars: `REACT_APP_API_URL=https://urban-care-back.vercel.app/api`

2. **Backend** (`urban-care-back.vercel.app`)
   - Deploy from: `server/` folder ⚠️
   - Env vars: MongoDB, JWT, CLIENT_URL, etc.

## Current Issue:

If you're deploying from the root directory with both frontend and backend, Vercel is confused. You need to either:
1. Deploy `server/` folder as a separate project, OR
2. Configure root vercel.json to handle monorepo correctly

**Recommended**: Deploy server folder separately to `urban-care-back` project.
