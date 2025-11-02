import React, { createContext, useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { AppState } from 'react-native';
import StorageService from '../services/storage/StorageService';
import NotificationService from '../services/notifications/NotificationService';
import { formatDateLocal, parseTimeToSeconds } from '../../utils/dateHelpers';

export const HabitContext = createContext();

export const HabitProvider = ({ children }) => {
  const [habits, setHabits] = useState([]);
  const [timers, setTimers] = useState({});
  const [habitsLoaded, setHabitsLoaded] = useState(false);
  const [timersLoaded, setTimersLoaded] = useState(false);

  const appState = useRef(AppState.currentState);
  const timerIntervals = useRef({});
  const timersRef = useRef(timers);

  // Keep timersRef in sync
  useEffect(() => {
    timersRef.current = timers;
  }, [timers]);

  // Load habits on mount
  useEffect(() => {
    loadHabits();
  }, []);

  // Restore timers after habits loaded
  useEffect(() => {
    if (habitsLoaded && habits.length >= 0) {
      restoreTimerStates();
    }
  }, [habitsLoaded]);

  // Save habits when changed
  useEffect(() => {
    if (habitsLoaded && habits.length >= 0) {
      StorageService.saveHabits(habits);
    }
  }, [habits, habitsLoaded]);

  // Save timers when changed
  useEffect(() => {
    if (habitsLoaded && timersLoaded) {
      saveTimerStates();
    }
  }, [timers, habitsLoaded, timersLoaded]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        if (timersLoaded) saveTimerStates();
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (habitsLoaded) restoreTimerStates();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [habitsLoaded, timersLoaded]);

  // Setup notification handlers
  useEffect(() => {
    NotificationService.setupNotificationHandlers();
    NotificationService.setHabitCompletedCallback((habitId) => {
      const today = formatDateLocal(new Date());
      toggleHabitCompletion(habitId, today);
    });
  }, []);

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

  // Load habits from storage
  const loadHabits = useCallback(async () => {
    try {
      const loadedHabits = await StorageService.getHabits();
      setHabits(loadedHabits);
      setHabitsLoaded(true);
    } catch (error) {
      console.error('Error loading habits:', error);
      setHabitsLoaded(true);
    }
  }, []);

  // Save timer states
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

      await StorageService.saveTimerStates(timerData);
    } catch (error) {
      console.error('Error saving timer states:', error);
    }
  };

  // Restore timer states
  const restoreTimerStates = async () => {
    try {
      const timerData = await StorageService.getTimerStates();
      if (!timerData) {
        setTimersLoaded(true);
        return;
      }

      const currentTime = Date.now();
      const restoredTimers = {};

      Object.keys(timerData).forEach(habitId => {
        const savedTimer = timerData[habitId];
        if (!savedTimer || !savedTimer.totalTime) return;

        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        const totalSeconds = parseTimeToSeconds(habit.completionTime?.time);
        if (totalSeconds <= 0) return;

        let newRemainingTime = savedTimer.remainingTime || totalSeconds;

        if (savedTimer.isRunning && savedTimer.lastSaveTime) {
          const elapsedSeconds = Math.floor((currentTime - savedTimer.lastSaveTime) / 1000);
          newRemainingTime = Math.max(0, savedTimer.remainingTime - elapsedSeconds);
        }

        if (newRemainingTime > 0) {
          restoredTimers[habitId] = {
            totalTime: totalSeconds,
            remainingTime: newRemainingTime,
            isRunning: savedTimer.isRunning,
            startTime: savedTimer.isRunning ? Date.now() : savedTimer.startTime
          };

          if (savedTimer.isRunning) {
            startTimerInterval(habitId, newRemainingTime);
          }
        } else if (savedTimer.isRunning) {
          handleTimerComplete(habitId);
        }
      });

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

  // Timer controls
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

      const updatedTimer = {
        ...timer,
        isRunning: true,
        startTime: Date.now()
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

    if (timerIntervals.current[habitId]) {
      clearInterval(timerIntervals.current[habitId]);
      delete timerIntervals.current[habitId];
    }

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
  }, [habits]);

  const completeEarly = useCallback((habitId) => {
    const today = formatDateLocal(new Date());

    if (timerIntervals.current[habitId]) {
      clearInterval(timerIntervals.current[habitId]);
      delete timerIntervals.current[habitId];
    }

    toggleHabitCompletion(habitId, today);

    setTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[habitId];
      return newTimers;
    });
  }, []);

  const getTimerState = useCallback((habitId) => {
    return timers[habitId] || null;
  }, [timers]);

  // Habit CRUD operations
  const addHabit = useCallback(async (newHabit) => {
    try {
      const habitWithId = {
        ...newHabit,
        id: Date.now().toString(),
        completions: [],
        completionCounts: {},
        notes: [],
        createdAt: Date.now(),
      };

      setHabits(prev => [...prev, habitWithId]);

      if (habitWithId.notification?.enabled) {
        await NotificationService.scheduleHabitReminder(habitWithId);
      }

      return habitWithId;
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  }, []);

  const updateHabit = useCallback(async (updatedHabit) => {
    try {
      setHabits(prev =>
        prev.map(habit =>
          habit.id === updatedHabit.id ? { ...habit, ...updatedHabit } : habit
        )
      );

      await NotificationService.cancelHabitNotifications(updatedHabit.id);

      if (updatedHabit.notification?.enabled) {
        await NotificationService.scheduleHabitReminder(updatedHabit);
      }
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  }, []);

  const toggleHabitCompletion = useCallback((habitId, date) => {
    setHabits(prev =>
      prev.map(habit => {
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
          if (dateIndex > -1) completions.splice(dateIndex, 1);
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

  const archiveHabit = useCallback(async (habitId) => {
    try {
      setHabits(prev => prev.filter(habit => habit.id !== habitId));

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
    } catch (error) {
      console.error('Error archiving habit:', error);
      throw error;
    }
  }, []);

  // Note operations
  const saveNote = useCallback(async (habitId, date, noteContent) => {
    try {
      setHabits(prev =>
        prev.map(habit => {
          if (habit.id !== habitId) return habit;

          const notes = habit.notes || [];
          const existingNoteIndex = notes.findIndex(note => note.date === date);

          let updatedNotes;
          if (existingNoteIndex !== -1) {
            updatedNotes = [...notes];
            updatedNotes[existingNoteIndex] = {
              ...updatedNotes[existingNoteIndex],
              content: noteContent,
              timestamp: Date.now(),
            };
          } else {
            updatedNotes = [
              ...notes,
              {
                date: date,
                content: noteContent,
                timestamp: Date.now(),
              }
            ];
          }

          return { ...habit, notes: updatedNotes };
        })
      );
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  }, []);

  const getNote = useCallback((habitId, date) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !habit.notes) return null;
    return habit.notes.find(note => note.date === date) || null;
  }, [habits]);

  const deleteNote = useCallback(async (habitId, date) => {
    try {
      setHabits(prev =>
        prev.map(habit => {
          if (habit.id !== habitId) return habit;

          const notes = habit.notes || [];
          const updatedNotes = notes.filter(note => note.date !== date);

          return { ...habit, notes: updatedNotes };
        })
      );
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }, []);

  const getHabitNotes = useCallback((habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !habit.notes) return [];
    return habit.notes.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [habits]);

  // Helper functions
  const getTodayHabits = useCallback(() => {
    const today = formatDateLocal(new Date());
    return habits.filter(habit => {
      const todayCount = habit.completionCounts?.[today] || 0;
      const requiredCount = habit.completionsPerDay || 1;
      return todayCount < requiredCount;
    });
  }, [habits]);

  const getHabitCompletionStatus = useCallback((habitId, date) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return { completed: false, count: 0, required: 1 };

    const count = habit.completionCounts?.[date] || 0;
    const required = habit.completionsPerDay || 1;
    const completed = count >= required;

    return { completed, count, required };
  }, [habits]);

  // Test notifications
  const testNotification = useCallback(async () => {
    await NotificationService.testMessageNotification();
  }, []);

  const testScheduledNotification = useCallback(async () => {
    await NotificationService.testScheduledNotification();
  }, []);

  const value = useMemo(() => ({
    habits,
    timers,
    habitsLoaded,
    timersLoaded,
    addHabit,
    updateHabit,
    toggleHabitCompletion,
    archiveHabit,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    completeEarly,
    getTimerState,
    saveNote,
    getNote,
    deleteNote,
    getHabitNotes,
    getTodayHabits,
    getHabitCompletionStatus,
    testNotification,
    testScheduledNotification,
  }), [
    habits,
    timers,
    habitsLoaded,
    timersLoaded,
    addHabit,
    updateHabit,
    toggleHabitCompletion,
    archiveHabit,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    completeEarly,
    getTimerState,
    saveNote,
    getNote,
    deleteNote,
    getHabitNotes,
    getTodayHabits,
    getHabitCompletionStatus,
    testNotification,
    testScheduledNotification,
  ]);

  return (
    <HabitContext.Provider value={value}>
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within HabitProvider');
  }
  return context;
};