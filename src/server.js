import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

import spotifyRouter from '../backend/routes/spotify.js';
import authRoutes from '../backend/routes/authRoutes.js';

const app = express();
const port = process.env.PORT || 5000;

// Environment variable check
if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
  console.error('Spotify credentials are not set in .env file');
  process.exit(1);
}

// Middleware
app.use(cors({origin: true,credentials: true}));
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
