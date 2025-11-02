import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useColorScheme } from 'react-native';
import StorageService from '../services/storage/StorageService';
import { lightTheme, darkTheme } from '../../config/theme';
import { THEME_MODES } from '../../config/constants';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(THEME_MODES.SYSTEM);
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when system theme changes
  useEffect(() => {
    if (themeMode === THEME_MODES.SYSTEM) {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, themeMode]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await StorageService.getThemeMode();
      if (savedTheme) {
        setThemeMode(savedTheme);
        if (savedTheme === THEME_MODES.SYSTEM) {
          setIsDarkMode(systemColorScheme === 'dark');
        } else {
          setIsDarkMode(savedTheme === THEME_MODES.DARK);
        }
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = useCallback(async (mode) => {
    try {
      await StorageService.saveThemeMode(mode);
      setThemeMode(mode);

      if (mode === THEME_MODES.SYSTEM) {
        setIsDarkMode(systemColorScheme === 'dark');
      } else {
        setIsDarkMode(mode === THEME_MODES.DARK);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }, [systemColorScheme]);

  const theme = useMemo(() => ({
    ...(isDarkMode ? darkTheme : lightTheme),
    isDark: isDarkMode,
  }), [isDarkMode]);

  const value = useMemo(() => ({
    theme,
    themeMode,
    isDarkMode,
    toggleTheme,
  }), [theme, themeMode, isDarkMode, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};