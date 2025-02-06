import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

import User from '../models/User.js';

const router = express.Router();
router.use(cookieParser()); // Parse cookies

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// Route to redirect users to Spotify login
router.get('/login', (req, res) => {
  const scope = 'user-read-email user-read-private';

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_REDIRECT_URI) {
    return res.status(500).json({ error: 'Missing Spotify environment variables' });
  }

  const authUrl = `${SPOTIFY_AUTH_URL}?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    process.env.SPOTIFY_REDIRECT_URI
  )}&scope=${encodeURIComponent(scope)}`;

  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  const { code } = req.query;
  console.log('Spotify Callback Received. Code:', code);

  if (!code) return res.status(400).json({ error: 'Authorization code not provided' });

  try {
    if (
      !process.env.SPOTIFY_CLIENT_ID ||
      !process.env.SPOTIFY_CLIENT_SECRET ||
      !process.env.SPOTIFY_REDIRECT_URI
    ) {
      throw new Error('Missing Spotify OAuth environment variables');
    }

    console.log('Requesting access token...');

    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    const response = await axios.post(SPOTIFY_TOKEN_URL, data.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    console.log('Access token received:', response.data.access_token);

    const { access_token, refresh_token } = response.data;

    // Fetch user info from Spotify
    console.log('Fetching Spotify user profile...');
    const userProfile = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id, display_name, email, images } = userProfile.data;
    console.log('User info received:', id, display_name, email);

    // Find or create user in MongoDB
    let user = await User.findOne({ spotifyId: id });

    if (user) {
      user.displayName = display_name;
      user.email = email;
      user.profileImage = images.length ? images[0].url : '';
      user.accessToken = access_token;
      user.refreshToken = refresh_token;
    } else {
      user = new User({
        spotifyId: id,
        displayName: display_name,
        email: email,
        profileImage: images.length ? images[0].url : '',
        accessToken: access_token,
        refreshToken: refresh_token,
      });
    }

    await user.save();

    console.log('User saved in database:', user);

    // Generate JWT token
    const token = jwt.sign(
      { spotifyId: id, displayName: display_name, profileImage: images.length ? images[0].url : '' },
      process.env.SESSION_SECRET,
      { expiresIn: '7d' }
    );

    // Store token in cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log('Authentication successful, redirecting to frontend...');
    res.redirect(`${FRONTEND_URL}`);
  } catch (error) {
    console.error('Authentication error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/login?error=authentication_failed`);
  }
});

router.get('/me', (req, res) => {
  const token = req.cookies?.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    res.json(decoded);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  });
  res.json({ message: 'Logged out successfully' });
});

export default router;
