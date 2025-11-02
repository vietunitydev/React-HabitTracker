import { useMemo, useCallback } from 'react';
import { useHabits } from '../../../core/contexts/HabitContext';
import { formatTime } from '../../../utils/dateHelpers';

/**
 * Custom hook for habit timer management
 * @param {string} habitId - Habit ID
 * @returns {Object} Timer state and controls
 */
export const useHabitTimer = (habitId) => {
  const {
    timers,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    completeEarly,
    getTimerState
  } = useHabits();

  const timer = useMemo(() => {
    return getTimerState(habitId);
  }, [habitId, timers, getTimerState]);

  const formattedTime = useMemo(() => {
    if (!timer) return '00:00:00';
    return formatTime(timer.remainingTime);
  }, [timer]);

  const progress = useMemo(() => {
    if (!timer || timer.totalTime === 0) return 0;
    return ((timer.totalTime - timer.remainingTime) / timer.totalTime) * 100;
  }, [timer]);

  const isRunning = useMemo(() => {
    return timer?.isRunning || false;
  }, [timer]);

  const start = useCallback(() => {
    startTimer(habitId);
  }, [habitId, startTimer]);

  const pause = useCallback(() => {
    pauseTimer(habitId);
  }, [habitId, pauseTimer]);

  const resume = useCallback(() => {
    resumeTimer(habitId);
  }, [habitId, resumeTimer]);

  const reset = useCallback(() => {
    resetTimer(habitId);
  }, [habitId, resetTimer]);

  const complete = useCallback(() => {
    completeEarly(habitId);
  }, [habitId, completeEarly]);

  return {
    timer,
    formattedTime,
    progress,
    isRunning,
    start,
    pause,
    resume,
    reset,
    complete,
  };
};