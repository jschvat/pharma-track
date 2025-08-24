import React from 'react';
import PharmaDropdown from './common/PharmaDropdown';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSwitcher = () => {
  const { currentTheme, changeTheme, getCurrentTheme, availableThemes } = useTheme();

  const handleThemeChange = (themeValue) => {
    changeTheme(themeValue);
  };

  const currentThemeLabel = getCurrentTheme()?.label || 'Default Bootstrap';

  return (
    <PharmaDropdown
      label={`Theme: ${currentThemeLabel}`}
      trigger="click"
      variant="nav"
      className="me-2"
      pharmaType="pill"
    >
      {availableThemes.map((theme) => (
        <button
          key={theme.value}
          className={`dropdown-item ${currentTheme === theme.value ? 'active' : ''}`}
          onClick={() => handleThemeChange(theme.value)}
        >
          {theme.label}
        </button>
      ))}
    </PharmaDropdown>
  );
};

export default ThemeSwitcher;