import React from 'react';
import { NavDropdown } from 'react-bootstrap';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSwitcher = () => {
  const { currentTheme, changeTheme, getCurrentTheme, availableThemes } = useTheme();

  const handleThemeChange = (themeValue) => {
    changeTheme(themeValue);
  };

  const currentThemeLabel = getCurrentTheme()?.label || 'Default Bootstrap';

  return (
    <NavDropdown 
      title={`Theme: ${currentThemeLabel}`} 
      id="theme-switcher-dropdown"
      className="me-2"
    >
      {availableThemes.map((theme) => (
        <NavDropdown.Item
          key={theme.value}
          active={currentTheme === theme.value}
          onClick={() => handleThemeChange(theme.value)}
        >
          {theme.label}
        </NavDropdown.Item>
      ))}
    </NavDropdown>
  );
};

export default ThemeSwitcher;