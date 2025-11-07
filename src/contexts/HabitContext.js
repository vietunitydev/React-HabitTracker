import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, useColorScheme } from 'react-native';
import NotificationService from '../services/NotificationService';

export const HabitContext = createContext();

export const HabitProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [habits, setHabits] = useState([]);
  const [timers, setTimers] = useState({});
  const [habitsLoaded, setHabitsLoaded] = useState(false);
  const [timersLoaded, setTimersLoaded] = useState(false);

  // Theme state: 'light', 'dark', or 'system'
  const [themeMode, setThemeMode] = useState('system');
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  const appState = useRef(AppState.currentState);
  const timerIntervals = useRef({});

  // Load theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme) {
          setThemeMode(savedTheme);
          if (savedTheme === 'system') {
            setIsDarkMode(systemColorScheme === 'dark');
          } else {
            setIsDarkMode(savedTheme === 'dark');
          }
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    loadThemePreference();
  }, []);

  // Update theme when system theme changes (only if in system mode)
  useEffect(() => {
    if (themeMode === 'system') {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, themeMode]);

  // Toggle theme function
  const toggleTheme = useCallback(async (mode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeMode(mode);

      if (mode === 'system') {
        setIsDarkMode(systemColorScheme === 'dark');
      } else {
        setIsDarkMode(mode === 'dark');
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }, [systemColorScheme]);

  // Theme colors based on style guide
  const theme = {
    // Backgrounds
    background: isDarkMode
      ? '#111827' // gray-900
      : '#F9FAFB', // gray-50
    backgroundSecondary: isDarkMode
      ? 'rgba(31, 41, 55, 0.5)' // gray-800/50
      : '#FFFFFF',
    backgroundTertiary: isDarkMode
      ? 'rgba(17, 24, 39, 0.3)' // gray-900/30
      : '#F9FAFB',
    card: isDarkMode
      ? 'rgba(31, 41, 55, 0.9)' // gray-800/50
      : '#FFFFFF',

    // Text
    text: isDarkMode ? '#FFFFFF' : '#111827', // white / gray-900
    textSecondary: isDarkMode ? '#D1D5DB' : '#374151', // gray-300 / gray-700
    textTertiary: isDarkMode ? '#9CA3AF' : '#4B5563', // gray-400 / gray-600
    textMuted: isDarkMode ? '#6B7280' : '#6B7280', // gray-500

    // Borders
    border: isDarkMode
      ? 'rgba(55, 65, 81, 0.5)' // gray-700/50
      : '#E5E7EB', // gray-200
    borderSecondary: isDarkMode
      ? '#1F2937' // gray-800
      : '#D1D5DB', // gray-300

    // Accent colors
    primary: '#8B5CF6', // purple-600
    primaryLight: '#A78BFA', // purple-400
    primaryDark: '#7C3AED', // purple-700
    blue: isDarkMode ? '#60A5FA' : '#2563EB', // blue-400 / blue-600
    cyan: isDarkMode ? '#22D3EE' : '#0891B2', // cyan-400 / cyan-600

    // Status colors
    success: '#10B981', // green-500
    error: '#EF4444', // red-500
    warning: '#F59E0B', // amber-500

    // Special
    isDark: isDarkMode,
  };

  // Initialize NotificationService
  useEffect(() => {
    NotificationService.setupNotificationHandlers();
    NotificationService.setHabitCompletedCallback((habitId) => {
      const today = formatDateLocal(new Date());
      toggleHabitCompletion(habitId, today);
    });
  }, []);

  const timersRef = useRef(timers);

  useEffect(() => {
    timersRef.current = timers;
  }, [timers]);

  // Save timer states whenever timers change (only after both habits and timers are loaded)
  useEffect(() => {
    if (habitsLoaded && timersLoaded) {
      saveTimerStates();
    }
  }, [timers, habitsLoaded, timersLoaded]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        if (timersLoaded) {
          saveTimerStates();
        }
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (habitsLoaded > 0) {
          restoreTimerStates();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [habitsLoaded, timersLoaded]);

  // Load initial data on app start
  useEffect(() => {
    const initialize = async () => {
      await loadHabits();
    };
    initialize();
  }, []);

  // Restore timers after habits are loaded
  useEffect(() => {
    if (habitsLoaded && habits.length >= 0) {
      restoreTimerStates();
    }
  }, [habitsLoaded]);

  const formatDateLocal = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseTimeToSeconds = (timeString) => {
    if (!timeString) return 0;
    const parts = timeString.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  };

  // Save timer states to AsyncStorage
  const saveTimerStates = async () => {
    try {
      const timerData = {};
      const currentTimers = timersRef.current;

      Object.keys(currentTimers).forEach(habitId => {
        const timer = currentTimers[habitId];
        timerData[habitId] = {
          ...timer,
          lastSaveTime: Date.now()
        };
      });

      await AsyncStorage.setItem('timerStates', JSON.stringify(timerData));
    } catch (error) {
      console.error('Error saving timer states:', error);
    }
  };

  // Restore timer states from AsyncStorage
  const restoreTimerStates = async () => {
    try {
      console.log('Attempting to restore timer states...');
      console.log('Current habits count:', habits.length);

      const timerData = await AsyncStorage.getItem('timerStates');
      if (!timerData) {
        console.log('No timer data found in storage');
        setTimersLoaded(true);
        return;
      }

      const parsedTimers = JSON.parse(timerData);
      console.log('Parsed timer data:', parsedTimers);

      const currentTime = Date.now();
      const restoredTimers = {};

      Object.keys(parsedTimers).forEach(habitId => {
        const savedTimer = parsedTimers[habitId];
        if (!savedTimer || !savedTimer.totalTime) {
          console.log(`Skipping timer for habit ${habitId}: no saved timer or total time`);
          return;
        }

        const habit = habits.find(h => h.id === habitId);
        if (!habit) {
          console.log(`Skipping timer for habit ${habitId}: habit not found`);
          return;
        }

        const totalSeconds = parseTimeToSeconds(habit.completionTime?.time);
        if (totalSeconds <= 0) {
          console.log(`Skipping timer for habit ${habitId}: no valid completion time`);
          return;
        }

        let newRemainingTime = savedTimer.remainingTime || totalSeconds;

        if (savedTimer.isRunning && savedTimer.lastSaveTime) {
          const elapsedSeconds = Math.floor((currentTime - savedTimer.lastSaveTime) / 1000);
          newRemainingTime = Math.max(0, savedTimer.remainingTime - elapsedSeconds);
          console.log(`Timer was running for habit ${habitId}. Elapsed: ${elapsedSeconds}s, Remaining: ${newRemainingTime}s`);
        }

        if (newRemainingTime > 0) {
          restoredTimers[habitId] = {
            totalTime: totalSeconds,
            remainingTime: newRemainingTime,
            isRunning: savedTimer.isRunning,
            startTime: savedTimer.isRunning ? Date.now() : savedTimer.startTime
          };

          if (savedTimer.isRunning) {
            console.log(`Starting timer interval for habit ${habitId}`);
            startTimerInterval(habitId, newRemainingTime);
          }
        } else if (savedTimer.isRunning) {
          console.log(`Timer completed for habit ${habitId} while app was closed`);
          handleTimerComplete(habitId);
        }
      });

      console.log('Restored timers:', restoredTimers);
      setTimers(restoredTimers);
      setTimersLoaded(true);
    } catch (error) {
      console.error('Error restoring timer states:', error);
      setTimersLoaded(true);
    }
  };

  // Start timer interval
  const startTimerInterval = (habitId, initialTime) => {
    if (timerIntervals.current[habitId]) {
      clearInterval(timerIntervals.current[habitId]);
    }

    timerIntervals.current[habitId] = setInterval(() => {
      setTimers(prev => {
        const timer = prev[habitId];
        if (!timer || !timer.isRunning) {
          clearInterval(timerIntervals.current[habitId]);
          delete timerIntervals.current[habitId];
          return prev;
        }

        const newRemainingTime = Math.max(0, timer.remainingTime - 1);

        if (newRemainingTime === 0) {
          handleTimerComplete(habitId);
          return {
            ...prev,
            [habitId]: {
              ...timer,
              remainingTime: 0,
              isRunning: false,
              startTime: null
            }
          };
        }

        return {
          ...prev,
          [habitId]: {
            ...timer,
            remainingTime: newRemainingTime
          }
        };
      });
    }, 1000);
  };

  // Handle timer completion
  const handleTimerComplete = (habitId) => {
    const today = formatDateLocal(new Date());

    if (timerIntervals.current[habitId]) {
      clearInterval(timerIntervals.current[habitId]);
      delete timerIntervals.current[habitId];
    }

    toggleHabitCompletion(habitId, today);

    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      NotificationService.showCompletionNotification(
        habit.name,
        'Timer completed! Great job!',
        habit.color
      );
    }

    setTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[habitId];
      return newTimers;
    });
  };

  // Load habits from AsyncStorage
  const loadHabits = useCallback(async () => {
    try {
      console.log('Loading habits from storage...');
      const habitsData = await AsyncStorage.getItem('habits');
      if (habitsData) {
        const parsedHabits = JSON.parse(habitsData);
        console.log('Loaded habits:', parsedHabits.length);
        setHabits(parsedHabits);
      } else {
        console.log('No habits found in storage');
      }
      setHabitsLoaded(true);
    } catch (error) {
      console.error('Error loading habits:', error);
      setHabitsLoaded(true);
    }
  }, []);

  // Save habits to AsyncStorage whenever they change
  useEffect(() => {
    if (habitsLoaded && habits.length >= 0) {
      AsyncStorage.setItem('habits', JSON.stringify(habits));
    }
  }, [habits, habitsLoaded]);

  const startTimer = useCallback((habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit?.completionTime?.enabled) return;

    const totalSeconds = parseTimeToSeconds(habit.completionTime.time);
    if (totalSeconds <= 0) return;

    setTimers(prev => ({
      ...prev,
      [habitId]: {
        totalTime: totalSeconds,
        remainingTime: totalSeconds,
        isRunning: true,
        startTime: Date.now()
      }
    }));

    startTimerInterval(habitId, totalSeconds);
  }, [habits]);

  const pauseTimer = useCallback((habitId) => {
    if (timerIntervals.current[habitId]) {
      clearInterval(timerIntervals.current[habitId]);
      delete timerIntervals.current[habitId];
    }

    setTimers(prev => {
      const timer = prev[habitId];
      if (!timer) return prev;

      return {
        ...prev,
        [habitId]: {
          ...timer,
          isRunning: false,
          startTime: null
        }
      };
    });
  }, []);

  const resumeTimer = useCallback((habitId) => {
    setTimers(prev => {
      const timer = prev[habitId];
      if (!timer || timer.remainingTime <= 0) return prev;

      return {
        ...prev,
        [habitId]: {
          ...timer,
          isRunning: true,
          startTime: Date.now()
        }
      };
    });

    const currentTimer = timers[habitId];
    if (currentTimer?.remainingTime > 0) {
      startTimerInterval(habitId, currentTimer.remainingTime);
    }
  }, [timers]);

  const resetTimer = useCallback((habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit?.completionTime?.enabled) return;

    const totalSeconds = parseTimeToSeconds(habit.completionTime.time);

    setTimers(prev => ({
      ...prev,
      [habitId]: {
        totalTime: totalSeconds,
        remainingTime: totalSeconds,
        isRunning: false,
        startTime: null
      }
    }));

    if (timerIntervals.current[habitId]) {
      clearInterval(timerIntervals.current[habitId]);
      delete timerIntervals.current[habitId];
    }
  }, [habits]);

  const completeEarly = useCallback((habitId) => {
    const today = formatDateLocal(new Date());

    if (timerIntervals.current[habitId]) {
      clearInterval(timerIntervals.current[habitId]);
      delete timerIntervals.current[habitId];
    }

    setTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[habitId];
      return newTimers;
    });

    toggleHabitCompletion(habitId, today);
  }, []);

  const getTimerState = useCallback((habitId) => {
    return timers[habitId] || null;
  }, [timers]);

  // Calculate current streak
  const calculateCurrentStreak = (completions, endDate) => {
    if (!completions || completions.length === 0) return 0;

    const sortedCompletions = completions
      .map(date => new Date(date))
      .sort((a, b) => b - a);

    const endDateTime = new Date(endDate);
    let streak = 0;
    let currentDate = new Date(endDateTime);

    for (let i = 0; i < sortedCompletions.length; i++) {
      const completionDate = sortedCompletions[i];
      const timeDiff = Math.abs(currentDate - completionDate);
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Add a new habit
  const addHabit = useCallback(async (newHabit) => {
    try {
      setHabits((prevHabits) => {
        const updatedHabits = [...prevHabits, newHabit];
        return updatedHabits;
      });

      if (newHabit.notification?.enabled) {
        await NotificationService.scheduleHabitReminder(newHabit);
        console.log('Notification scheduled for habit:', newHabit.name);
      }
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  }, []);

  // Update an existing habit
  const updateHabit = useCallback(async (updatedHabit) => {
    try {
      setHabits((prevHabits) =>
        prevHabits.map((habit) =>
          habit.id === updatedHabit.id ? { ...habit, ...updatedHabit } : habit
        )
      );

      await NotificationService.cancelHabitNotifications(updatedHabit.id);

      if (updatedHabit.notification?.enabled) {
        await NotificationService.scheduleHabitReminder(updatedHabit);
        console.log('Notification rescheduled for habit:', updatedHabit.name);
      }
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  }, []);

  // Toggle habit completion
  const toggleHabitCompletion = useCallback((habitId, date) => {
    setHabits((prevHabits) =>
      prevHabits.map((habit) => {
        if (habit.id !== habitId) return habit;

        const completionsPerDay = habit.completionsPerDay || 1;
        const currentCount = habit.completionCounts?.[date] || 0;
        let newCount;

        if (completionsPerDay === 1) {
          newCount = currentCount >= 1 ? 0 : 1;
        } else {
          newCount = currentCount >= completionsPerDay ? 0 : currentCount + 1;
        }

        const updatedCompletionCounts = {
          ...habit.completionCounts,
          [date]: newCount,
        };

        const completions = [...(habit.completions || [])];
        if (newCount === 0) {
          const dateIndex = completions.indexOf(date);
          if (dateIndex > -1) {
            completions.splice(dateIndex, 1);
          }
        } else if (newCount >= completionsPerDay && !completions.includes(date)) {
          completions.push(date);
        } else if (newCount < completionsPerDay && completions.includes(date)) {
          const dateIndex = completions.indexOf(date);
          completions.splice(dateIndex, 1);
        }

        return {
          ...habit,
          completionCounts: updatedCompletionCounts,
          completions,
        };
      })
    );
  }, []);

  // Archive a habit
  const archiveHabit = useCallback(async (habitId) => {
    try {
      setHabits((prevHabits) => prevHabits.filter((habit) => habit.id !== habitId));

      if (timerIntervals.current[habitId]) {
        clearInterval(timerIntervals.current[habitId]);
        delete timerIntervals.current[habitId];
      }

      setTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[habitId];
        return newTimers;
      });

      await NotificationService.cancelHabitNotifications(habitId);
      console.log('Cancelled notifications for archived habit:', habitId);
    } catch (error) {
      console.error('Error archiving habit:', error);
    }
  }, []);

  // Test notification functions
  const testNotification = useCallback(async () => {
    await NotificationService.testMessageNotification();
  }, []);

  const testScheduledNotification = useCallback(async () => {
    await NotificationService.testScheduledNotification();
  }, []);

  // Get habits for today
  const getTodayHabits = useCallback(() => {
    const today = formatDateLocal(new Date());
    return habits.filter(habit => {
      const todayCount = habit.completionCounts?.[today] || 0;
      const requiredCount = habit.completionsPerDay || 1;
      return todayCount < requiredCount;
    });
  }, [habits]);

  // Get habit completion status
  const getHabitCompletionStatus = useCallback((habitId, date) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return { completed: false, count: 0, required: 1 };

    const count = habit.completionCounts?.[date] || 0;
    const required = habit.completionsPerDay || 1;
    const completed = count >= required;

    return { completed, count, required };
  }, [habits]);

  // Save or update a note for a habit on a specific date
  const saveNote = useCallback(async (habitId, date, noteContent) => {
    try {
      setHabits((prevHabits) =>
        prevHabits.map((habit) => {
          if (habit.id !== habitId) return habit;

          const notes = habit.notes || [];
          const existingNoteIndex = notes.findIndex(note => note.date === date);

          let updatedNotes;
          if (existingNoteIndex !== -1) {
            // Update existing note
            updatedNotes = [...notes];
            updatedNotes[existingNoteIndex] = {
              ...updatedNotes[existingNoteIndex],
              content: noteContent,
              timestamp: Date.now(),
            };
          } else {
            // Add new note
            updatedNotes = [
              ...notes,
              {
                date: date,
                content: noteContent,
                timestamp: Date.now(),
              }
            ];
          }

          return {
            ...habit,
            notes: updatedNotes,
          };
        })
      );
      console.log('Note saved successfully for habit:', habitId, 'date:', date);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, []);

  // Get note for a specific habit and date
  const getNote = useCallback((habitId, date) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !habit.notes) return null;

    return habit.notes.find(note => note.date === date) || null;
  }, [habits]);

  // Delete a note
  const deleteNote = useCallback(async (habitId, date) => {
    try {
      setHabits((prevHabits) =>
        prevHabits.map((habit) => {
          if (habit.id !== habitId) return habit;

          const notes = habit.notes || [];
          const updatedNotes = notes.filter(note => note.date !== date);

          return {
            ...habit,
            notes: updatedNotes,
          };
        })
      );
      console.log('Note deleted successfully for habit:', habitId, 'date:', date);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }, []);

  // Get all notes for a habit
  const getHabitNotes = useCallback((habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !habit.notes) return [];

    // Sort by date, newest first
    return habit.notes.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [habits]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.keys(timerIntervals.current).forEach(habitId => {
        if (timerIntervals.current[habitId]) {
          clearInterval(timerIntervals.current[habitId]);
        }
      });
    };
  }, []);

  return (
    <HabitContext.Provider
      value={{
        habits,
        timers,
        habitsLoaded,
        timersLoaded,
        addHabit,
        updateHabit,
        toggleHabitCompletion,
        archiveHabit,
        testNotification,
        testScheduledNotification,
        getTodayHabits,
        getHabitCompletionStatus,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        completeEarly,
        getTimerState,
        // Note functions
        saveNote,
        getNote,
        deleteNote,
        getHabitNotes,
        // Theme properties
        theme,
        themeMode,
        isDarkMode,
        toggleTheme,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};