// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import CreateHabitScreen from './src/screens/CreateHabitScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HabitDetailScreen from './src/screens/HabitDetailScreen';
import ChooseIconImage from './src/screens/ChooseIconImage';
import { HabitProvider } from './src/contexts/HabitContext';
import TestNotificationScreen from './src/screens/TestNotificationScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <HabitProvider>
      <NavigationContainer>
        <StatusBar backgroundColor="#1a1a1a" barStyle="light-content" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            cardStyleInterpolator: ({ current, layouts }) => ({
              cardStyle: {
                transform: [
                  {
                    translateY: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.height, 0],
                    }),
                  },
                ],
              },
            }),
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CreateHabit" component={CreateHabitScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
          <Stack.Screen name="ChooseIconImage" component={ChooseIconImage} />
          <Stack.Screen name="TestNotification" component={TestNotificationScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </HabitProvider>
  );
};

export default App;