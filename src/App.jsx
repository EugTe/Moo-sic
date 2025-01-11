import React, { useState, useEffect } from 'react';
import { extractTrackId, fetchTrackDetails, saveTrack, deleteTrack, fetchCollageTracks } from './api';
import Header from './Header';
import './App.css';

function App() {
  const [spotifyLink, setSpotifyLink] = useState('');
  const [trackDetails, setTrackDetails] = useState(null);
  const [collageTracks, setCollageTracks] = useState([]);
  const [userId, setUserId] = useState('');

  const handleFetchTrackDetails = async () => {
    if (spotifyLink.toLowerCase() === 'delete') {
      if (!userId) {
        alert('Please enter your username to delete your track.');
        return;
      }
  
      try {
        if (window.confirm('Are you sure you want to delete your track for today?')) {
          const response = await deleteTrack(userId);
          alert(response.message);
        }
      } catch (error) {
        console.error('Error deleting track:', error);
        alert(error.message || 'Failed to delete track.');
      }
      return;
    }
  
    const trackId = extractTrackId(spotifyLink);
    if (!trackId) {
      alert('Invalid Spotify link');
      return;
    }
  
    try {
      const trackData = await fetchTrackDetails(trackId);
      setTrackDetails(trackData);
  
      // Save track details
      const saveResponse = await saveTrack(trackData, userId, trackId, false);
      if (saveResponse.existingTrack) {
        const userChoice = window.confirm(
          'You already have a track saved for today. Do you want to replace it?'
        );
  
        
        if (userChoice) {
          const replaceResponse = await saveTrack(trackData, userId, trackId, true); // Pass 'true' here
          alert(replaceResponse.message);
        } else {
          alert('Track not replaced.');
        }
      } else {
        alert(saveResponse.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to fetch or save track details');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tracks = await fetchCollageTracks();
        setCollageTracks(tracks);
      } catch (error) {
        console.error('Error fetching collage tracks:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <Header />
      <h2>Insert a Spotify track Link along with your username</h2>
      <h3>To delete, enter 'delete' in the track link box. If you want to replace a submission, just enter the new track link as usual</h3>
      <input
        type="text"
        placeholder="Spotify track link"
        value={spotifyLink}
        onChange={(e) => setSpotifyLink(e.target.value)}
      />
      <input
        type="text"
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <button onClick={handleFetchTrackDetails}>Save Track</button>

      {trackDetails && (
        <div>
          <h3>Track Details</h3>
          <img src={trackDetails.albumCover} alt="Album Cover" style={{ width: '200px' }} />
          <p><strong>Track:</strong> {trackDetails.trackName}</p>
          <p><strong>Artist:</strong> {trackDetails.artistName}</p>
        </div>
      )}

      <h2>Student Picks</h2>
      <div className="collage-container">
        {collageTracks.map((group) => (
          <div key={group._id} className="date-group">
            <h3>{group._id}</h3> {/* Display the date */}
            <div className="track-grid">
              {group.tracks.map((track, index) => (
                <div key={index} className="track-item">
                  <a href={`https://open.spotify.com/track/${track.trackId}`} target="_blank" rel="noopener noreferrer" size="">
                    <img
                      src={track.albumCover}
                      alt={`Track ${track.trackName}`}
                      className="track-image"
                      title={`Track: ${track.trackName}\nArtist: ${track.artistName}\nSubmitted by: ${track.userId}`}
                    />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
