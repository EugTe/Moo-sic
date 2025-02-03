// routes/spotify.js - Handles Spotify track-related operations
const express = require('express');
const axios = require('axios');
const router = express.Router();
const Track = require('../models/Track');

// Function to extract track ID from Spotify URL
function extractTrackId(spotifyUrl) {
  const regex = /(?:track\/|spotify:track:)([a-zA-Z0-9]{22})/;
  const match = spotifyUrl.match(regex);
  return match ? match[1] : null;
}

// 🚀 Save or Replace Track Route
router.post('/save-track', async (req, res) => {
  const { trackLink, userId, displayName, replace } = req.body;

  if (!trackLink || !userId || !displayName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const trackId = extractTrackId(trackLink);
  if (!trackId) {
    return res.status(400).json({ error: 'Invalid Spotify link' });
  }

  try {
    // Fetch track details from Spotify API
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const token = tokenResponse.data.access_token;
    const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { name, artists, album } = trackResponse.data || {};
    if (!name || !artists || !album || !album.images || album.images.length === 0) {
      return res.status(400).json({ error: 'Invalid track data from Spotify API' });
    }

    const trackData = {
      trackName: name,
      trackId,
      artistName: artists.map((artist) => artist.name).join(', '),
      albumCover: album.images[0]?.url,
      userId,
      displayName,
    };

    // Check if a track already exists for this user today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingTrack = await Track.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingTrack) {
      if (!replace) {
        return res.status(200).json({ message: 'A track for today already exists.', existingTrack });
      }

      // Replace existing track
      Object.assign(existingTrack, trackData);
      await existingTrack.save();

      return res.status(200).json({ message: 'Track replaced successfully.', track: existingTrack });
    }

    // Save new track
    const newTrack = new Track(trackData);
    await newTrack.save();

    res.status(201).json({ message: 'Track saved successfully.', track: newTrack });
  } catch (error) {
    console.error('Error saving track:', error);
    res.status(500).json({ error: 'Failed to save track' });
  }
});

// 🚀 Delete Track Route
router.delete('/delete-track/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const deletedTrack = await Track.findOneAndDelete({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!deletedTrack) {
      return res.status(404).json({ message: 'No track found for today.' });
    }

    res.status(200).json({ message: 'Track deleted successfully.', deletedTrack });
  } catch (error) {
    console.error('Error deleting track:', error);
    res.status(500).json({ error: 'Failed to delete track' });
  }
});

router.get('/collage', async (req, res) => {
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
              displayName: '$displayName',
              date: '$date',
            },
          },
        },
      },
      { $sort: { _id: -1 } }, // Sort by latest date
    ]);
    
    console.log("Returning collage data:", tracks); // 🔍 Debugging
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching collage tracks:', error);
    res.status(500).json({ error: 'Failed to fetch collage tracks' });
  }
});


module.exports = router;
