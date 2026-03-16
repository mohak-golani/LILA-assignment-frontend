import React from 'react';
import './TopNav.css';

const TopNav: React.FC = () => {
  return (
    <header className="top-nav-container">
      <div className="top-nav-left">
        <div className="logo-section">
          <div className="logo-icon"></div>
          <div className="logo-text">LILA</div>
        </div>
        <div className="dashboard-title">
          DASHBOARD
        </div>
      </div>
    </header>
  );
};

export default TopNav;
