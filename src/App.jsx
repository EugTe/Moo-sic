// app.jsx
import "./index.css";
import { useState, useEffect, useCallback } from "react";
import Header from "./Header";


// Use Vite environment variable or fallback to localhost.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [spotifyLink, setSpotifyLink] = useState("");
  const [collageTracks, setCollageTracks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userTrack, setUserTrack] = useState(null);

  const refreshUserTrack = useCallback(async () => {
    console.log(API_URL);
    if (!user) return;
    try {
      const response = await fetch(
        `${API_URL}/spotify/user-track?userId=${user.spotifyId}`,
        { credentials: "include" }
      );
      if (response.ok) {
        const trackData = await response.json();
        setUserTrack(trackData);
      } else {
        setUserTrack(null);
      }
    } catch (error) {
      console.error("Error refreshing user track:", error);
    }
  }, [user]);

  const refreshCollage = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/spotify/collage`);
      if (!response.ok) throw new Error("Failed to fetch collage");
      const data = await response.json();
      setCollageTracks(data);
    } catch (error) {
      console.error("Error fetching collage tracks:", error);
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    refreshUserTrack();
  }, [refreshUserTrack]);

  useEffect(() => {
    refreshCollage();
  }, [refreshCollage]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "GET",
        credentials: "include",
      });
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleSaveTrack = async () => {
    if (!user) {
      alert("Please log in to submit a track.");
      return;
    }
    if (!spotifyLink.trim()) {
      alert("Please enter a valid Spotify track link.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/spotify/save-track`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackLink: spotifyLink,
          userId: user.spotifyId,
          displayName: user.displayName,
        }),
      });
      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.error || "Failed to save track");
      }
      const result = await response.json();
      alert(result.message);
      setSpotifyLink("");
      refreshCollage();
      refreshUserTrack();
    } catch (error) {
      console.error("Error saving track:", error);
      alert(`Failed to save track: ${error.message}`);
    }
  };

  const handleDeleteTrack = async () => {
    if (!user) {
      alert("Please log in to delete a track.");
      return;
    }
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete your track for today?"
      );
      if (!confirmDelete) return;
      const response = await fetch(
        `${API_URL}/spotify/delete-track/${user.spotifyId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete track");
      }
      const result = await response.json();
      alert(result.message);
      refreshCollage();
      refreshUserTrack();
    } catch (error) {
      console.error("Error deleting track:", error);
      alert(`Failed to delete track: ${error.message}`);
    }
  };

  // Function to handle liking/unliking a track
  const handleLikeTrack = async (trackId) => {
    if (!user) {
      alert("Please log in to like tracks.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/spotify/like-track`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId,
          userId: user.spotifyId,
        }),
      });
      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.error || "Failed to update like");
      }
      const result = await response.json();
      console.log(result.message);
      // Refresh the collage to update like counts
      refreshCollage();
    } catch (error) {
      console.error("Error liking track:", error);
      alert("Error updating like");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-black to-spotify-green">
      <Header user={user} onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-8">
        {/* Share Your Track Card */}
        <div className="mb-8 bg-white/10 backdrop-blur-md text-white p-6 rounded">
          <h2 className="text-2xl font-bold text-center mb-4">
            Share Your Track
          </h2>
          <p className="text-gray-300 mb-4 text-center">
            Paste a Spotify track link below and share your pick for today.
          </p>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Spotify track link"
              value={spotifyLink}
              onChange={(e) => setSpotifyLink(e.target.value)}
              className="flex-grow bg-white/20 text-white placeholder-gray-400 border-none p-2 rounded"
            />
            <button
              onClick={handleSaveTrack}
              className="bg-spotify-green hover:bg-spotify-green/80 px-4 py-2 rounded"
            >
              Save Track
            </button>
            <button
              onClick={handleDeleteTrack}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Your Track for Today Card */}
        <div className="mb-8 bg-white/10 backdrop-blur-md text-white p-6 rounded">
          <h2 className="text-2xl font-bold text-center mb-4">
            Your Track for Today
          </h2>
          {userTrack ? (
            <div className="flex items-center space-x-4">
              <img
                src={userTrack.albumCover || "/placeholder.svg"}
                alt={userTrack.trackName}
                className="w-24 h-24 rounded-md shadow-lg"
              />
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {userTrack.trackName}
                </h3>
                <p className="text-gray-300 mb-4">
                  by {userTrack.artistName}
                </p>
                <a
                  href={`https://open.spotify.com/track/${userTrack.trackId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-spotify-green hover:bg-spotify-green/80 text-white font-bold py-2 px-4 rounded transition duration-300 inline-block"
                >
                  Listen on Spotify
                </a>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-300">
              No track submitted yet.
            </p>
          )}
        </div>

        {/* Student Picks Card */}
        <div className="bg-white/10 backdrop-blur-md text-white p-6 rounded">
          <h2 className="text-2xl font-bold text-center mb-4">
            Student Picks
          </h2>
          {Array.isArray(collageTracks) && collageTracks.length > 0 ? (
            collageTracks.map((group) =>
              group && group._id ? (
                <div key={group._id} className="mb-8">
                  <h3 className="text-xl font-semibold mb-4 text-center">
                    {group._id}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.isArray(group.tracks) &&
                      group.tracks.map((track, index) => (
                        <div
                          key={index}
                          className="bg-white/20 rounded-lg p-4 text-center transition-all duration-300 hover:bg-white/30 hover:scale-105"
                        >
                          <a
                            href={`https://open.spotify.com/track/${track.trackId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={track.albumCover || "/placeholder.svg"}
                              alt={`Track ${track.trackName}`}
                              className="w-full aspect-square object-cover mb-2 rounded-md shadow-md hover:shadow-lg transition duration-300"
                            />
                          </a>
                          <p className="font-semibold text-sm mb-1 truncate">
                            {track.trackName}
                          </p>
                          <p className="text-xs text-gray-300 mb-1 truncate">
                            by {track.artistName}
                          </p>
                          <p className="text-xs text-gray-400 italic flex items-center justify-center">
                            Submitted by:
                            <img
                              src={track.profileImage || "/placeholder.svg"}
                              alt={track.displayName}
                              className="w-4 h-4 rounded-full ml-1 mr-1"
                            />
                            <span className="truncate">{track.displayName}</span>
                          </p>
                          {/* Like Button */}
                          <div className="mt-2 flex items-center justify-center">
                            <button
                              onClick={() => handleLikeTrack(track.trackId)}
                              className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-500"
                            >
                              <span>❤️</span>
                              <span>{track.likeCount || 0}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null
            )
          ) : (
            <p className="text-center text-gray-300">
              No tracks submitted yet.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
