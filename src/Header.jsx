import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="header">
    <img src="\src\assets\cowLogo.png" alt="App Logo" className="logo" />
      <div className="header-content">
        <div className="header-text">
          <h1>Mooooo-sic Today</h1>
          <p>
            Save your favorite tracks and explore music shared by others into a daily collage! Hover over album covers for details and click to listen on Spotify!
          </p>
        </div>
      </div>
    </header>
  );
}

export default Header;
