import { useMemo, useCallback } from 'react';
import { useHabits } from '../../../core/contexts/HabitContext';
import { formatDateLocal } from '../../../utils/dateHelpers';

/**
 * Custom hook for habit completion management
 * @param {string} habitId - Habit ID
 * @param {Date|string} date - Date to check (defaults to today)
 * @returns {Object} Completion status and methods
 */
export const useHabitCompletion = (habitId, date = new Date()) => {
  const { habits, toggleHabitCompletion } = useHabits();

  const dateString = useMemo(() => formatDateLocal(date), [date]);

  const habit = useMemo(() => {
    return habits.find(h => h.id === habitId);
  }, [habits, habitId]);

  const status = useMemo(() => {
    if (!habit) {
      return {
        completed: false,
        count: 0,
        required: 1,
        progress: 0,
        isPartial: false,
      };
    }

    const count = habit.completionCounts?.[dateString] || 0;
    const required = habit.completionsPerDay || 1;
    const completed = count >= required;
    const progress = (count / required) * 100;
    const isPartial = count > 0 && count < required;

    return {
      completed,
      count,
      required,
      progress,
      isPartial,
    };
  }, [habit, dateString]);

  const toggle = useCallback(() => {
    if (!habitId) return;
    toggleHabitCompletion(habitId, dateString);
  }, [habitId, dateString, toggleHabitCompletion]);

  return {
    habit,
    ...status,
    toggle,
  };
};