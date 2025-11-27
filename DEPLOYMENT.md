# Vercel Deployment Guide for UrbanCare

## Prerequisites
1. A Vercel account (sign up at https://vercel.com)
2. MongoDB Atlas account for production database
3. Vercel CLI installed: `npm i -g vercel`

## Deployment Steps

### 1. Prepare MongoDB Atlas
- Create a MongoDB Atlas cluster (free tier available)
- Whitelist all IP addresses: `0.0.0.0/0` (for Vercel)
- Get your connection string (replace `<password>` with your actual password)

### 2. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 3. Login to Vercel
```bash
vercel login
```

### 4. Update package.json scripts
Make sure your root `package.json` has:
```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build",
    "vercel-build": "cd client && npm install && npm run build"
  }
}
```

### 5. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# From project root
vercel

# For production deployment
vercel --prod
```

#### Option B: Using Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your GitHub repository (Lahirujay00/UrbanCare)
4. Configure project:
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - **Build Command:** `npm run build` or `cd client && npm run build`
   - **Output Directory:** `client/build`
   - **Install Command:** `npm install && cd client && npm install && cd ../server && npm install`

### 6. Set Environment Variables in Vercel
Go to Project Settings → Environment Variables and add:

#### Required Variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/urbancare?retryWrites=true&w=majority
JWT_SECRET=your_super_secure_jwt_secret_min_32_chars
JWT_EXPIRE=7d
NODE_ENV=production
CLIENT_URL=https://your-vercel-app.vercel.app
PORT=5000
```

#### Optional (if using Stripe):
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### Optional (if using Cloudinary):
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Optional (if using email):
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 7. Update Client API URL
Update `client/src/services/ApiService.js` baseURL to point to your Vercel backend:
```javascript
baseURL: process.env.REACT_APP_API_URL || 'https://your-backend.vercel.app/api'
```

Add to client `.env.production`:
```
REACT_APP_API_URL=https://your-backend.vercel.app/api
```

### 8. Configure CORS in server.js
Update CORS configuration to include your Vercel frontend URL:
```javascript
const corsOptions = {
  origin: [
    'https://your-app-name.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
};
app.use(cors(corsOptions));
```

### 9. Deploy
```bash
# Push to GitHub (triggers auto-deploy if connected)
git add .
git commit -m "Configure for Vercel deployment"
git push origin main

# Or deploy directly with CLI
vercel --prod
```

## Important Notes

### File Uploads
⚠️ Vercel has a **read-only filesystem**. You MUST use external storage for uploads:
- Use **Cloudinary** (recommended) for document/image uploads
- Update upload middleware to use Cloudinary instead of local filesystem
- Environment variables for Cloudinary required

### Serverless Functions Limitations
- Max execution time: 10s (Hobby), 60s (Pro)
- Max payload: 4.5MB
- No persistent storage on filesystem

### Database
- Use MongoDB Atlas (cloud-hosted)
- Ensure IP whitelist includes `0.0.0.0/0` for Vercel

### Socket.io
⚠️ Socket.io may have issues on Vercel serverless. Consider:
- Using Vercel's built-in WebSocket support
- Moving to a dedicated WebSocket service (Pusher, Ably)
- Deploying Socket.io separately (Railway, Heroku, Render)

## Troubleshooting

### Build Fails
```bash
# Check build logs in Vercel dashboard
# Ensure all dependencies are in package.json (not devDependencies if needed in production)
```

### API Routes 404
- Check `vercel.json` routes configuration
- Ensure API routes start with `/api`

### Environment Variables Not Working
- Redeploy after adding environment variables
- Check variable names match exactly

### MongoDB Connection Timeout
- Whitelist `0.0.0.0/0` in MongoDB Atlas
- Check connection string format
- Increase `serverSelectionTimeoutMS` in mongoose connect options

## Alternative Deployment Options
If Vercel doesn't meet your needs:
- **Railway:** Better for full-stack apps with file uploads and WebSockets
- **Render:** Free tier, supports persistent storage
- **Heroku:** Classic PaaS, good for Node.js apps
- **DigitalOcean App Platform:** More traditional server setup

## Post-Deployment
1. Test all API endpoints
2. Test authentication flow
3. Test file uploads (should use Cloudinary)
4. Test Socket.io functionality
5. Monitor Vercel logs for errors
6. Set up custom domain (optional)

## Custom Domain Setup
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update `CLIENT_URL` environment variable

## Useful Commands
```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Remove deployment
vercel rm <deployment-url>

# Pull environment variables locally
vercel env pull
```

## Support Links
- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
