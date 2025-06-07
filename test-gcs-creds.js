// Test GCS credentials parsing
require('dotenv').config({ path: '.env.local' });

console.log('Testing GCS credentials...');

if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  console.log('GOOGLE_SERVICE_ACCOUNT_KEY found, length:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY.length);
  
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    console.log('✅ JSON parsing successful');
    console.log('Project ID:', credentials.project_id);
    console.log('Client Email:', credentials.client_email);
  } catch (error) {
    console.log('❌ JSON parsing failed:', error.message);
    console.log('First 100 chars:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY.substring(0, 100));
  }
} else {
  console.log('❌ GOOGLE_SERVICE_ACCOUNT_KEY not found');
}

if (process.env.GCS_BUCKET_NAME) {
  console.log('✅ GCS_BUCKET_NAME found:', process.env.GCS_BUCKET_NAME);
} else {
  console.log('❌ GCS_BUCKET_NAME not found');
}