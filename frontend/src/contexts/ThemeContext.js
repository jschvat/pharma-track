import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Available Bootswatch themes
export const AVAILABLE_THEMES = [
  { value: 'default', label: 'Default Bootstrap', css: null },
  { value: 'cerulean', label: 'Cerulean', css: 'cerulean/bootstrap.min.css' },
  { value: 'cosmo', label: 'Cosmo', css: 'cosmo/bootstrap.min.css' },
  { value: 'cyborg', label: 'Cyborg', css: 'cyborg/bootstrap.min.css' },
  { value: 'darkly', label: 'Darkly', css: 'darkly/bootstrap.min.css' },
  { value: 'flatly', label: 'Flatly', css: 'flatly/bootstrap.min.css' },
  { value: 'journal', label: 'Journal', css: 'journal/bootstrap.min.css' },
  { value: 'litera', label: 'Litera', css: 'litera/bootstrap.min.css' },
  { value: 'lumen', label: 'Lumen', css: 'lumen/bootstrap.min.css' },
  { value: 'lux', label: 'Lux', css: 'lux/bootstrap.min.css' },
  { value: 'materia', label: 'Materia', css: 'materia/bootstrap.min.css' },
  { value: 'minty', label: 'Minty', css: 'minty/bootstrap.min.css' },
  { value: 'morph', label: 'Morph', css: 'morph/bootstrap.min.css' },
  { value: 'pulse', label: 'Pulse', css: 'pulse/bootstrap.min.css' },
  { value: 'quartz', label: 'Quartz', css: 'quartz/bootstrap.min.css' },
  { value: 'sandstone', label: 'Sandstone', css: 'sandstone/bootstrap.min.css' },
  { value: 'simplex', label: 'Simplex', css: 'simplex/bootstrap.min.css' },
  { value: 'sketchy', label: 'Sketchy', css: 'sketchy/bootstrap.min.css' },
  { value: 'slate', label: 'Slate', css: 'slate/bootstrap.min.css' },
  { value: 'solar', label: 'Solar', css: 'solar/bootstrap.min.css' },
  { value: 'spacelab', label: 'Spacelab', css: 'spacelab/bootstrap.min.css' },
  { value: 'superhero', label: 'Superhero', css: 'superhero/bootstrap.min.css' },
  { value: 'united', label: 'United', css: 'united/bootstrap.min.css' },
  { value: 'vapor', label: 'Vapor', css: 'vapor/bootstrap.min.css' },
  { value: 'yeti', label: 'Yeti', css: 'yeti/bootstrap.min.css' },
  { value: 'zephyr', label: 'Zephyr', css: 'zephyr/bootstrap.min.css' }
];

// Available font families
export const AVAILABLE_FONTS = [
  { value: 'system', label: 'System Default', css: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { value: 'arial', label: 'Arial', css: 'Arial, sans-serif' },
  { value: 'helvetica', label: 'Helvetica', css: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { value: 'georgia', label: 'Georgia', css: 'Georgia, serif' },
  { value: 'times', label: 'Times New Roman', css: '"Times New Roman", Times, serif' },
  { value: 'courier', label: 'Courier New', css: '"Courier New", Courier, monospace' },
  { value: 'verdana', label: 'Verdana', css: 'Verdana, Geneva, sans-serif' },
  { value: 'trebuchet', label: 'Trebuchet MS', css: '"Trebuchet MS", Helvetica, sans-serif' },
  { value: 'palatino', label: 'Palatino', css: '"Palatino Linotype", "Book Antiqua", Palatino, serif' }
];

// Available font sizes
export const AVAILABLE_FONT_SIZES = [
  { value: 'small', label: 'Small (14px)', css: '14px' },
  { value: 'medium', label: 'Medium (16px)', css: '16px' },
  { value: 'large', label: 'Large (18px)', css: '18px' },
  { value: 'xlarge', label: 'Extra Large (20px)', css: '20px' }
];

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [fontFamily, setFontFamily] = useState('system');
  const [fontSize, setFontSize] = useState('medium');

  // Load theme and font settings from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('pharmatrak-theme');
    const savedFontFamily = localStorage.getItem('pharmatrak-font-family');
    const savedFontSize = localStorage.getItem('pharmatrak-font-size');
    
    if (savedTheme && AVAILABLE_THEMES.find(theme => theme.value === savedTheme)) {
      setCurrentTheme(savedTheme);
    }
    
    if (savedFontFamily && AVAILABLE_FONTS.find(font => font.value === savedFontFamily)) {
      setFontFamily(savedFontFamily);
    }
    
    if (savedFontSize && AVAILABLE_FONT_SIZES.find(size => size.value === savedFontSize)) {
      setFontSize(savedFontSize);
    }
  }, []);

  // Apply theme when currentTheme changes
  useEffect(() => {
    const theme = AVAILABLE_THEMES.find(t => t.value === currentTheme);
    const head = document.head;
    
    // Remove existing theme link
    const existingLink = document.getElementById('bootswatch-theme');
    if (existingLink) {
      existingLink.remove();
    }

    // Add new theme link if not default
    if (theme && theme.css) {
      const link = document.createElement('link');
      link.id = 'bootswatch-theme';
      link.rel = 'stylesheet';
      link.href = `https://cdn.jsdelivr.net/npm/bootswatch@5.3.7/dist/${theme.css}`;
      head.appendChild(link);
    }

    // Save to localStorage
    localStorage.setItem('pharmatrak-theme', currentTheme);
  }, [currentTheme]);

  // Apply font settings when they change
  useEffect(() => {
    const font = AVAILABLE_FONTS.find(f => f.value === fontFamily);
    const size = AVAILABLE_FONT_SIZES.find(s => s.value === fontSize);
    
    // Remove existing font style
    const existingStyle = document.getElementById('pharmatrak-font-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new font style
    const style = document.createElement('style');
    style.id = 'pharmatrak-font-style';
    style.textContent = `
      :root {
        --pharmatrak-font-family: ${font ? font.css : 'inherit'};
        --pharmatrak-font-size: ${size ? size.css : '16px'};
      }
      
      body, .navbar, .card, .modal, .form-control, .btn {
        font-family: var(--pharmatrak-font-family) !important;
        font-size: var(--pharmatrak-font-size) !important;
      }
      
      h1, h2, h3, h4, h5, h6 {
        font-family: var(--pharmatrak-font-family) !important;
      }
    `;
    document.head.appendChild(style);

    // Save to localStorage
    localStorage.setItem('pharmatrak-font-family', fontFamily);
    localStorage.setItem('pharmatrak-font-size', fontSize);
  }, [fontFamily, fontSize]);

  const changeTheme = (themeValue) => {
    setCurrentTheme(themeValue);
  };

  const changeFontFamily = (fontValue) => {
    setFontFamily(fontValue);
  };

  const changeFontSize = (sizeValue) => {
    setFontSize(sizeValue);
  };

  const getCurrentTheme = () => {
    return AVAILABLE_THEMES.find(theme => theme.value === currentTheme);
  };

  const getCurrentFont = () => {
    return AVAILABLE_FONTS.find(font => font.value === fontFamily);
  };

  const getCurrentFontSize = () => {
    return AVAILABLE_FONT_SIZES.find(size => size.value === fontSize);
  };

  const value = {
    currentTheme,
    fontFamily,
    fontSize,
    changeTheme,
    changeFontFamily,
    changeFontSize,
    getCurrentTheme,
    getCurrentFont,
    getCurrentFontSize,
    availableThemes: AVAILABLE_THEMES,
    availableFonts: AVAILABLE_FONTS,
    availableFontSizes: AVAILABLE_FONT_SIZES
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};