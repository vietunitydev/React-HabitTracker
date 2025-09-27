import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import NotificationService from '../services/NotificationService';

export const HabitContext = createContext();

export const HabitProvider = ({ children }) => {
  const [habits, setHabits] = useState([]);
  const [timers, setTimers] = useState({});
  const [habitsLoaded, setHabitsLoaded] = useState(false);
  const [timersLoaded, setTimersLoaded] = useState(false);
  const appState = useRef(AppState.currentState);
  const timerIntervals = useRef({});

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
      // console.log('Timer states saved:', timerData);
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
        setTimersLoaded(true); // Mark as loaded even if no data
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

        // Calculate elapsed time if timer was running
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
      setTimersLoaded(true); // Mark timers as loaded after restoration
    } catch (error) {
      console.error('Error restoring timer states:', error);
      setTimersLoaded(true); // Mark as loaded even on error to prevent hanging
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
      setHabitsLoaded(true); // Mark habits as loaded
    } catch (error) {
      console.error('Error loading habits:', error);
      setHabitsLoaded(true); // Still mark as loaded to prevent hanging
    }
  }, []);

  // Persist habits to AsyncStorage
  const persistHabits = useCallback(async (updatedHabits) => {
    try {
      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
    } catch (error) {
      console.error('Error persisting habits:', error);
    }
  }, []);

  // Save habits whenever they change
  useEffect(() => {
    if (habits.length > 0 && habitsLoaded) {
      persistHabits(habits);
    }
  }, [habits, persistHabits, habitsLoaded]);

  // Timer management functions
  const startTimer = useCallback((habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit?.completionTime?.enabled) return false;

    const totalSeconds = parseTimeToSeconds(habit.completionTime.time);
    if (totalSeconds <= 0) return false;

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
    return true;
  }, [habits]);

  const pauseTimer = useCallback((habitId) => {
    setTimers(prev => {
      const timer = prev[habitId];
      if (!timer) return prev;

      return {
        ...prev,
        [habitId]: {
          ...timer,
          isRunning: false
        }
      };
    });

    if (timerIntervals.current[habitId]) {
      clearInterval(timerIntervals.current[habitId]);
      delete timerIntervals.current[habitId];
    }
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
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};