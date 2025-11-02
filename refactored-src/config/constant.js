/**
 * Application Constants
 */

// Storage Keys
export const STORAGE_KEYS = {
  HABITS: 'habits',
  TIMERS: 'timerStates',
  THEME: 'themeMode',
  NOTES: 'notes',
  USER_PROFILE: 'userProfile',
  SETTINGS: 'settings',
};

// Theme Modes
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Timer States
export const TIMER_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

// Days of Week
export const DAYS_OF_WEEK = [
  { id: 0, label: 'Sunday', short: 'Sun', abbreviation: 'SU' },
  { id: 1, label: 'Monday', short: 'Mon', abbreviation: 'MO' },
  { id: 2, label: 'Tuesday', short: 'Tue', abbreviation: 'TU' },
  { id: 3, label: 'Wednesday', short: 'Wed', abbreviation: 'WE' },
  { id: 4, label: 'Thursday', short: 'Thu', abbreviation: 'TH' },
  { id: 5, label: 'Friday', short: 'Fri', abbreviation: 'FR' },
  { id: 6, label: 'Saturday', short: 'Sat', abbreviation: 'SA' },
];

// Habit Colors
export const HABIT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#AB47BC',
  '#66BB6A', '#EC407A', '#5C6BC0', '#26A69A', '#FF7043',
];

// Max Values
export const MAX_VALUES = {
  HABIT_NAME_LENGTH: 50,
  DESCRIPTION_LENGTH: 200,
  NOTE_LENGTH: 1000,
  COMPLETIONS_PER_DAY: 10,
  SNOOZES_PER_MONTH: 3,
};

// Animation Durations
export const ANIMATION_DURATIONS = {
  SHORT: 200,
  MEDIUM: 300,
  LONG: 500,
};

// Icon Categories (Vietnamese labels)
export const ICON_CATEGORIES = {
  General: "Chung",
  Health: "Sức khỏe",
  Fitness: "Thể chất",
  Productivity: "Năng suất",
  Learning: "Học tập",
  Mindfulness: "Chánh niệm",
  Social: "Xã hội",
  Creativity: "Sáng tạo",
  Finance: "Tài chính",
  Career: "Công việc"
};

// Snooze Reasons
export const SNOOZE_REASONS = [
  { id: 'sick', label: 'Ốm', icon: 'hospital-box' },
  { id: 'travel', label: 'Đi công tác', icon: 'airplane' },
  { id: 'busy', label: 'Quá bận', icon: 'clock-alert' },
  { id: 'emergency', label: 'Khẩn cấp', icon: 'alert-circle' },
  { id: 'other', label: 'Lý do khác', icon: 'dots-horizontal' },
];