# Receptionist Module - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Ensure MongoDB is Running

```bash
# Check if MongoDB is running
mongosh

# Or start MongoDB service
# Windows: Services -> MongoDB -> Start
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### 2. Install Dependencies (if not already done)

```bash
cd server
npm install
```

### 3. Seed the Database

```bash
node seed.js
```

You should see output like:

```
✅ MongoDB Connected
🗑️  Clearing existing data...
✅ Existing data cleared

👥 Creating receptionists...
   ✓ Kavindu Perera (kavindu@hospital.lk)
   ✓ Sithmi Fernando (sithmi@hospital.lk)
✅ 2 receptionists created

🏥 Creating patients...
   ✓ Nimal Perera (Card ID: HC2025001)
   ✓ Sanduni Wijesinghe (Card ID: HC2025002)
   ...
✅ 5 patients created

📋 Creating activity logs...
✅ 5 activity logs created

🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!
```

### 4. Test the API

#### Option A: Using cURL

**1. Login:**

```bash
curl -X POST http://localhost:5000/api/receptionist/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"kavindu@hospital.lk\",\"password\":\"123456\"}"
```

**2. Get Patient (replace TOKEN with actual token):**

```bash
curl -X GET http://localhost:5000/api/receptionist/patients/HC2025001 ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Option B: Using Postman/Thunder Client

1. **Create a new request collection**

2. **Login Request:**

   - Method: POST
   - URL: `http://localhost:5000/api/receptionist/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "kavindu@hospital.lk",
       "password": "123456"
     }
     ```
   - Send → Copy the `token` from response

3. **Get Patient Request:**
   - Method: GET
   - URL: `http://localhost:5000/api/receptionist/patients/HC2025001`
   - Headers:
     - Key: `Authorization`
     - Value: `Bearer YOUR_TOKEN_HERE`
   - Send → See patient data

## 📋 Test Credentials

### Receptionists:

```
Email: kavindu@hospital.lk
Password: 123456
Employee ID: REC001
```

```
Email: sithmi@hospital.lk
Password: 654321
Employee ID: REC002
```

### Patient Health Card IDs:

- `HC2025001` - Nimal Perera (Diabetes patient)
- `HC2025002` - Sanduni Wijesinghe (Thyroid patient)
- `HC2025003` - Rajith Fernando (Cardiac patient)
- `HC2025004` - Dilini Amarasinghe (Prenatal care)
- `HC2025005` - Chandana Gunasekara (Diabetic neuropathy)

## 🧪 Testing Scenarios

### Scenario 1: Successful Patient Lookup

1. Login as receptionist
2. Search for card ID: `HC2025001`
3. ✅ View patient record
4. Check logs to confirm activity recorded

### Scenario 2: Invalid Card ID

1. Login as receptionist
2. Search for card ID: `HC9999999`
3. ✅ Receive 404 error
4. Check logs to confirm search attempt recorded

### Scenario 3: Update Patient Contact

1. Login as receptionist
2. Get patient ID from card lookup
3. Update contact number:
   ```json
   {
     "contactNumber": "+94 77 999 8888"
   }
   ```
4. ✅ Confirm update successful
5. Check logs to see the change recorded

### Scenario 4: View Activity Logs

1. Login as receptionist
2. GET `/api/receptionist/logs/me`
3. ✅ See all your activities

### Scenario 5: Invalid Login

1. Try login with wrong password
2. ✅ Receive 401 error
3. Check logs to confirm failed attempt recorded

## 🔍 Common Issues & Solutions

### Issue: "MongoDB connection error"

**Solution:**

- Ensure MongoDB is running
- Check MONGODB_URI in .env file
- Default: `mongodb://localhost:27017/urbancare`

### Issue: "Token verification failed"

**Solution:**

- Ensure JWT_SECRET is set in .env
- Token might be expired (30 days default)
- Login again to get fresh token

### Issue: "Cannot find module"

**Solution:**

- Run `npm install` in server directory
- Check all dependencies are installed

### Issue: "Port already in use"

**Solution:**

- Change PORT in .env file
- Or kill process using port 5000

### Issue: Seeding script fails

**Solution:**

- Clear database manually:
  ```bash
  mongosh
  use urbancare
  db.receptionists.deleteMany({})
  db.patients.deleteMany({})
  db.logs.deleteMany({})
  exit
  ```
- Run seed script again

## 📊 View Data in MongoDB

```bash
# Connect to MongoDB
mongosh

# Switch to database
use urbancare

# View receptionists
db.receptionists.find().pretty()

# View patients
db.patients.find().pretty()

# View logs
db.logs.find().sort({timestamp: -1}).limit(10).pretty()

# Count records
db.receptionists.countDocuments()
db.patients.countDocuments()
db.logs.countDocuments()
```

## 🎯 API Endpoints Quick Reference

| Method | Endpoint                                 | Auth | Description          |
| ------ | ---------------------------------------- | ---- | -------------------- |
| POST   | `/api/receptionist/auth/login`           | No   | Login receptionist   |
| GET    | `/api/receptionist/auth/me`              | Yes  | Get current user     |
| GET    | `/api/receptionist/patients/:cardId`     | Yes  | Find patient by card |
| GET    | `/api/receptionist/patients`             | Yes  | List all patients    |
| PUT    | `/api/receptionist/patients/update/:id`  | Yes  | Update patient info  |
| GET    | `/api/receptionist/logs`                 | Yes  | Get all logs         |
| GET    | `/api/receptionist/logs/me`              | Yes  | Get my logs          |
| GET    | `/api/receptionist/logs/patient/:cardId` | Yes  | Get patient logs     |

## 💡 Tips for Testing

1. **Save Your Token:** Store it in Postman environment or a text file
2. **Use MongoDB Compass:** Visual tool to browse database
3. **Check Logs Collection:** Every action is logged
4. **Test Error Cases:** Invalid IDs, missing tokens, wrong passwords
5. **Monitor Console:** Server logs show all activities

## 🔄 Reset Everything

If you want to start fresh:

```bash
# Stop the server (Ctrl+C)

# Clear and reseed database
node seed.js

# Restart server
npm run dev
```

## 📱 Frontend Integration

Once backend is working, connect your React frontend:

```javascript
// src/services/receptionistApi.js
const API_BASE = "http://localhost:5000/api/receptionist";

export const receptionistApi = {
  login: (email, password) =>
    axios.post(`${API_BASE}/auth/login`, { email, password }),

  getPatient: (cardId, token) =>
    axios.get(`${API_BASE}/patients/${cardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updatePatient: (id, data, token) =>
    axios.put(`${API_BASE}/patients/update/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
```

## ✅ Success Checklist

- [ ] MongoDB is running
- [ ] Dependencies installed (`npm install`)
- [ ] Database seeded (`node seed.js`)
- [ ] Server is running (`npm run dev`)
- [ ] Successfully logged in via API
- [ ] Successfully retrieved patient data
- [ ] Successfully updated patient info
- [ ] Activity logs are being created

## 🆘 Need Help?

1. Check server console for error messages
2. Verify all environment variables in `.env`
3. Ensure MongoDB connection string is correct
4. Check network requests in browser DevTools
5. Review the full documentation in `RECEPTIONIST_MODULE_README.md`

---

**Happy Testing! 🎉**
