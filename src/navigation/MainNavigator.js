import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';

// Import modal screens
import CreateHabitScreen from '../features/habits/screens/CreateHabitScreen';
import HabitDetailScreen from '../features/habits/screens/HabitDetailScreen';
import ChooseIconScreen from '../features/habits/screens/ChooseIconScreen';
import NoteScreen from '../features/notes/screens/NoteScreen';
import AllNotePage from '../features/notes/screens/AllNotePage';

const Stack = createStackNavigator();

const MainNavigator = () => {
  return (
    <Stack.Navigator
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
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="CreateHabit" component={CreateHabitScreen} />
      <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
      <Stack.Screen name="ChooseIcon" component={ChooseIconScreen} />
      <Stack.Screen name="Note" component={NoteScreen} />
      <Stack.Screen name="AllNotes" component={AllNotePage} />
    </Stack.Navigator>
  );
};

export default MainNavigator;