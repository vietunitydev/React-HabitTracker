// src/context/HabitContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const HabitContext = createContext();

export const HabitProvider = ({ children }) => {
  const [habits, setHabits] = useState([]);

  // Load habits from AsyncStorage when the app starts
  const loadHabits = useCallback(async () => {
    try {
      const habitsData = await AsyncStorage.getItem('habits');
      if (habitsData) {
        setHabits(JSON.parse(habitsData));
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

  // Add a new habit
  const addHabit = useCallback((newHabit) => {
    setHabits((prevHabits) => [...prevHabits, newHabit]);
  }, []);

  // Update an existing habit
  const updateHabit = useCallback((updatedHabit) => {
    setHabits((prevHabits) =>
      prevHabits.map((habit) =>
        habit.id === updatedHabit.id ? { ...habit, ...updatedHabit } : habit
      )
    );
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
  const archiveHabit = useCallback((habitId) => {
    setHabits((prevHabits) => prevHabits.filter((habit) => habit.id !== habitId));
  }, []);

  return (
    <HabitContext.Provider
      value={{
        habits,
        addHabit,
        updateHabit,
        toggleHabitCompletion,
        archiveHabit,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};