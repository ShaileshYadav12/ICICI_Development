import React from 'react';
import StrategiesPage from './components/StrategiesPage';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './App.css';

function MainApp() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className={`app-container ${isDark ? 'dark-theme' : ''}`}>
      {/* Floating Left Side Theme Toggle Button */}
      <button
        type="button"
        className="theme-toggle-floating-btn"
        onClick={toggleTheme}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
        aria-label="Toggle Theme"
      >
        <span className="theme-toggle-icon">
          {isDark ? (
            /* Sun Icon when dark */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFAC33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            /* Moon Icon when light */
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </span>
        <span>{isDark ? 'Light Mode' : 'Dark Mode (#1E2230)'}</span>
      </button>

      <div className="app-content">
        <StrategiesPage />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
