
const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  trackName: { type: String, required: true },
  trackId: { type: String, required: true },
  artistName: { type: String, required: true },
  albumCover: { type: String, required: true },
  date: { type: Date, default: Date.now },
  userId: { type: String, required: true },
  displayName: { type: String, required: true },

  likes: { type: [String], default: [] },
});

trackSchema.index({ userId: 1, trackName: 1 }, { unique: true });


module.exports = mongoose.model('Track', trackSchema);
