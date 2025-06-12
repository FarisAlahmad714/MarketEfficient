// Database indexes for performance optimization
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function createIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // TestResults collection indexes
    console.log('Creating TestResults indexes...');
    
    // Compound index for leaderboard queries (most important)
    await db.collection('testresults').createIndex(
      { testType: 1, completedAt: -1, score: -1 },
      { name: 'leaderboard_performance' }
    );

    // Index for chart exam subtypes
    await db.collection('testresults').createIndex(
      { testType: 1, subType: 1, completedAt: -1 },
      { name: 'chart_exam_subtype' }
    );

    // User-specific queries
    await db.collection('testresults').createIndex(
      { userId: 1, completedAt: -1 },
      { name: 'user_tests' }
    );

    // Percentage score calculation index
    await db.collection('testresults').createIndex(
      { score: 1, totalPoints: 1 },
      { name: 'percentage_score' }
    );

    // User collection indexes
    console.log('Creating User indexes...');
    
    // Email lookup (unique already exists)
    await db.collection('users').createIndex(
      { email: 1 },
      { unique: true, name: 'email_unique' }
    );

    // Profile image path lookup
    await db.collection('users').createIndex(
      { profileImageGcsPath: 1 },
      { sparse: true, name: 'profile_image_path' }
    );

    // Subscription collection indexes
    console.log('Creating Subscription indexes...');
    
    await db.collection('subscriptions').createIndex(
      { userId: 1, status: 1 },
      { name: 'user_subscription_status' }
    );

    await db.collection('subscriptions').createIndex(
      { stripeSubscriptionId: 1 },
      { sparse: true, name: 'stripe_subscription_id' }
    );

    // Payment collection indexes
    console.log('Creating Payment indexes...');
    
    await db.collection('payments').createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'user_payments' }
    );

    await db.collection('payments').createIndex(
      { stripeSessionId: 1 },
      { sparse: true, name: 'stripe_session_id' }
    );

    // BiasTestAnalytics indexes
    console.log('Creating BiasTestAnalytics indexes...');
    
    await db.collection('biastestanalytics').createIndex(
      { userId: 1, timestamp: -1 },
      { name: 'user_bias_analytics' }
    );

    await db.collection('biastestanalytics').createIndex(
      { assetSymbol: 1, timestamp: -1 },
      { name: 'asset_analytics' }
    );

    // ChartExamAnalytics indexes
    console.log('Creating ChartExamAnalytics indexes...');
    
    await db.collection('chartexamanalytics').createIndex(
      { userId: 1, timestamp: -1 },
      { name: 'user_chart_analytics' }
    );

    await db.collection('chartexamanalytics').createIndex(
      { examType: 1, timestamp: -1 },
      { name: 'exam_type_analytics' }
    );

    // Feedback indexes
    console.log('Creating Feedback indexes...');
    
    await db.collection('feedbacks').createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'user_feedback' }
    );

    await db.collection('feedbacks').createIndex(
      { status: 1, createdAt: -1 },
      { name: 'feedback_status' }
    );

    console.log('All indexes created successfully!');

    // List all indexes for verification
    console.log('\nVerifying indexes...');
    const collections = ['testresults', 'users', 'subscriptions', 'payments', 'biastestanalytics', 'chartexamanalytics', 'feedbacks'];
    
    for (const collName of collections) {
      try {
        const indexes = await db.collection(collName).listIndexes().toArray();
        console.log(`\n${collName} indexes:`, indexes.map(idx => idx.name));
      } catch (error) {
        console.log(`Collection ${collName} may not exist yet`);
      }
    }

  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createIndexes();