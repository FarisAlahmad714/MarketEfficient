// scripts/backup-data.js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../lib/logger'); // Adjust path to your logger utility

async function backupData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.log('Connected to MongoDB for backup');

    const models = ['User', 'Subscription', 'TestResults', 'Payment', 'PromoCode'];
    const backupDir = path.join(process.cwd(), 'backups', new Date().toISOString().split('T')[0]);
    
    // Create backup directory
    await fs.mkdir(backupDir, { recursive: true });

    for (const modelName of models) {
      const Model = mongoose.models[modelName] || require(`../models/${modelName}`);
      const data = await Model.find({}).lean();
      
      // Save to JSON file
      const filePath = path.join(backupDir, `${modelName}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      
      logger.log(`✅ Backed up ${data.length} ${modelName} records`);
    }

    logger.log(`\n✅ Backup completed to: ${backupDir}`);
    logger.log('⚠️  Add /backups to .gitignore!');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

backupData();