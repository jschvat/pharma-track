import React from 'react';
import '../css/components.css';

const HamburgerMenu = ({ 
  onClick, 
  title = "Toggle Menu", 
  ariaLabel = "Toggle Menu",
  className = "",
  isOpen = false 
}) => {
  return (
    <button 
      className={`hamburger-menu ${className}`}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
    >
      <div className="hamburger-icon">
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </div>
    </button>
  );
};

export default HamburgerMenu;