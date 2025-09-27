import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import NotificationService from '../services/NotificationService';

export const HabitContext = createContext();

export const HabitProvider = ({ children }) => {
  const [habits, setHabits] = useState([]);
  const [timers, setTimers] = useState({});
  const appState = useRef(AppState.currentState);
  const timerIntervals = useRef({});

  // Initialize NotificationService when app starts
  useEffect(() => {
    NotificationService.setupNotificationHandlers();

    // Set callback để xử lý khi user complete habit từ notification
    NotificationService.setHabitCompletedCallback((habitId) => {
      const today = formatDateLocal(new Date());
      toggleHabitCompletion(habitId, today);
    });
  }, []);

  // Handle app state changes for timer persistence
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App is going to background - save timer states
        saveTimerStates();
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App is coming to foreground - restore timer states
        restoreTimerStates();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Load initial data
  useEffect(() => {
    loadHabits();
    restoreTimerStates();
  }, []);

  // Format date to local string
  const formatDateLocal = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parse time string to seconds
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
      Object.keys(timers).forEach(habitId => {
        const timer = timers[habitId];
        if (timer.isRunning) {
          timerData[habitId] = {
            ...timer,
            lastSaveTime: Date.now()
          };
        }
      });
      await AsyncStorage.setItem('timerStates', JSON.stringify(timerData));
    } catch (error) {
      console.error('Error saving timer states:', error);
    }
  };

  // Restore timer states from AsyncStorage
  const restoreTimerStates = async () => {
    try {
      const timerData = await AsyncStorage.getItem('timerStates');
      if (timerData) {
        const parsedTimers = JSON.parse(timerData);
        const currentTime = Date.now();
        const restoredTimers = {};

        Object.keys(parsedTimers).forEach(habitId => {
          const savedTimer = parsedTimers[habitId];
          if (savedTimer.isRunning && savedTimer.lastSaveTime) {
            const elapsedSeconds = Math.floor((currentTime - savedTimer.lastSaveTime) / 1000);
            const newRemainingTime = Math.max(0, savedTimer.remainingTime - elapsedSeconds);

            if (newRemainingTime > 0) {
              restoredTimers[habitId] = {
                ...savedTimer,
                remainingTime: newRemainingTime
              };
              // Restart the interval
              startTimerInterval(habitId, newRemainingTime);
            } else {
              // Timer completed while app was in background
              handleTimerComplete(habitId);
            }
          }
        });

        setTimers(restoredTimers);
      }
    } catch (error) {
      console.error('Error restoring timer states:', error);
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
              isRunning: false
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

    // Clear interval
    if (timerIntervals.current[habitId]) {
      clearInterval(timerIntervals.current[habitId]);
      delete timerIntervals.current[habitId];
    }

    // Auto-complete habit
    toggleHabitCompletion(habitId, today);

    // Show completion notification
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      NotificationService.showCompletionNotification(
        habit.name,
        'Timer completed! Great job!',
        habit.color
      );
    }

    // Remove timer from storage
    AsyncStorage.removeItem('timerStates').catch(console.error);
  };

  // Load habits from AsyncStorage
  const loadHabits = useCallback(async () => {
    try {
      const habitsData = await AsyncStorage.getItem('habits');
      if (habitsData) {
        const parsedHabits = JSON.parse(habitsData);
        setHabits(parsedHabits);

        // Re-schedule notifications cho tất cả habits có notification enabled
        // parsedHabits.forEach(habit => {
        //   if (habit.notification?.enabled) {
        //     NotificationService.scheduleHabitReminder(habit);
        //   }
        // });
      }
    } catch (error) {
      console.error('Error loading habits:', error);
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

  // Load habits on mount
  // useEffect(() => {
  //   loadHabits();
  // }, [loadHabits]);

  // Save habits to AsyncStorage whenever they change
  useEffect(() => {
    if (habits.length > 0) {
      persistHabits(habits);
    }
  }, [habits, persistHabits]);

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

      const updatedTimer = {
        ...timer,
        isRunning: true
      };

      startTimerInterval(habitId, timer.remainingTime);

      return {
        ...prev,
        [habitId]: updatedTimer
      };
    });
  }, []);

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

    // Stop timer
    if (timerIntervals.current[habitId]) {
      clearInterval(timerIntervals.current[habitId]);
      delete timerIntervals.current[habitId];
    }

    // Remove timer state
    setTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[habitId];
      return newTimers;
    });

    // Complete habit
    toggleHabitCompletion(habitId, today);
  }, []);

  // Get timer state for a habit
  const getTimerState = useCallback((habitId) => {
    return timers[habitId] || null;
  }, [timers]);

  // Calculate current streak for a habit
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

      // Cancel old notifications
      await NotificationService.cancelHabitNotifications(updatedHabit.id);

      // Schedule new notification nếu enabled
      if (updatedHabit.notification?.enabled) {
        await NotificationService.scheduleHabitReminder(updatedHabit);
        console.log('Notification rescheduled for habit:', updatedHabit.name);
      }
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  }, []);

  // Toggle habit completion for a specific date
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

          // Show completion notification
          // const currentStreak = calculateCurrentStreak(completions, date);
          // NotificationService.showCompletionNotification(
          //   habit.name,
          //   currentStreak,
          //   habit.color
          // );
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

      // Clear timer if running
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
      // Lọc habits chưa complete hôm nay
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
        addHabit,
        updateHabit,
        toggleHabitCompletion,
        archiveHabit,
        testNotification,
        testScheduledNotification,
        getTodayHabits,
        getHabitCompletionStatus,
        // Timer functions
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