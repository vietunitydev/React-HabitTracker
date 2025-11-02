/**
 * Theme Configuration
 */

export const lightTheme = {
  // Backgrounds
  background: '#F9FAFB',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#F9FAFB',
  card: '#FFFFFF',

  // Text
  text: '#111827',
  textSecondary: '#374151',
  textTertiary: '#4B5563',
  textMuted: '#6B7280',

  // Borders
  border: '#E5E7EB',
  borderSecondary: '#D1D5DB',

  // Primary
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',

  // Secondary
  blue: '#2563EB',
  cyan: '#0891B2',

  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  isDark: false,
};

export const darkTheme = {
  // Backgrounds
  background: '#111827',
  backgroundSecondary: 'rgba(31, 41, 55, 0.5)',
  backgroundTertiary: 'rgba(17, 24, 39, 0.3)',
  card: 'rgba(31, 41, 55, 0.5)',

  // Text
  text: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textMuted: '#6B7280',

  // Borders
  border: 'rgba(55, 65, 81, 0.5)',
  borderSecondary: '#1F2937',

  // Primary
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',

  // Secondary
  blue: '#60A5FA',
  cyan: '#22D3EE',

  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  isDark: true,
};

export const getTheme = (isDark) => (isDark ? darkTheme : lightTheme);