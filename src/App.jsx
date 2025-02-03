import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import './App.css';

function App() {
  const [spotifyLink, setSpotifyLink] = useState('');
  const [collageTracks, setCollageTracks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('http://localhost:5000/auth/me', { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (window.location.pathname === '/auth/success') {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/spotify/collage');
        if (!response.ok) throw new Error('Failed to fetch collage');
        const data = await response.json();
        console.log("Collage Tracks Data:", data); // Debugging log
        setCollageTracks(data);
      } catch (error) {
        console.error('Error fetching collage tracks:', error);
      }
    };
    fetchData();
  }, []);
  

  const handleLogout = async () => {
    await fetch('http://localhost:5000/auth/logout', { method: 'GET', credentials: 'include' });
    setUser(null);
    navigate('/');
  };

  const handleSaveTrack = async () => {
    if (!user) {
      alert('Please log in to submit a track.');
      return;
    }
    if (!spotifyLink.trim()) {
      alert('Please enter a valid Spotify track link.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/spotify/save-track', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackLink: spotifyLink,
          userId: user.spotifyId,
          displayName: user.displayName,
        }),
      });
      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.error || 'Failed to save track');
      }
      const result = await response.json();
      alert(result.message);
      setCollageTracks([...collageTracks, result.track]);
    } catch (error) {
      console.error('Error saving track:', error);
      alert(`Failed to save track: ${error.message}`);
    }
  };

  const handleDeleteTrack = async () => {
    if (!user) {
      alert('Please log in to delete a track.');
      return;
    }
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete your track for today?');
      if (!confirmDelete) return;

      const response = await fetch(`http://localhost:5000/spotify/delete-track/${user.spotifyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete track');
      }
      const result = await response.json();
      alert(result.message);
      setCollageTracks((prevTracks) =>
        prevTracks.map((group) => ({
          ...group,
          tracks: group.tracks.filter((track) => track.userId !== user.spotifyId),
        }))
      );
    } catch (error) {
      console.error('Error deleting track:', error);
      alert(`Failed to delete track: ${error.message}`);
    }
  };

  return (
    <div>
      <Header />
      <div className="auth-container">
        {loading ? (
          <p>Loading...</p>
        ) : user ? (
          <div className="user-profile">
            <img src={user.profileImage} alt="Profile" className="profile-pic" />
            <p>Welcome, {user.displayName}!</p>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button onClick={() => (window.location.href = 'http://localhost:5000/auth/login')}>
            Login with Spotify
          </button>
        )}
      </div>
      <div className="track-submission">
        <h2>Insert a Spotify Track Link</h2>
        <input
          type="text"
          placeholder="Spotify track link"
          value={spotifyLink}
          onChange={(e) => setSpotifyLink(e.target.value)}
        />
        <button onClick={handleSaveTrack}>Save Track</button>
        <button onClick={handleDeleteTrack}>Delete Track</button>

      </div>
      <h2>Student Picks</h2>
      <div className="collage-container">
        {Array.isArray(collageTracks) && collageTracks.length > 0 ? (
          collageTracks.map((group) =>
            group && group._id ? (
              <div key={group._id} className="date-group">
                <h3>{group._id}</h3>
                <div className="track-grid">
                  {Array.isArray(group.tracks) &&
                    group.tracks.map((track, index) => (
                      <div key={index} className="track-item">
                        <a href={`https://open.spotify.com/track/${track.trackId}`} target="_blank" rel="noopener noreferrer">
                          <img src={track.albumCover} alt={`Track ${track.trackName}`} className="track-image" />
                        </a>
                        <p><strong>{track.trackName}</strong> by {track.artistName}</p>
                        <p><em>Submitted by: {track.displayName}</em></p>
                      </div>
                    ))}
                </div>
              </div>
            ) : null
          )
        ) : (
          <p>No tracks submitted yet.</p>
        )}
      </div>
    </div>
  );
}

export default App;
