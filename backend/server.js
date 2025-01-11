require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const moment = require('moment');

const spotifyRouter = require('./routes/spotify');
const Track = require('./models/Track');

const app = express();
const port = 5000;

if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
  console.error('Spotify credentials are not set in .env file');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use('/', spotifyRouter);

// Save track details along with user ID
app.post('/api/spotify/save-track', async (req, res) => {
  const { trackName, trackId, artistName, albumCover, userId, replace } = req.body;

  if (!trackName || !trackId || !artistName || !albumCover || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    // Check if a track already exists for the user today
    const existingTrack = await Track.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingTrack) {
      if (!replace) {
        return res.status(200).json({
          message: 'A track for today already exists.',
          existingTrack,
        });
      }

      // Replace the existing track if the user opts to do so
      existingTrack.trackName = trackName;
      existingTrack.trackId = trackId;
      existingTrack.artistName = artistName;
      existingTrack.albumCover = albumCover;
      existingTrack.date = new Date(); // Update date to current time
      await existingTrack.save();

      return res.status(200).json({
        message: 'Track replaced successfully.',
        track: existingTrack,
      });
    }

    // If no track exists, create a new one
    const newTrack = new Track({
      trackName,
      trackId,
      artistName,
      albumCover,
      userId,
      date: new Date(),
    });

    await newTrack.save();
    res.status(201).json({ message: 'Track saved successfully.', track: newTrack });
  } catch (error) {
    console.error('Error saving track:', error);
    res.status(500).json({ error: 'Failed to save track' });
  }
});

// Fetch recent collage tracks
app.get('/api/spotify/collage', async (req, res) => {
    try {
      const tracks = await Track.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, // Group by date
            tracks: {
              $push: {
                trackName: '$trackName',
                trackId: '$trackId',
                artistName: '$artistName',
                albumCover: '$albumCover',
                userId: '$userId',
                date: '$date',
              },
            },
          },
        },
        { $sort: { _id: -1 } }, // Sort by date descending
      ]);
  
      res.json(tracks);
    } catch (error) {
      console.error('Error fetching collage tracks:', error);
      res.status(500).json({ error: 'Failed to fetch collage tracks' });
    }
  });

  app.delete('/api/spotify/delete-track', async (req, res) => {
    const { userId } = req.body;
  
    if (!userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
  
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
  
      // Find and delete the user's track for the current day
      const deletedTrack = await Track.findOneAndDelete({
        userId,
        date: { $gte: startOfDay, $lte: endOfDay },
      });
  
      if (!deletedTrack) {
        return res.status(404).json({ message: 'No track found for the user today.' });
      }
  
      res.status(200).json({ message: 'Track deleted successfully.', deletedTrack });
    } catch (error) {
      console.error('Error deleting track:', error);
      res.status(500).json({ error: 'Failed to delete track' });
    }
  });

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  })
  .catch(error => console.error(error));
