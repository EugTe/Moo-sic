// Fixed spotify.js
const express = require('express');
const axios = require('axios');
const router = express.Router();


// Function to extract track ID from Spotify URL
function extractTrackId(spotifyUrl) {
  const regex = /(?:track\/|spotify:track:)([a-zA-Z0-9]{22})/;
  const match = spotifyUrl.match(regex);
  return match ? match[1] : null;
}

router.get('/track-details', async (req, res) => {
  const { trackId } = req.query;

  if (!trackId) {
    return res.status(400).json({ error: 'Invalid or missing track ID' });
  }

  try {
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

    const trackResponse = await axios.get(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { name, artists, album } = trackResponse.data;
    res.json({
      trackName: name,
      artistName: artists.map((artist) => artist.name).join(', '),
      albumCover: album.images[0]?.url,
    });
  } catch (error) {
    console.error('Error fetching track details:', error);
    res.status(500).json({ error: error.response?.data || 'Failed to fetch track details' });
  }
});

module.exports = router;
