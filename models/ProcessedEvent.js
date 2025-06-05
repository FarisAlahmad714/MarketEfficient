import mongoose from 'mongoose';

const processedEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  processedAt: {
    type: Date,
    default: Date.now,
    expires: '7d', // Optional: Automatically delete records older than 7 days
  },
});

export default mongoose.models.ProcessedEvent || mongoose.model('ProcessedEvent', processedEventSchema); 