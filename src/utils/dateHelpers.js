/**
 * Date Utility Functions
 */

/**
 * Format date to local date string (YYYY-MM-DD)
 */
export const formatDateLocal = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
  return formatDateLocal(date) === formatDateLocal(new Date());
};

/**
 * Check if date is yesterday
 */
export const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateLocal(date) === formatDateLocal(yesterday);
};

/**
 * Get week days starting from Monday
 */
export const getWeekDays = () => {
  const days = [];
  const today = new Date();
  const currentDay = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }

  return days;
};

/**
 * Format date for display (Vietnamese)
 */
export const formatDateDisplay = (dateString) => {
  const date = new Date(dateString);

  if (isToday(date)) {
    return 'Hôm nay';
  } else if (isYesterday(date)) {
    return 'Hôm qua';
  } else {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
};

/**
 * Format time from seconds (HH:MM:SS)
 */
export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Parse time string to seconds
 */
export const parseTimeToSeconds = (timeString) => {
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

/**
 * Get last N days
 */
export const getLastNDays = (n = 30) => {
  const days = [];
  const today = new Date();

  for (let i = 0; i < n; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push(formatDateLocal(date));
  }

  return days;
};