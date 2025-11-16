# Vercel Serverless Functions - Important Notes

## Changes Made to Fix FUNCTION_INVOCATION_FAILED Error

### 1. Created `server/api/index.js`
This is the entry point for Vercel serverless functions. It imports and exports the Express app.

### 2. Updated MongoDB Connection
Changed from immediate connection to a **cached connection function** that:
- Reuses existing connections (serverless-friendly)
- Has proper timeout settings (10s server selection)
- Only runs setup code in development

### 3. Conditional Server Start
The `server.listen()` now only runs in:
- Development mode (`NODE_ENV !== 'production'`)
- Non-Vercel environments (`!process.env.VERCEL`)

This prevents the serverless function from trying to start a persistent HTTP server.

### 4. Updated vercel.json Files
- Root `vercel.json`: Routes all requests to `server/api/index.js`
- Server `vercel.json`: Uses `api/index.js` as entry point
- Added `VERCEL=1` environment variable

## How Vercel Serverless Works

1. Each request spawns a new function instance
2. The function executes and returns a response
3. MongoDB connections are cached between invocations
4. No persistent server process

## Environment Variables Required on Vercel

Make sure these are set in Vercel dashboard:

```
NODE_ENV=production
VERCEL=1
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CLIENT_URL=https://urban-care-front.vercel.app
```

## Testing Locally

```powershell
# Local development still works normally
cd server
npm run dev
```

## Deployment

```powershell
# From project root
vercel --prod
```

## Troubleshooting

### If still getting 500 errors:
1. Check Vercel function logs
2. Verify MONGODB_URI is correct
3. Ensure MongoDB Atlas allows connections from 0.0.0.0/0
4. Check that all environment variables are set

### MongoDB Connection Issues:
- Increase `serverSelectionTimeoutMS` if needed
- Verify MongoDB Atlas network access settings
- Check MongoDB user permissions

## File Structure

```
server/
├── api/
│   └── index.js        ← Vercel entry point (NEW)
├── server.js           ← Main Express app (exports app)
├── vercel.json         ← Server-specific config (updated)
├── routes/
├── models/
└── ...
```
