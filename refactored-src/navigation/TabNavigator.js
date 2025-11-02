import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../core/contexts/ThemeContext';

// Import screens
import HomeScreen from '../features/habits/screens/HomeScreen';
import AllHabitsScreen from '../features/habits/screens/AllHabitsScreen';
// import StatsScreen from '../features/stats/screens/StatsScreen';
// import SettingsScreen from '../features/settings/screens/SettingsScreen';
// import CreateHabitScreen from '../features/habits/screens/CreateHabitScreen';

const Tab = createBottomTabNavigator();

// Custom Tab Bar Button for center "Add" button
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

const TabNavigator = () => {
  const { theme } = useTheme();

  return (
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
    {/*  <Tab.Screen*/}
    {/*    name="CreateHabitTab"*/}
    {/*    component={CreateHabitScreen}*/}
    {/*    options={{*/}
    {/*      tabBarIcon: ({ color, size }) => (*/}
    {/*        <Icon name="plus" size={32} color="#fff" />*/}
    {/*      ),*/}
    {/*      tabBarButton: (props) => (*/}
    {/*        <CustomTabBarButton {...props} />*/}
    {/*      ),*/}
    {/*    }}*/}
    {/*    listeners={({ navigation }) => ({*/}
    {/*      tabPress: (e) => {*/}
    {/*        e.preventDefault();*/}
    {/*        navigation.navigate('CreateHabit');*/}
    {/*      },*/}
    {/*    })}*/}
    {/*  />*/}
    {/*  <Tab.Screen*/}
    {/*    name="Stats"*/}
    {/*    component={StatsScreen}*/}
    {/*    options={{*/}
    {/*      tabBarIcon: ({ color, size }) => (*/}
    {/*        <Icon name="chart-bar" size={size} color={color} />*/}
    {/*      ),*/}
    {/*    }}*/}
    {/*  />*/}
    {/*  <Tab.Screen*/}
    {/*    name="Settings"*/}
    {/*    component={SettingsScreen}*/}
    {/*    options={{*/}
    {/*      tabBarIcon: ({ color, size }) => (*/}
    {/*        <Icon name="cog" size={size} color={color} />*/}
    {/*      ),*/}
    {/*    }}*/}
    {/*  />*/}
    </Tab.Navigator>
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});

export default TabNavigator;


