import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { ThemeProvider, useTheme } from './src/core/contexts/ThemeContext';
import { HabitProvider } from './src/core/contexts/HabitContext';
import MainNavigator from './src/navigation/MainNavigator';

const AppContent = () => {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
      />
      <MainNavigator />
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <HabitProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </HabitProvider>
    </ThemeProvider>
  );
};

export default App;