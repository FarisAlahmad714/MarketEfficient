export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log what we're receiving
    const bodyKeys = Object.keys(req.body || {});
    const profileImage = req.body?.profileImage;
    
    const debugInfo = {
      bodyKeys: bodyKeys,
      hasProfileImage: !!profileImage,
      profileImageStart: profileImage ? profileImage.substring(0, 100) : 'null',
      profileImageLength: profileImage ? profileImage.length : 0,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
    };

    console.log('Test upload debug:', debugInfo);
    
    // Try to parse the data URL
    if (profileImage) {
      const matches = profileImage.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ 
          error: 'Invalid data URL format',
          debugInfo,
          actualStart: profileImage.substring(0, 200)
        });
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Test successful',
      debugInfo 
    });
    
  } catch (error) {
    console.error('Test upload error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}