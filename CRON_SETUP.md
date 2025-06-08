# Email Automation Cron Jobs Setup Guide

This guide explains how to set up automated email sending for your ChartSense application across different deployment platforms.

## 📧 Cron Jobs Configuration

### Current Setup (Vercel Hobby Plan - 2 Jobs Max)

### 1. Email Automation (`/api/cron/email-automation`) - **ACTIVE**
- **Schedule**: Daily at 9:00 AM
- **Function**: Smart scheduler that runs different tasks based on day:
  - **Sundays**: Weekly performance metrics
  - **Mondays**: Inactive user reminders (30+ days)
  - **1st of month**: Monthly performance summaries
- **Cron**: `0 9 * * *`

### 2. Subscription Sync (`/api/cron/subscription-sync`) - **ACTIVE**
- **Schedule**: Daily at 6:00 AM
- **Function**: Syncs subscription status with Stripe
- **Cron**: `0 6 * * *`

### Individual Endpoints (Available for Manual Testing)

### 3. Weekly Metrics (`/api/cron/weekly-metrics`) - **COMMENTED OUT**
- **Function**: Sends weekly performance metrics to active users
- **Manual URL**: `/api/cron/weekly-metrics?secret=YOUR_SECRET`

### 4. Monthly Metrics (`/api/cron/monthly-metrics`) - **COMMENTED OUT**
- **Function**: Sends monthly performance summaries
- **Manual URL**: `/api/cron/monthly-metrics?secret=YOUR_SECRET`

### 5. Inactive User Reminders (`/api/cron/inactive-reminders`) - **COMMENTED OUT**
- **Function**: Reminds users who haven't been active for 30+ days
- **Manual URL**: `/api/cron/inactive-reminders?secret=YOUR_SECRET`

## 🚀 Platform Setup Instructions

### Vercel (Current Setup)
The `vercel.json` file is configured for Hobby plan (2 jobs max):

1. **Add Environment Variable**:
   ```bash
   CRON_SECRET=your_secure_random_string_here
   ```

2. **Deploy**: Vercel will automatically set up 2 cron jobs:
   - Email automation (daily at 9 AM)
   - Subscription sync (daily at 6 AM)

3. **Verify**: Check Vercel dashboard for cron job status

#### Hobby Plan Limitations:
- ⚠️ **Only 2 cron jobs** allowed (currently using both)
- ⚠️ **Daily scheduling only** (no hourly jobs)
- ⚠️ **Approximate timing** (jobs may run ±59 minutes from scheduled time)

#### Upgrade Benefits (Pro Plan):
- ✅ **40 cron jobs** per account
- ✅ **Unlimited scheduling** (hourly, minute-level precision)
- ✅ **Exact timing** guarantees

### Railway
1. **Add Environment Variable**:
   ```bash
   CRON_SECRET=your_secure_random_string_here
   ```

2. **Create External Cron Service** (like cron-job.org):
   - Weekly: `https://yourdomain.com/api/cron/weekly-metrics?secret=YOUR_CRON_SECRET`
   - Monthly: `https://yourdomain.com/api/cron/monthly-metrics?secret=YOUR_CRON_SECRET`
   - Inactive: `https://yourdomain.com/api/cron/inactive-reminders?secret=YOUR_CRON_SECRET`
   - Sync: `https://yourdomain.com/api/cron/subscription-sync?secret=YOUR_CRON_SECRET`

### Netlify
1. **Add Environment Variable**:
   ```bash
   CRON_SECRET=your_secure_random_string_here
   ```

2. **Use Netlify Functions + External Cron**:
   - Set up external cron service (GitHub Actions, cron-job.org, etc.)
   - Call your endpoints with the secret

### Heroku
1. **Install Heroku Scheduler Add-on**:
   ```bash
   heroku addons:create scheduler:standard
   ```

2. **Add Environment Variable**:
   ```bash
   heroku config:set CRON_SECRET=your_secure_random_string_here
   ```

3. **Configure Jobs**:
   ```bash
   # Weekly metrics (Sundays at 9 AM)
   curl "https://yourapp.herokuapp.com/api/cron/weekly-metrics" -H "x-cron-secret: $CRON_SECRET"
   
   # Monthly metrics (1st of month at 9 AM)  
   curl "https://yourapp.herokuapp.com/api/cron/monthly-metrics" -H "x-cron-secret: $CRON_SECRET"
   
   # Inactive reminders (Mondays at 10 AM)
   curl "https://yourapp.herokuapp.com/api/cron/inactive-reminders" -H "x-cron-secret: $CRON_SECRET"
   
   # Subscription sync (Every 6 hours)
   curl "https://yourapp.herokuapp.com/api/cron/subscription-sync" -H "x-cron-secret: $CRON_SECRET"
   ```

### AWS/DigitalOcean/VPS
1. **Add Environment Variable** to your `.env.local`:
   ```bash
   CRON_SECRET=your_secure_random_string_here
   ```

2. **Set up system cron jobs** (`crontab -e`):
   ```bash
   # Weekly metrics - Sundays at 9 AM
   0 9 * * 0 curl -H "x-cron-secret: YOUR_SECRET" https://yourdomain.com/api/cron/weekly-metrics
   
   # Monthly metrics - 1st of month at 9 AM
   0 9 1 * * curl -H "x-cron-secret: YOUR_SECRET" https://yourdomain.com/api/cron/monthly-metrics
   
   # Inactive reminders - Mondays at 10 AM  
   0 10 * * 1 curl -H "x-cron-secret: YOUR_SECRET" https://yourdomain.com/api/cron/inactive-reminders
   
   # Subscription sync - Every 6 hours
   0 */6 * * * curl -H "x-cron-secret: YOUR_SECRET" https://yourdomain.com/api/cron/subscription-sync
   ```

## 🔒 Security Features

- **Secret Authentication**: All cron endpoints require `CRON_SECRET`
- **Method Validation**: Only GET requests allowed
- **Rate Limiting**: Built-in delays to prevent email service overload
- **Error Handling**: Comprehensive error logging and reporting

## 📊 Monitoring & Testing

### Test Cron Jobs Manually
Use the admin panel at `/admin/cron-test` to:
- Test individual cron jobs with dry run mode
- View detailed execution results
- Monitor email delivery status

### Verify Setup
1. **Check Logs**: Monitor server logs for cron execution
2. **Test Endpoints**: Manually call endpoints with secret
3. **Admin Panel**: Use built-in testing interface

## 📧 Email Configuration Required

Ensure these environment variables are set:
```bash
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_SECRET_KEY=your_mailjet_secret_key
EMAIL_SENDER_EMAIL=noreply@yourdomain.com
EMAIL_SENDER_NAME=ChartSense
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 🔧 Troubleshooting

### Cron Jobs Not Running
1. Check `CRON_SECRET` environment variable
2. Verify endpoint URLs are correct
3. Check platform-specific cron configuration

### Emails Not Sending
1. Test email configuration with admin panel
2. Check Mailjet API credentials
3. Verify user email notification preferences
4. Review rate limiting logs

### High Error Rates
1. Check email service rate limits
2. Verify database connectivity
3. Review user data integrity
4. Monitor API response times

## 🎯 Success Metrics

Monitor these metrics to ensure proper operation:
- **Email Delivery Rate**: >95% success rate
- **Cron Execution**: All jobs completing within expected timeframes
- **User Engagement**: Increased activity after reminder emails
- **Error Rate**: <5% error rate across all cron jobs

The automated email system is now fully configured and ready for production use! 🚀