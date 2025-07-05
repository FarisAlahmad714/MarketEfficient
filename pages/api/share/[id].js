// pages/api/share/[id].js
import dbConnect from '../../../lib/database';
import SharedContent from '../../../models/SharedContent';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Share ID is required' });
    }

    // Find the shared content by ID
    const sharedContent = await SharedContent.findOne({ shareId: id });

    if (!sharedContent) {
      return res.status(404).json({ error: 'Shared content not found' });
    }

    // Return the shared content data
    res.status(200).json({
      type: sharedContent.type,
      username: sharedContent.username,
      name: sharedContent.name,
      ...sharedContent.data,
      createdAt: sharedContent.createdAt
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}