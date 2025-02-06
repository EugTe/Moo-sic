// server.js - Main entry point for the backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Import routes
const spotifyRouter = require('./routes/spotify');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 5000;

// Environment variable check
if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
  console.error('Spotify credentials are not set in .env file');
  process.exit(1);
}

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Load routes
app.use('/spotify', spotifyRouter);
app.use('/auth', authRoutes);

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    const serverUrl = process.env.FRONTEND_URL || `http://localhost:${port}`;
    app.listen(port, () => console.log(`Server running on ${serverUrl}`));
  })
  .catch(error => console.error('MongoDB connection error:', error));
