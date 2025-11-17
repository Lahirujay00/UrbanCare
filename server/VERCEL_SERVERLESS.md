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

### If still getting 500 FUNCTION_INVOCATION_FAILED:

1. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Your Project → Functions tab
   - Click on the failing function to see detailed logs
   - Look for error messages or stack traces

2. **Verify Environment Variables:**
   ```bash
   # Required variables on Vercel:
   NODE_ENV=production
   VERCEL=1
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
   JWT_SECRET=your_secret_key
   CLIENT_URL=https://urban-care-front.vercel.app
   ```

3. **Test MongoDB Connection:**
   - Verify MONGODB_URI is correct and properly formatted
   - Ensure MongoDB Atlas allows connections from 0.0.0.0/0
   - Test connection string locally first
   - Check MongoDB user has proper permissions

4. **Check Package Dependencies:**
   - Ensure all required packages are in `dependencies` (not `devDependencies`)
   - Verify `package.json` has all needed packages

5. **Test with Simple Function:**
   - Deploy `api/test.js` first to verify basic serverless function works
   - Once that works, switch back to `api/index.js`

### MongoDB Connection Issues:
- Timeout too short: Increase `serverSelectionTimeoutMS` to 5000-10000ms
- Network access: Whitelist 0.0.0.0/0 in MongoDB Atlas
- User permissions: Ensure DB user has readWrite permissions
- Connection string: Must include database name and retryWrites parameter

### Common Fixes:
```javascript
// In api/index.js - ensure proper async handler
module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
```

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
