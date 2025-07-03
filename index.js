// index.js

require('dotenv').config(); // Load environment variables
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const cron = require('node-cron');

// Simple logger
const logger = {
  log: (...args) => console.log(new Date().toISOString(), ...args)
};

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Import functions dynamically to handle ES6 modules
let connectDB, User, sendMetricsEmail, sendInactiveUserReminder, getUserMetrics, getInactiveUsers, marketDataWS, stopLossMonitor, fundingFeeManager;

async function initializeModules() {
  try {
    connectDB = (await import('./lib/database.js')).default;
    User = (await import('./models/User.js')).default;
    const emailService = await import('./lib/email-service.js');
    sendMetricsEmail = emailService.sendMetricsEmail;
    sendInactiveUserReminder = emailService.sendInactiveUserReminder;
    const userService = await import('./lib/user-service.js');
    getUserMetrics = userService.getUserMetrics;
    getInactiveUsers = userService.getInactiveUsers;
    
    // Import WebSocket server using CommonJS require
    const wsModule = require('./lib/websocket-server.js');
    marketDataWS = wsModule.marketDataWS;
    
    // Import stop loss monitor
    stopLossMonitor = require('./lib/sandbox-stop-loss-monitor.js');
    
    // Import funding fee manager
    fundingFeeManager = require('./lib/sandbox-funding-fees.js');
    
    logger.log('✅ All modules loaded successfully');
  } catch (error) {
    console.error('❌ Error loading modules:', error);
    throw error;
  }
}

// Email sending with rate limiting
async function sendEmailWithRateLimit(emailFunction, user, ...args) {
  try {
    // Add a small delay between emails to avoid overwhelming the email service
    await new Promise(resolve => setTimeout(resolve, 1000));
    await emailFunction(user, ...args);
    logger.log(`📧 Email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${user.email}:`, error.message);
    return false;
  }
}

