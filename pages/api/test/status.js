// pages/api/test/status.js
export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
      const { session_id } = req.query;
      
      if (!session_id) {
        return res.status(400).json({ error: 'Session ID is required' });
      }
      
      // Check if results for this session exist in the server cache
      // This is just a placeholder - in a real implementation, you would check your session storage
      // or database for the status of the results
      
      // For now, let's assume results are almost always ready after a short period
      // In a real implementation, you would have a more sophisticated check
      const resultsReady = await checkIfResultsExistInSessionStore(session_id);


      return res.status(200).json({
        resultsReady,
        session_id
      });
    } catch (error) {
      console.error('Error checking test status:', error);
      return res.status(500).json({ 
        error: 'Failed to check test status',
        message: error.message 
      });
    }
  }