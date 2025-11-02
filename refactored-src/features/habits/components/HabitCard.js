import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from '../../../shared/components/ui/Card';
import { useTheme } from '../../../core/contexts/ThemeContext';
import { useHabitCompletion } from '../hooks/useHabitCompletion';

/**
 * Habit Card Component
 * Displays habit with completion status
 */
export const HabitCard = ({ habit, onPress, date }) => {
  const { theme } = useTheme();
  const { completed, count, required, progress, isPartial } = useHabitCompletion(
    habit.id,
    date
  );

  const getStatusColor = () => {
    if (completed) return theme.success;
    if (isPartial) return theme.warning;
    return theme.textMuted;
  };

  const getStatusText = () => {
    if (completed) return '✓ Completed!';
    if (isPartial) return `${count}/${required} Completed`;
    return 'Pending';
  };

  return (
    <Card
      onPress={onPress}
      style={[
        styles.card,
        { borderColor: completed ? theme.success : getStatusColor() },
      ]}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: habit.color }]}>
          <Icon name={habit.icon} size={32} color="#fff" />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {habit.description && (
            <Text
              style={[styles.description, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {habit.description}
            </Text>
          )}
        </View>

        {/* Progress Badge */}
        <View style={styles.progressContainer}>
          {completed ? (
            <View style={[styles.completedBadge, { backgroundColor: theme.success }]}>
              <Text style={styles.badgeText}>100%</Text>
            </View>
          ) : (
            <View style={[styles.progressBadge, { borderColor: getStatusColor() }]}>
              <Text style={[styles.badgeText, { color: theme.text }]}>
                {Math.round(progress)}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      {!completed && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: habit.color,
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderWidth: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    marginLeft: 12,
  },
  completedBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBarContainer: {
    marginTop: 12,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});