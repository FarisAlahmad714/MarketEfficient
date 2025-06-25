# Test Results Debugging Utilities

This document explains the debugging tools created to investigate test results issues, including average calculations, duplicate detection, and data integrity checks.

## Available Tools

### 1. Command Line Script
**File:** `scripts/debug-test-results.js`

A comprehensive command-line tool that provides detailed analysis of a user's test results.

#### Usage:
```bash
# Debug by email
node scripts/debug-test-results.js user@example.com

# Debug by username  
node scripts/debug-test-results.js johndoe

# Debug by user ID
node scripts/debug-test-results.js 64f1b2c3d4e5f6789abc0123
```

#### Features:
- ✅ Fetches all test results for a user
- ✅ Shows detailed breakdown of each test result
- ✅ Calculates both weighted and simple averages
- ✅ Detects duplicate entries
- ✅ Identifies orphaned records
- ✅ Performs data integrity checks
- ✅ Groups results by test type
- ✅ Color-coded console output
- ✅ Shows question-by-question breakdown

#### Output Sections:
1. **User Information** - Basic user details
2. **Detailed Test Results** - Each test result with full details
3. **Duplicate Detection** - Identifies potential duplicate entries
4. **Statistics** - Overall and per-test-type averages
5. **Data Integrity Checks** - Validates data consistency
6. **Summary** - Key metrics and issue counts

### 2. API Endpoint
**Endpoint:** `/api/debug/test-results`

A web API that provides programmatic access to test results debugging.

#### Usage:
```javascript
// Debug current user's results
GET /api/debug/test-results

// Admin: Debug specific user
GET /api/debug/test-results?userId=user@example.com
POST /api/debug/test-results
{
  "userId": "user@example.com"
}
```

#### Authentication:
- Requires user authentication
- Admin users can debug any user's results
- Regular users can only debug their own results

#### Response Format:
```json
{
  "success": true,
  "user": {
    "id": "64f1b2c3d4e5f6789abc0123",
    "email": "user@example.com",
    "username": "johndoe",
    "createdAt": "2023-09-01T10:00:00Z"
  },
  "analysis": {
    "totalResults": 15,
    "averages": {
      "weightedAverage": 78.5,
      "simpleAverage": 79.2,
      "discrepancy": false
    },
    "byTestType": {
      "bias-test": {
        "count": 10,
        "averagePercentage": 80.0,
        "recent": [...]
      }
    },
    "issues": {
      "duplicates": [],
      "dataIntegrity": []
    },
    "statistics": {
      "totalTests": 15,
      "duplicateEntries": 0,
      "dataIssues": 0
    }
  }
}
```

### 3. Web Interface
**Page:** `/debug-test-results`

A user-friendly web interface for debugging test results.

#### Features:
- ✅ Visual representation of all debug data
- ✅ Admin panel for debugging any user
- ✅ Interactive tables and charts
- ✅ Real-time data fetching
- ✅ Issue highlighting and warnings
- ✅ Export capabilities

#### Access:
- Navigate to `https://yourapp.com/debug-test-results`
- Login required
- Admin users see additional controls

## Investigation Areas

### 1. Average Calculation Verification
The tools calculate averages in two ways:
- **Weighted Average**: `(Total Score / Total Possible Points) * 100`
- **Simple Average**: `Sum of all percentages / Number of tests`

A discrepancy indicates potential calculation issues in the main application.

### 2. Duplicate Detection
Identifies potential duplicates based on:
- Same test type
- Same asset symbol  
- Same completion date (day-level)

### 3. Data Integrity Checks
Validates each test result for:
- Missing required fields
- Negative scores
- Scores exceeding total points
- Orphaned records (no userId)
- Invalid data types

### 4. Temporal Analysis
- Chronological ordering of results
- Date range analysis
- Recent vs historical performance trends

## Common Issues & Solutions

### Issue: Average Discrepancy
**Symptom:** Weighted and simple averages don't match
**Possible Causes:**
- Tests with different total points affecting weighting
- Missing or zero total points
- Calculation bugs in main application

**Investigation Steps:**
1. Check for tests with unusual total points
2. Verify score/totalPoints ratios
3. Look for tests with zero total points

### Issue: Duplicate Results
**Symptom:** Multiple entries for same test/date
**Possible Causes:**
- Double submission bugs
- Session timeout issues
- API retry logic problems

**Investigation Steps:**
1. Check session IDs for duplicates
2. Examine completion timestamps
3. Look for identical question responses

### Issue: Missing Data
**Symptom:** Test results without proper scores
**Possible Causes:**
- Incomplete test submissions
- Database save failures
- API errors during submission

**Investigation Steps:**
1. Check test status field
2. Examine completion timestamps
3. Look for partial question data

## Usage Examples

### Finding User Issues
```bash
# Check specific user's results
node scripts/debug-test-results.js problematic.user@example.com

# Look for patterns in output:
# - High number of duplicates
# - Data integrity issues
# - Average calculation problems
```

### API Integration
```javascript
// In your application
const debugUser = async (userId) => {
  const response = await fetch(`/api/debug/test-results?userId=${userId}`);
  const data = await response.json();
  
  if (data.analysis.averages.discrepancy) {
    console.warn('Average calculation issue detected');
  }
  
  if (data.analysis.issues.duplicates.length > 0) {
    console.warn('Duplicate entries found');
  }
  
  return data;
};
```

## Maintenance

### Adding New Checks
To add new data integrity checks, modify the `analyzeTestResults` function in both the script and API endpoint:

```javascript
// Add new check
if (result.customField === undefined) {
  issues.push('Missing custom field');
}
```

### Performance Considerations
- The tools load all test results into memory
- For users with 1000+ results, consider pagination
- Database indexes on userId and completedAt help performance

### Security Notes
- API endpoint requires authentication
- Admin functions are properly protected
- No sensitive data is logged to console
- User identification supports multiple formats safely

## Troubleshooting

### Script Won't Run
```bash
# Make sure it's executable
chmod +x scripts/debug-test-results.js

# Check Node.js version
node --version

# Verify MongoDB connection
npm run test:db
```

### API Endpoint Issues
- Check authentication middleware
- Verify database connection
- Ensure proper user permissions
- Check API logs for detailed errors

### Web Interface Problems
- Clear browser cache
- Check console for JavaScript errors
- Verify API endpoint accessibility
- Ensure proper authentication state