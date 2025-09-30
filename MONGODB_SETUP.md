# 🔧 MongoDB Connection Fix Guide

## 🚨 **Current Issue:** 
MongoDB Atlas connection failing due to IP whitelist restrictions.

## ✅ **Quick Solutions:**

### **Option 1: Fix MongoDB Atlas (Recommended)**

1. **Go to MongoDB Atlas Dashboard:**
   - Visit: https://cloud.mongodb.com/
   - Login to your account
   - Select your cluster: `Cluster0`

2. **Update IP Whitelist:**
   - Click "Network Access" in left sidebar
   - Click "Add IP Address"
   - Choose "Add Current IP Address" 
   - Or add `0.0.0.0/0` for development (allows all IPs)
   - Click "Confirm"

3. **Wait 2-3 minutes** for changes to propagate

4. **Test connection** - restart your server

### **Option 2: Use Local MongoDB (Backup)**

If Atlas continues having issues, switch to local MongoDB:

1. **Install MongoDB locally:**
   ```powershell
   # Using Chocolatey
   choco install mongodb

   # Or download from: https://www.mongodb.com/try/download/community
   ```

2. **Start MongoDB service:**
   ```powershell
   net start MongoDB
   ```

3. **Update .env file:**
   ```
   MONGODB_URI=mongodb://localhost:27017/urbancare
   ```

### **Option 3: Temporary Connection String Fix**

Try updating your connection string with additional parameters:

```
MONGODB_URI=mongodb+srv://admin:1234@cluster0.di9quiu.mongodb.net/urbancare?retryWrites=true&w=majority&appName=Cluster0&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000&authSource=admin&authMechanism=SCRAM-SHA-1
```

## 🔍 **Troubleshooting Steps:**

1. **Check Current IP:**
   - Visit: https://whatismyipaddress.com/
   - Note your current IP address

2. **Verify Atlas Credentials:**
   - Username: `admin`
   - Password: `1234`
   - Database: `urbancare`

3. **Test Connection:**
   ```powershell
   # Restart server after changes
   npm run server
   ```

## 🚀 **Quick Test:**

After fixing the connection, test with:
- Registration: http://localhost:3000
- Server health: http://localhost:5000/health

---

**Most likely solution:** Just add your current IP to Atlas whitelist! 🎯