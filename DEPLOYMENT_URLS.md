# UrbanCare Deployment URLs

## Production Deployment

### Frontend (Client)
- **URL:** https://urban-care-front.vercel.app
- **Repository:** Lahirujay00/UrbanCare
- **Branch:** main
- **Platform:** Vercel

### Backend (Server)
- **URL:** https://urban-care-back.vercel.app
- **API Base:** https://urban-care-back.vercel.app/api
- **Health Check:** https://urban-care-back.vercel.app/health
- **Repository:** Lahirujay00/UrbanCare
- **Branch:** main
- **Platform:** Vercel

## Environment Variables Setup

### Backend (urban-care-back.vercel.app)
Set these in Vercel Dashboard → Settings → Environment Variables:

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://admin:1234@cluster0.di9quiu.mongodb.net/urbancare?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_secure_jwt_secret_32_chars_minimum
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_32_chars
JWT_REFRESH_EXPIRE=30d
CLIENT_URL=https://urban-care-front.vercel.app
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
DB_ENCRYPTION_KEY=your_32_character_encryption_key

# Optional - Email
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Optional - Stripe
STRIPE_SECRET_KEY=sk_live_or_sk_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Optional - Cloudinary (Required for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional - Twilio SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

### Frontend (urban-care-front.vercel.app)
Set these in Vercel Dashboard → Settings → Environment Variables:

```bash
REACT_APP_API_URL=https://urban-care-back.vercel.app/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_or_pk_test_key
```

## Quick Links

### Development
- Local Frontend: http://localhost:3000
- Local Backend: http://localhost:5000
- Local API: http://localhost:5000/api
- Local Health: http://localhost:5000/health

### Production
- Frontend: https://urban-care-front.vercel.app
- Backend API: https://urban-care-back.vercel.app/api
- Health Check: https://urban-care-back.vercel.app/health

### Admin Access
- MongoDB Atlas: https://cloud.mongodb.com
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Repo: https://github.com/Lahirujay00/UrbanCare

## Deployment Commands

```powershell
# Deploy to Vercel (both frontend and backend)
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Pull environment variables locally
vercel env pull
```

## Post-Deployment Checklist

- [ ] Backend is accessible at https://urban-care-back.vercel.app/health
- [ ] Frontend is accessible at https://urban-care-front.vercel.app
- [ ] MongoDB connection successful (check Vercel logs)
- [ ] CORS configured correctly (no CORS errors in browser console)
- [ ] Environment variables set for both frontend and backend
- [ ] Login/Registration working
- [ ] API endpoints responding correctly
- [ ] JWT authentication working

## Monitoring & Logs

### View Backend Logs
```powershell
vercel logs --project=urban-care-back
vercel logs --project=urban-care-back --follow
```

### View Frontend Logs
```powershell
vercel logs --project=urban-care-front
vercel logs --project=urban-care-front --follow
```

## Troubleshooting

### Issue: 502 Bad Gateway
- Check MongoDB connection in Vercel logs
- Verify MONGODB_URI is correct
- Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0

### Issue: CORS Errors
- Verify CLIENT_URL in backend environment variables
- Check CORS configuration in server.js
- Clear browser cache

### Issue: Environment Variables Not Working
- Redeploy after adding environment variables
- Check variable names (case-sensitive)
- For React, must start with REACT_APP_

### Issue: File Uploads Failing
- Vercel has read-only filesystem
- Must use Cloudinary or S3
- Set CLOUDINARY_* environment variables

## Last Updated
November 13, 2025
