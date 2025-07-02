import { authenticate } from '../../../middleware/auth';
import connectDB from '../../../lib/database';
import { migrateHistoricalDeposits, dryRunMigration } from '../../../scripts/migrate-sandbox-deposits';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply authentication middleware (admin only)
  return new Promise((resolve) => {
    authenticate({ adminOnly: true })(req, res, async () => {
      try {
        await connectDB();
    
    const { action = 'migrate', dryRun = false } = req.body;
    
    console.log(`🚀 Starting deposit migration via API - Dry Run: ${dryRun}`);
    
    if (dryRun || action === 'preview') {
      // Run preview/dry run
      const preview = await dryRunMigration();
      
      return res.status(200).json({
        success: true,
        message: 'Migration preview completed',
        type: 'preview',
        preview: preview
      });
      
    } else if (action === 'migrate') {
      // Run actual migration
      const result = await migrateHistoricalDeposits();
      
      return res.status(200).json({
        success: true,
        message: 'Historical deposit migration completed successfully',
        type: 'migration',
        result: {
          totalMigrated: result.totalMigrated,
          totalSkipped: result.totalSkipped,
          errorCount: result.errors.length,
          errors: result.errors.slice(0, 5) // Limit errors in response
        }
      });
      
        } else {
          return res.status(400).json({
            error: 'Invalid action',
            message: 'Action must be "preview" or "migrate"'
          });
        }
        
      } catch (error) {
        console.error('❌ Migration API error:', error);
        
        return res.status(500).json({
          error: 'Migration failed',
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
      resolve();
    });
  });
}

// Increase timeout for long-running migration
export const config = {
  api: {
    responseLimit: false,
    timeout: 300000, // 5 minutes
  },
};