app.prepare().then(async () => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(3000, async (err) => {
    if (err) throw err;
    logger.log('🚀 Server ready on http://localhost:3000');

    try {
      // Initialize modules
      await initializeModules();
      
      // Connect to database
      await connectDB();
      logger.log('📊 Database connected successfully');

      // Initialize WebSocket server for real-time market data
      try {
        await marketDataWS.initialize(server);
        logger.log('🔗 WebSocket server initialized for real-time market data');
      } catch (wsError) {
        console.error('❌ Failed to initialize WebSocket server:', wsError);
      }

      // 📅 WEEKLY METRICS - Every Sunday at 9:00 AM
      cron.schedule('0 9 * * 0', async () => {
        logger.log('📊 Starting weekly metrics email job at', new Date().toISOString());
        
        try {
          const users = await User.find({ 
            isVerified: true,
            'notifications.email': { $ne: false } // Only send to users who haven't disabled email notifications
          });
          
          logger.log(`📧 Found ${users.length} users for weekly metrics`);
          
          let successCount = 0;
          let errorCount = 0;
          
          for (const user of users) {
            try {
              const metrics = await getUserMetrics(user._id, 'weekly');
              
              // Only send if user has taken tests this week
              if (metrics.testsTaken > 0) {
                const success = await sendEmailWithRateLimit(sendMetricsEmail, user, metrics, 'weekly');
                if (success) {
                  successCount++;
                } else {
                  errorCount++;
                }
              } else {
                logger.log(`⏭️  Skipping ${user.email} - no tests taken this week`);
              }
            } catch (userError) {
              console.error(`❌ Error processing user ${user.email}:`, userError.message);
              errorCount++;
            }
          }
          
          logger.log(`✅ Weekly metrics job completed: ${successCount} sent, ${errorCount} errors`);
        } catch (error) {
          console.error('❌ Error in weekly metrics job:', error);
        }
      }, {
        scheduled: true,
        timezone: "America/New_York" // Adjust to your timezone
      });

      // 📅 MONTHLY METRICS - 1st of every month at 9:00 AM
      cron.schedule('0 9 1 * *', async () => {
        logger.log('📊 Starting monthly metrics email job at', new Date().toISOString());
        
        try {
          const users = await User.find({ 
            isVerified: true,
            'notifications.email': { $ne: false }
          });
          
          logger.log(`📧 Found ${users.length} users for monthly metrics`);
          
          let successCount = 0;
          let errorCount = 0;
          
          for (const user of users) {
            try {
              const metrics = await getUserMetrics(user._id, 'monthly');
              
              // Only send if user has taken tests this month
              if (metrics.testsTaken > 0) {
                const success = await sendEmailWithRateLimit(sendMetricsEmail, user, metrics, 'monthly');
                if (success) {
                  successCount++;
                } else {
                  errorCount++;
                }
              } else {
                logger.log(`⏭️  Skipping ${user.email} - no tests taken this month`);
              }
            } catch (userError) {
              console.error(`❌ Error processing user ${user.email}:`, userError.message);
              errorCount++;
            }
          }
          
          logger.log(`✅ Monthly metrics job completed: ${successCount} sent, ${errorCount} errors`);
        } catch (error) {
          console.error('❌ Error in monthly metrics job:', error);
        }
      }, {
        scheduled: true,
        timezone: "America/New_York"
      });

      // 📅 INACTIVE USER REMINDERS - Every Monday at 10:00 AM
      cron.schedule('0 10 * * 1', async () => {
        logger.log('📧 Starting inactive user reminder job at', new Date().toISOString());
        
        try {
          const inactiveUsers = await getInactiveUsers(30); // 30 days inactivity
          
          // Filter users who have email notifications enabled
          const eligibleUsers = inactiveUsers.filter(user => 
            user.notifications?.email !== false
          );
          
          logger.log(`📧 Found ${eligibleUsers.length} inactive users for reminders`);
          
          let successCount = 0;
          let errorCount = 0;
          
          for (const user of eligibleUsers) {
            const success = await sendEmailWithRateLimit(sendInactiveUserReminder, user);
            if (success) {
              successCount++;
            } else {
              errorCount++;
            }
          }
          
          logger.log(`✅ Inactive user reminders completed: ${successCount} sent, ${errorCount} errors`);
        } catch (error) {
          console.error('❌ Error in inactive user reminder job:', error);
        }
      }, {
        scheduled: true,
        timezone: "America/New_York"
      });

      // 💰 FUNDING FEES - Every 8 hours at 00:00, 08:00, 16:00 UTC
      cron.schedule('0 0,8,16 * * *', async () => {
        logger.log('💰 Starting funding fee processing at', new Date().toISOString());
        
        try {
          if (fundingFeeManager) {
            const result = await fundingFeeManager.processFundingFees();
            logger.log(`💰 Funding fees processed: ${result.processed} trades, ${result.totalFees.toFixed(6)} SENSES total`);
          }
        } catch (error) {
          console.error('❌ Error in funding fee processing:', error);
        }
      }, {
        scheduled: true,
        timezone: "UTC"
      });

      // 🧪 TEST CRON JOB - Every minute (for testing only - remove in production)
      if (process.env.NODE_ENV === 'development' && process.env.ENABLE_TEST_CRON === 'true') {
        cron.schedule('* * * * *', async () => {
          logger.log('🧪 Test cron job triggered at', new Date().toISOString());
        });
        logger.log('🧪 Test cron job enabled (development only)');
      }

      logger.log('⏰ All cron jobs scheduled successfully');
      logger.log('📅 Weekly metrics: Sundays at 9:00 AM');
      logger.log('📅 Monthly metrics: 1st of month at 9:00 AM');
      logger.log('📅 Inactive reminders: Mondays at 10:00 AM');
      logger.log('💰 Funding fees: Every 8 hours (00:00, 08:00, 16:00 UTC)');
      
      // Start sandbox stop loss monitor
      if (stopLossMonitor) {
        await stopLossMonitor.start();
        logger.log('🎯 Sandbox stop loss monitor started');
      }
      
    } catch (error) {
      console.error('❌ Error initializing cron jobs:', error);
    }
  });
});