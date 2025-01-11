import axios from 'axios';

// Function to extract track ID from a Spotify URL
export const extractTrackId = (spotifyUrl) => {
  const regex = /(?:track\/|spotify:track:)([a-zA-Z0-9]{22})/;
  const match = spotifyUrl.match(regex);
  return match ? match[1] : null;
};

// Fetch track details from backend
export const fetchTrackDetails = async (trackId) => {
  try {
    const response = await axios.get(`http://localhost:5000/track-details?trackId=${trackId}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch track details');
  }
};

// Save track details to backend
export const saveTrack = async (trackData, userId, trackId, replace = false) => {
  try {
    const response = await axios.post('http://localhost:5000/api/spotify/save-track', {
      ...trackData,
      userId,
      trackId,
      replace,
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to save track');
  }
};

// Delete a track for the user
export const deleteTrack = async (userId) => {
  try {
    const response = await axios.delete('http://localhost:5000/api/spotify/delete-track', {
      data: { userId },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete track');
  }
};

// Fetch collage tracks
export const fetchCollageTracks = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/spotify/collage');
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch collage tracks');
  }
};
