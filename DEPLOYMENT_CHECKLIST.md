# Vercel Deployment Checklist ✅

## Files Created ✓
- [x] `vercel.json` (root) - Main configuration
- [x] `server/vercel.json` - Server configuration
- [x] `.vercelignore` - Files to exclude
- [x] `.env.production` (root) - Server env template
- [x] `client/.env.production` - Client env template
- [x] `DEPLOYMENT.md` - Full deployment guide
- [x] `package.json` updated with `vercel-build` script

## Deployment Steps

### Step 1: Prepare MongoDB Atlas (Required)
1. Go to https://cloud.mongodb.com
2. Create a free cluster (or use existing)
3. Create database user with password
4. **Whitelist all IPs:** Network Access → Add IP → Allow Access from Anywhere (0.0.0.0/0)
5. Get connection string: Database → Connect → Connect your application
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/urbancare?retryWrites=true&w=majority`

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Click **"Add New Project"**
3. **Import Git Repository:**
   - Select GitHub
   - Choose `Lahirujay00/UrbanCare`
   - Click Import

4. **Configure Project:**
   ```
   Framework Preset: Other
   Root Directory: ./
   Build Command: npm run build
   Output Directory: client/build
   Install Command: npm install
   ```

5. **Add Environment Variables** (click "Environment Variables" tab):
   
   **Required Variables:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/urbancare
   JWT_SECRET=your_secure_random_string_min_32_characters_long
   JWT_EXPIRE=7d
   NODE_ENV=production
   CLIENT_URL=https://your-app.vercel.app
   PORT=5000
   ```

   **Optional (Stripe):**
   ```
   STRIPE_SECRET_KEY=sk_test_... or sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
   ```

   **Optional (Email):**
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```

   **For Client (REACT_APP_ prefix):**
   ```
   REACT_APP_API_URL=https://your-app.vercel.app/api
   REACT_APP_STRIPE_PUBLIC_KEY=pk_test_... or pk_live_...
   ```

6. Click **"Deploy"**

#### Option B: Deploy via CLI
```powershell
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (from project root)
cd D:\projects\UrbanCare
vercel

# For production
vercel --prod
```

### Step 3: After First Deployment

1. **Get Your Vercel URL** (e.g., `https://urban-care-xyz.vercel.app`)

2. **Update Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Update `CLIENT_URL` to your actual Vercel URL
   - Update `REACT_APP_API_URL` to `https://your-app.vercel.app/api`
   - Click "Redeploy" after updating

3. **Test the Deployment:**
   - Visit: `https://your-app.vercel.app`
   - Check API: `https://your-app.vercel.app/api/health`
   - Test login/registration

### Step 4: Configure CORS (If needed)

If you get CORS errors, update `server/server.js`:

```javascript
const corsOptions = {
  origin: [
    process.env.CLIENT_URL,
    'https://your-app.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
```

## Important Warnings ⚠️

### 1. File Uploads
**Vercel has read-only filesystem!** Local file uploads won't work.

**Solutions:**
- Use **Cloudinary** (recommended) for image/document uploads
- Or use **AWS S3**
- Update multer middleware to use cloud storage

### 2. Socket.io Limitations
Socket.io may not work reliably on Vercel serverless.

**Solutions:**
- Use Vercel's native WebSocket support
- Use external service (Pusher, Ably)
- Deploy Socket.io separately (Railway, Render)

### 3. Serverless Function Limits
- **Max execution time:** 10 seconds (Hobby), 60 seconds (Pro)
- **Max payload:** 4.5MB
- **No persistent storage**

## Post-Deployment Testing

### Test Checklist:
- [ ] Homepage loads
- [ ] API health endpoint: `/api/health`
- [ ] User registration works
- [ ] User login works
- [ ] Patient dashboard loads
- [ ] Doctor dashboard loads
- [ ] Appointment booking works
- [ ] Check browser console for errors
- [ ] Check Vercel logs for server errors

## View Logs

### In Vercel Dashboard:
1. Go to your project
2. Click on a deployment
3. Click "Functions" or "Logs" tab

### Via CLI:
```powershell
vercel logs
vercel logs --follow  # Real-time
```

## Troubleshooting

### Build Fails
```powershell
# Check if all dependencies are installed locally first
npm run install-all
npm run build

# If it works locally but fails on Vercel:
# - Check Node version in vercel.json
# - Check build logs in Vercel dashboard
# - Ensure devDependencies vs dependencies are correct
```

### API Returns 404
- Check `vercel.json` routes
- Ensure API endpoints start with `/api`
- Check server is exporting app: `module.exports = app;` ✓

### MongoDB Connection Error
- Whitelist `0.0.0.0/0` in MongoDB Atlas
- Check connection string in environment variables
- Verify database user credentials

### Environment Variables Not Working
- Must redeploy after adding/changing env vars
- Verify exact variable names (case-sensitive)
- For client vars, must start with `REACT_APP_`

### CORS Errors
- Add Vercel URL to CORS whitelist in `server.js`
- Set `CLIENT_URL` environment variable correctly
- Clear browser cache

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS:
   - For apex domain: A record to `76.76.21.21`
   - For www: CNAME to `cname.vercel-dns.com`
4. Wait for DNS propagation (can take 24-48 hours)

## Update Existing Deployment

### Via Git Push (Automatic):
```powershell
git add .
git commit -m "Update: description"
git push origin main
# Vercel auto-deploys on push
```

### Via CLI:
```powershell
vercel --prod
```

## Rollback Deployment

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

## Alternative if Vercel Doesn't Work

If you encounter issues with Vercel (file uploads, Socket.io, etc.):

**Better alternatives for full-stack MERN:**
- **Railway** - https://railway.app (supports WebSockets, file uploads)
- **Render** - https://render.com (free tier, persistent storage)
- **Heroku** - https://heroku.com (classic PaaS)
- **DigitalOcean App Platform** - https://www.digitalocean.com/products/app-platform

## Success Checklist ✅

Your deployment is successful when:
- [ ] Site loads at Vercel URL
- [ ] No console errors
- [ ] Login/registration works
- [ ] MongoDB connection successful
- [ ] API endpoints respond correctly
- [ ] JWT authentication works
- [ ] Patient/Doctor dashboards load
- [ ] No CORS errors

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Check deployment logs in dashboard
- Check function logs for server errors

---

**Ready to Deploy?** Follow Step 1 → Step 2 → Step 3 above!
