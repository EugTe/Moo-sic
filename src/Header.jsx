// header.jsx

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Header({ user, onLogout }) {
  return (
    <header className="bg-spotify-black/80 backdrop-blur-md text-white py-4 sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <nav className="flex justify-between items-center">
          <a href="/" className="text-2xl font-bold text-spotify-green">
            Moo-Sic!
          </a>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <img
                  src={user.profileImage || "/placeholder.svg"}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm">{user.displayName}</span>
                <button
                  onClick={onLogout}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  window.location.href = `${API_URL}/auth/login`;
                }}
                className="bg-spotify-green hover:bg-spotify-green/80 text-white px-4 py-2 rounded"
              >
                Login with Spotify
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
