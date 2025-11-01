import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HabitProvider, HabitContext } from './src/contexts/HabitContext';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import AllHabitsScreen from './src/screens/AllHabitsScreen';
import StatsScreen from './src/screens/StatsScreen';
import CreateHabitScreen from './src/screens/CreateHabitScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HabitDetailScreen from './src/screens/HabitDetailScreen';
import ChooseIconImage from './src/screens/ChooseIconImage';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Button for the center "Add" button
const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={styles.customButton}
    onPress={onPress}
  >
    <View style={styles.customButtonInner}>
      {children}
    </View>
  </TouchableOpacity>
);

// Bottom Tab Navigator
const TabNavigator = () => {
  return (
    <HabitContext.Consumer>
      {({ theme }) => (
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: theme.isDark ? '#1F2937' : '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: theme.border,
              height: 70,
              paddingBottom: 10,
              paddingTop: 10,
            },
            tabBarActiveTintColor: '#42A5F5',
            tabBarInactiveTintColor: theme.textMuted,
            tabBarShowLabel: false,
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon name="home" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="AllHabits"
            component={AllHabitsScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon name="format-list-bulleted" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="CreateHabitTab"
            component={CreateHabitScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon name="plus" size={32} color="#fff" />
              ),
              tabBarButton: (props) => (
                <CustomTabBarButton {...props} />
              ),
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                e.preventDefault();
                navigation.navigate('CreateHabit');
              },
            })}
          />
          <Tab.Screen
            name="Stats"
            component={StatsScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon name="chart-bar" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon name="cog" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      )}
    </HabitContext.Consumer>
  );
};

// Main Stack Navigator
const MainStack = () => {
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
      <Stack.Screen name="ChooseIconImage" component={ChooseIconImage} />
    </Stack.Navigator>
  );
};

// App Component with Theme-aware StatusBar
const AppContent = () => {
  return (
    <HabitContext.Consumer>
      {({ theme }) => (
        <>
          <StatusBar
            backgroundColor={theme.background}
            barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          />
          <MainStack />
        </>
      )}
    </HabitContext.Consumer>
  );
};

const App = () => {
  return (
    <HabitProvider>
      <NavigationContainer>
        <AppContent />
      </NavigationContainer>
    </HabitProvider>
  );
};

const styles = StyleSheet.create({
  customButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#42A5F5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});

export default App;