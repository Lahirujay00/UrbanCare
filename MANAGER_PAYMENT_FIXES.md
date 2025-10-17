# Manager Dashboard Payment Fixes

## Summary
Fixed the Recent Payments and Total Revenue issues in the Manager Dashboard by updating both backend and frontend.

## Issues Identified

1. **Backend `/api/payments/stats/overview` endpoint** was not returning `recentPayments` data
2. **Backend** was not returning `totalRevenue` at the top level (it was nested in `stats.totalRevenue`)
3. **Frontend** `formatCurrency` was using USD instead of LKR

## Changes Made

### 1. Backend: `server/routes/payments.js`

**Updated `/api/payments/stats/overview` endpoint to include recent payments:**

```javascript
// Added recent payments query
const recentPayments = await Payment.find({ status: 'completed' })
  .sort({ paymentDate: -1 })
  .limit(10)
  .populate('patient', 'firstName lastName email')
  .populate('appointment', 'appointmentDate')
  .lean();

// Updated response structure
res.json({
  success: true,
  data: {
    stats,                              // Original stats object
    dailyRevenue,                       // Original daily revenue array
    recentPayments,                     // NEW: Recent payments array
    totalRevenue: stats.totalRevenue,   // NEW: Total revenue at top level
    totalTransactions: stats.totalTransactions  // NEW: Total transactions at top level
  }
});
```

**What it returns now:**
- `stats` - Full statistics object with totalRevenue, totalTransactions, averageTransaction, paymentMethods
- `dailyRevenue` - Array of daily revenue data for charts
- `recentPayments` - Array of up to 10 most recent completed payments with patient info
- `totalRevenue` - Total revenue amount (for easy access)
- `totalTransactions` - Total number of transactions (for easy access)

### 2. Frontend: `client/src/pages/manager/DashboardFull.js`

**Updated `formatCurrency` function:**

**Before:**
```javascript
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};
```

**After:**
```javascript
const formatCurrency = (amount) => {
  return `LKR ${new Intl.NumberFormat('en-US').format(amount || 0)}`;
};
```

**Changes:**
- Removed USD currency symbol
- Added LKR prefix
- Added fallback to 0 if amount is undefined
- Uses number formatting with commas (e.g., LKR 1,500)

## How It Works Now

### Total Revenue Display
1. Backend calculates total revenue from all completed payments
2. Returns `totalRevenue` at top level of response
3. Frontend sets it in stats: `revenue: totalRevenue`
4. Displays as: `LKR {formatted amount}`

### Recent Payments Display
1. Backend queries last 10 completed payments
2. Populates patient information (name, email)
3. Populates appointment information
4. Sorts by payment date (newest first)
5. Frontend displays top 5 in the dashboard
6. Shows:
   - Patient name
   - Payment method
   - Payment date
   - Transaction ID (truncated)
   - Amount in LKR
   - Status badge (green for completed)

## Data Flow

```
Backend Query:
Payment.find({ status: 'completed' })
  → Sort by paymentDate DESC
  → Limit 10
  → Populate patient & appointment
  ↓
Backend Response:
{
  success: true,
  data: {
    recentPayments: [
      {
        _id: "...",
        amount: 1500,
        paymentMethod: "card",
        paymentDate: "2025-10-17",
        transactionId: "txn_...",
        status: "completed",
        patient: { firstName: "...", lastName: "..." }
      },
      ...
    ],
    totalRevenue: 45000,
    totalTransactions: 30,
    ...
  }
}
  ↓
Frontend Processing:
- setRecentPayments(data.recentPayments.slice(0, 5))
- setStats({ ...prev, revenue: data.totalRevenue })
  ↓
Display:
- Total Revenue Card: "LKR 45,000"
- Recent Payments List: Shows 5 payments with details
```

## Display Format Examples

### Total Revenue Card:
```
Total Revenue
LKR 45,000
↑ 8% increase
```

### Recent Payments:
```
Recent Payments

Saman Kumara
card • Oct 17, 2025
Transaction ID: txn_123456789012...
                            LKR 1,500
                            [completed]

Nadeesha Perera
cash • Oct 16, 2025
Transaction ID: txn_987654321098...
                            LKR 1,800
                            [completed]
```

## Testing Checklist

- [ ] Total Revenue displays correctly in LKR
- [ ] Revenue amount shows with comma separators (e.g., 45,000)
- [ ] Recent Payments section shows up to 5 payments
- [ ] Patient names display correctly
- [ ] Payment methods show (card, cash, etc.)
- [ ] Payment dates format correctly
- [ ] Transaction IDs display (truncated)
- [ ] Payment amounts show in LKR
- [ ] Status badges show correct colors
- [ ] Empty state shows "No recent payments" when no data
- [ ] No console errors
- [ ] Data refreshes when dashboard loads

## API Endpoint Details

### GET `/api/payments/stats/overview`

**Query Parameters:**
- `startDate` (optional) - Start date for statistics (defaults to first day of current month)
- `endDate` (optional) - End date for statistics (defaults to today)

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalRevenue": 45000,
      "totalTransactions": 30,
      "averageTransaction": 1500,
      "paymentMethods": ["card", "cash", ...]
    },
    "dailyRevenue": [
      { "_id": "2025-10-15", "revenue": 5000, "transactions": 3 },
      { "_id": "2025-10-16", "revenue": 7000, "transactions": 5 }
    ],
    "recentPayments": [
      {
        "_id": "payment_id",
        "amount": 1500,
        "paymentMethod": "card",
        "paymentDate": "2025-10-17T10:30:00Z",
        "transactionId": "txn_1234567890",
        "status": "completed",
        "patient": {
          "_id": "patient_id",
          "firstName": "Saman",
          "lastName": "Kumara",
          "email": "saman@example.lk"
        },
        "appointment": {
          "_id": "appointment_id",
          "appointmentDate": "2025-10-17T09:00:00Z"
        }
      }
    ],
    "totalRevenue": 45000,
    "totalTransactions": 30
  }
}
```

## Notes

1. **Payment Filtering:** Only `completed` payments are included in revenue and recent payments
2. **Date Range:** Default date range is current month (can be customized via query params)
3. **Limit:** Recent payments limited to 10 from backend, frontend displays only 5
4. **Population:** Patient and appointment data is populated for recent payments
5. **Currency:** All amounts now display in LKR format
6. **Error Handling:** Frontend gracefully handles missing payment data

## Future Enhancements

1. Add date range picker for custom statistics periods
2. Add payment method filter
3. Add export to CSV/PDF functionality
4. Add payment search functionality
5. Add refund tracking
6. Add payment trends chart
