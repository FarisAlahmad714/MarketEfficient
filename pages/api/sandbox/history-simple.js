// Simplified history API for testing
export default async function handler(req, res) {
  console.log('=== SIMPLE HISTORY API CALLED ===');
  
  try {
    // Basic auth check
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    // Just return dummy data to test if the endpoint works
    res.status(200).json({
      success: true,
      data: [
        {
          id: '1',
          itemType: 'trade',
          displayTitle: 'BTC',
          displaySubtitle: 'LONG',
          displayAmount: 100,
          displayAmountFormatted: '+100.00 SENSES',
          date: new Date()
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        totalTrades: 38,
        totalTransactions: 1,
        totalItems: 39,
        totalPages: 2,
        hasMore: true
      }
    });
  } catch (error) {
    console.error('Simple history error:', error);
    res.status(500).json({ error: error.message });
  }
}