// index.js
require('dotenv').config(); // Load environment variables
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const cron = require('node-cron');
const connectDB = require('./lib/database');
const User = require('./models/User');
const { sendMetricsEmail, sendInactiveUserReminder } = require('./lib/email-service');
const { getUserMetrics, getInactiveUsers } = require('./lib/user-service');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');

    connectDB().then(() => {
      // Weekly metrics (every Sunday at 00:00)
      cron.schedule('* * * * *', async () => {
        console.log('Cron job triggered at', new Date());
        try {
          const users = await User.find({ isVerified: true });
          for (const user of users) {
            const metrics = await getUserMetrics(user._id, 'weekly');
            await sendMetricsEmail(user, metrics, 'weekly');
          }
          console.log('Weekly metrics emails sent successfully');
        } catch (error) {
          console.error('Error sending weekly metrics emails:', error);
        }
      });
      console.log('Cron job scheduled');
      // Monthly metrics (1st of every month at 00:00)
      cron.schedule('0 0 1 * *', async () => {
        try {
          const users = await User.find({ isVerified: true });
          for (const user of users) {
            const metrics = await getUserMetrics(user._id, 'monthly');
            await sendMetricsEmail(user, metrics, 'monthly');
          }
          console.log('Monthly metrics emails sent successfully');
        } catch (error) {
          console.error('Error sending monthly metrics emails:', error);
        }
      });

      // Daily inactive user reminders (every day at 00:00)
      cron.schedule('0 0 * * *', async () => {
        try {
          const inactiveUsers = await getInactiveUsers(30); // 30 days inactivity
          for (const user of inactiveUsers) {
            await sendInactiveUserReminder(user);
          }
          console.log('Inactive user reminders sent successfully');
        } catch (error) {
          console.error('Error sending inactive user reminders:', error);
        }
      });
    });
  });
});