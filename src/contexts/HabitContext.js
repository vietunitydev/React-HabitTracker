import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../services/NotificationService';

export const HabitContext = createContext();

export const HabitProvider = ({ children }) => {
  const [habits, setHabits] = useState([]);

  // Initialize NotificationService when app starts
  useEffect(() => {
    NotificationService.setupNotificationHandlers();

    // Set callback để xử lý khi user complete habit từ notification
    NotificationService.setHabitCompletedCallback((habitId) => {
      const today = formatDateLocal(new Date());
      toggleHabitCompletion(habitId, today);
    });
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

  // Load habits from AsyncStorage when the app starts
  const loadHabits = useCallback(async () => {
    try {
      const habitsData = await AsyncStorage.getItem('habits');
      if (habitsData) {
        const parsedHabits = JSON.parse(habitsData);
        setHabits(parsedHabits);

        // Re-schedule notifications cho tất cả habits có notification enabled
        parsedHabits.forEach(habit => {
          if (habit.notification?.enabled) {
            NotificationService.scheduleHabitReminder(habit);
          }
        });
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
  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  // Save habits to AsyncStorage whenever they change
  useEffect(() => {
    if (habits.length > 0) {
      persistHabits(habits);
    }
  }, [habits, persistHabits]);

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

      // Schedule notification nếu enabled
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
          const currentStreak = calculateCurrentStreak(completions, date);
          NotificationService.showCompletionNotification(
            habit.name,
            currentStreak,
            habit.color
          );
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

      // Cancel all notifications cho habit này
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

  // Get habits for today (có thể dùng cho widget hoặc today view)
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

  return (
    <HabitContext.Provider
      value={{
        habits,
        addHabit,
        updateHabit,
        toggleHabitCompletion,
        archiveHabit,
        testNotification,
        testScheduledNotification,
        getTodayHabits,
        getHabitCompletionStatus,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};