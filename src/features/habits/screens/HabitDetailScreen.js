import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

// ✅ REFACTORED IMPORTS
import { useTheme } from '../../../core/contexts/ThemeContext';
import { HabitContext } from '../../../core/contexts/HabitContext';
import { useHabitTimer } from '../hooks/useHabitTimer';
import { useHabitCompletion } from '../hooks/useHabitCompletion';
import { formatDateLocal } from '../../../utils/dateHelpers';
import { ProgressCircle } from '../../../shared/components/ui/ProgressCircle';
import { WeekCalendar } from '../../../shared/components/ui/WeekCalendar';

const HabitDetailScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { habit } = route.params;
  const { deleteHabit } = useContext(HabitContext);

  const [selectedDate, setSelectedDate] = useState(formatDateLocal(new Date()));

  // Use custom hooks
  const {
    isActive,
    elapsedTime,
    formattedTime,
    progress: timerProgress,
    startTimer,
    pauseTimer,
    resetTimer
  } = useHabitTimer(habit.id);

  const { isCompleted, currentCount, progress, toggleCompletion } =
    useHabitCompletion(habit, selectedDate);

  const completionsPerDay = habit.completionsPerDay || 1;

  // Calculate streak
  const calculateStreak = () => {
    if (!habit.completions || habit.completions.length === 0) return 0;

    const sortedCompletions = habit.completions
      .map(date => new Date(date))
      .sort((a, b) => b - a);

    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (const completionDate of sortedCompletions) {
      const timeDiff = Math.abs(checkDate - completionDate);
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteHabit(habit.id);
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Habit Details
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateHabit', { habit })}>
          <Icon name="pencil" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Habit Info */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={[styles.habitIcon, { backgroundColor: habit.color }]}>
            <Icon name={habit.icon} size={48} color="#fff" />
          </View>
          <Text style={[styles.habitName, { color: theme.text }]}>
            {habit.name}
          </Text>
          {habit.description && (
            <Text style={[styles.habitDescription, { color: theme.textSecondary }]}>
              {habit.description}
            </Text>
          )}
        </View>

        {/* Progress Circle */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <ProgressCircle progress={progress} size={120} color={habit.color} />
          <Text style={[styles.progressText, { color: theme.text }]}>
            {currentCount}/{completionsPerDay} completed
          </Text>
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: habit.color }]}
            onPress={() => toggleCompletion(selectedDate)}
          >
            <Icon name={isCompleted ? "check" : "plus"} size={24} color="#fff" />
            <Text style={styles.completeButtonText}>
              {isCompleted ? "Completed" : "Mark Complete"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="fire" size={32} color="#FF6B6B" />
              <Text style={[styles.statValue, { color: theme.text }]}>{streak}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Day Streak
              </Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="check-circle" size={32} color="#4CAF50" />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {habit.completions?.length || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total Done
              </Text>
            </View>
          </View>
        </View>

        {/* Timer (if enabled) */}
        {habit.timer?.enabled && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Timer</Text>
            <Text style={[styles.timerDisplay, { color: theme.text }]}>
              {formattedTime}
            </Text>
            <View style={styles.timerButtons}>
              <TouchableOpacity
                style={[styles.timerButton, { backgroundColor: theme.primary }]}
                onPress={isActive ? pauseTimer : startTimer}
              >
                <Icon name={isActive ? "pause" : "play"} size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timerButton, { backgroundColor: theme.error }]}
                onPress={resetTimer}
              >
                <Icon name="refresh" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Calendar */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>History</Text>
          <WeekCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            completedDates={habit.completions || []}
          />
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: theme.error }]}
          onPress={handleDelete}
        >
          <Icon name="delete" size={24} color={theme.error} />
          <Text style={[styles.deleteButtonText, { color: theme.error }]}>
            Delete Habit
          </Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  habitIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  habitName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  habitDescription: {
    fontSize: 16,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 16,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'flex-start',
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  timerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HabitDetailScreen;