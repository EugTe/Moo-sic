const axios = require('axios');
const User = require('../models/User');

async function refreshAccessToken(user) {
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token: user.refreshToken,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.data.access_token) {
      user.accessToken = response.data.access_token;
      await user.save();
      return response.data.access_token;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }

  return null;
}

module.exports = refreshAccessToken;
