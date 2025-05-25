# 🕐 Cron Job Setup Guide

## 📋 Overview

Your MarketEfficient application now has a fully functional cron job system for automated email notifications:

- **Weekly Metrics**: Sent every Sunday at 9:00 AM
- **Monthly Metrics**: Sent on the 1st of every month at 9:00 AM  
- **Inactive User Reminders**: Sent every Monday at 10:00 AM

## ✅ What Was Fixed

### 🚨 Critical Issues Resolved:
1. **FIXED**: Changed `'* * * * *'` (every minute) to `'0 9 * * 0'` (Sundays at 9 AM)
2. **FIXED**: ES6 module import issues with dynamic imports
3. **ADDED**: Rate limiting between emails (1 second delay)
4. **ADDED**: Email notification preferences checking
5. **ADDED**: Comprehensive error handling and logging
6. **ADDED**: Only send metrics to users who have taken tests

### 🆕 New Features:
- User notification preferences in database
- Admin testing interface at `/admin/cron-test`
- Detailed logging with emojis for easy debugging
- Timezone support (currently set to America/New_York)

## 🚀 How to Test

### 1. Environment Variables
Add to your `.env.local`:
```bash
# For development testing
ENABLE_TEST_CRON=true
NODE_ENV=development
```

### 2. Admin Testing Interface
1. Make sure you have admin access
2. Visit: `http://localhost:3000/admin/cron-test`
3. Click any test button to run cron jobs manually
4. View detailed results and logs

### 3. API Testing
```bash
# Test weekly metrics
curl -X POST http://localhost:3000/api/admin/test-cron \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"type": "weekly-metrics"}'

# Test monthly metrics  
curl -X POST http://localhost:3000/api/admin/test-cron \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"type": "monthly-metrics"}'

# Test inactive reminders
curl -X POST http://localhost:3000/api/admin/test-cron \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"type": "inactive-reminders"}'
```

## 📅 Cron Schedule Explained

```bash
# Format: minute hour day month day-of-week
'0 9 * * 0'    # Sundays at 9:00 AM (weekly metrics)
'0 9 1 * *'    # 1st of month at 9:00 AM (monthly metrics)  
'0 10 * * 1'   # Mondays at 10:00 AM (inactive reminders)
```

## 🔧 Configuration

### Timezone
Change timezone in `index.js`:
```javascript
{
  scheduled: true,
  timezone: "America/New_York" // Change this to your timezone
}
```

### Email Frequency
- **Weekly**: Users who took tests in the last 7 days
- **Monthly**: Users who took tests in the last 30 days
- **Inactive**: Users who haven't taken tests in 30+ days

### User Preferences
Users can disable emails in their profile. The system checks:
```javascript
'notifications.email': { $ne: false }
```

## 📊 Monitoring

### Console Logs
The system provides detailed logging:
```
🚀 Server ready on http://localhost:3000
✅ All modules loaded successfully
📊 Database connected successfully
⏰ All cron jobs scheduled successfully
📅 Weekly metrics: Sundays at 9:00 AM
📅 Monthly metrics: 1st of month at 9:00 AM
📅 Inactive reminders: Mondays at 10:00 AM
```

### During Execution:
```
📊 Starting weekly metrics email job at 2025-01-27T14:00:00.000Z
📧 Found 5 users for weekly metrics
📧 Email sent to user@example.com
⏭️  Skipping user2@example.com - no tests taken this week
✅ Weekly metrics job completed: 3 sent, 0 errors
```

## 🛡️ Safety Features

1. **Rate Limiting**: 1 second delay between emails
2. **User Limits**: Test functions limited to 5 users max
3. **Preference Checking**: Only sends to users who opted in
4. **Error Handling**: Continues processing even if individual emails fail
5. **Test Mode**: Development-only test cron that runs every minute

## 🚨 Production Deployment

### Before Going Live:
1. Set `NODE_ENV=production`
2. Remove or set `ENABLE_TEST_CRON=false`
3. Configure proper email service (Mailjet)
4. Set correct timezone
5. Monitor logs for first few runs

### Email Service Setup:
```bash
MAILJET_API_KEY=your-api-key
MAILJET_SECRET_KEY=your-secret-key
EMAIL_SENDER_EMAIL=noreply@yourdomain.com
EMAIL_SENDER_NAME=ChartSense
```

## 🐛 Troubleshooting

### Common Issues:

1. **Emails not sending**
   - Check email service credentials
   - Verify users have `isVerified: true`
   - Check user notification preferences

2. **Cron not running**
   - Verify server is running continuously
   - Check timezone settings
   - Look for error logs in console

3. **Module import errors**
   - Ensure all dependencies are installed
   - Check file paths in imports

### Debug Commands:
```bash
# Check user notification preferences
db.users.find({}, {email: 1, notifications: 1, isVerified: 1})

# Check test results for metrics
db.testresults.find({userId: ObjectId("USER_ID")}).sort({completedAt: -1})

# Check inactive users
db.users.find({isVerified: true, lastLogin: {$lt: new Date(Date.now() - 30*24*60*60*1000)}})
```

## 📈 Next Steps

1. **Test thoroughly** in development
2. **Monitor email delivery** rates
3. **Add more email types** (welcome series, achievements, etc.)
4. **Implement email analytics** (open rates, click rates)
5. **Add user email preferences** page

---

🎉 **Your cron job system is now ready to use!** Test it thoroughly before deploying to production. 