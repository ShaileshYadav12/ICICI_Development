import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('icici_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return 'dark'; // User explicitly requested dark theme #1E2230
    } catch (e) {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('icici_theme', theme);
    } catch (e) {}

    // Apply to document element for global CSS selector support
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-theme');
      root.setAttribute('data-theme', 'dark');
      document.body.style.backgroundColor = '#1E2230';
    } else {
      root.classList.remove('dark-theme');
      root.setAttribute('data-theme', 'light');
      document.body.style.backgroundColor = '#f5f5f5';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

