import React, { useContext, useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

// New imports - Refactored
import { useTheme } from '../../../core/contexts/ThemeContext';
import { HabitContext } from '../../../core/contexts/HabitContext';
import { HabitCard } from '../components/HabitCard';
import { WeekCalendar } from '../../../shared/components/ui/WeekCalendar';
import { ProgressCard } from '../../../shared/components/ui/ProgressCard';
import { formatDateLocal } from '../../../utils/dateHelpers';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const { theme } = useTheme(); // Separated theme context
    const { habits, toggleHabitCompletion } = useContext(HabitContext);
    const [selectedDate, setSelectedDate] = useState(formatDateLocal(new Date()));

    // Calculate today's habits
    const todayHabits = habits.filter(habit => {
        if (!habit.frequency || habit.frequency.type === 'daily') {
            return true;
        }
        if (habit.frequency.type === 'weekly') {
            const today = new Date().getDay();
            return habit.frequency.days?.includes(today);
        }
        return true;
    });

    // Calculate progress
    const calculateProgress = () => {
        if (todayHabits.length === 0) return 0;

        const completedCount = todayHabits.filter(habit => {
            const completionsPerDay = habit.completionsPerDay || 1;
            const currentCount = habit.completionCounts?.[selectedDate] || 0;
            return currentCount >= completionsPerDay;
        }).length;

        return (completedCount / todayHabits.length) * 100;
    };

    const progress = calculateProgress();
    const completedHabits = todayHabits.filter(habit => {
        const completionsPerDay = habit.completionsPerDay || 1;
        const currentCount = habit.completionCounts?.[selectedDate] || 0;
        return currentCount >= completionsPerDay;
    }).length;

    // Calculate streak
    const calculateStreak = () => {
        let maxStreak = 0;
        habits.forEach(habit => {
            if (habit.completions && habit.completions.length > 0) {
                const sortedCompletions = habit.completions
                  .map(date => new Date(date))
                  .sort((a, b) => b - a);

                let currentStreak = 0;
                let checkDate = new Date();
                checkDate.setHours(0, 0, 0, 0);

                for (let i = 0; i < sortedCompletions.length; i++) {
                    const completionDate = sortedCompletions[i];
                    const timeDiff = Math.abs(checkDate - completionDate);
                    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

                    if (daysDiff <= 1) {
                        currentStreak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                }

                if (currentStreak > maxStreak) {
                    maxStreak = currentStreak;
                }
            }
        });
        return maxStreak;
    };

    const currentStreak = calculateStreak();

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
              <View>
                  <Text style={[styles.greeting, { color: theme.text }]}>
                      Hello! 👋
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                      {new Date().toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                      })}
                  </Text>
              </View>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: theme.card }]}
                onPress={() => navigation.navigate('AllNotes')}
              >
                  <Icon name="note-text" size={24} color={theme.primary} />
              </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
              {/* Progress Card */}
              <ProgressCard
                progress={progress}
                completedHabits={completedHabits}
                totalHabits={todayHabits.length}
                streak={currentStreak}
              />

              {/* Week Calendar */}
              <WeekCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />

              {/* Today's Habits */}
              <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>
                          Today's Habits
                      </Text>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('AllHabits')}
                      >
                          <Text style={[styles.seeAllText, { color: theme.primary }]}>
                              See All
                          </Text>
                      </TouchableOpacity>
                  </View>

                  {todayHabits.length > 0 ? (
                    todayHabits.map((habit) => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        onPress={() => navigation.navigate('HabitDetail', { habit })}
                        selectedDate={selectedDate}
                      />
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                        <Icon name="inbox" size={64} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            No habits for today
                        </Text>
                        <TouchableOpacity
                          style={[styles.createButton, { backgroundColor: theme.primary }]}
                          onPress={() => navigation.navigate('CreateHabit')}
                        >
                            <Icon name="plus" size={20} color="#fff" />
                            <Text style={styles.createButtonText}>
                                Create your first habit
                            </Text>
                        </TouchableOpacity>
                    </View>
                  )}
              </View>

              {/* Quick Stats */}
              <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Quick Stats
                  </Text>
                  <View style={styles.statsGrid}>
                      <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                          <Icon name="check-circle" size={32} color="#4CAF50" />
                          <Text style={[styles.statValue, { color: theme.text }]}>
                              {completedHabits}
                          </Text>
                          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                              Completed
                          </Text>
                      </View>
                      <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                          <Icon name="fire" size={32} color="#FF6B6B" />
                          <Text style={[styles.statValue, { color: theme.text }]}>
                              {currentStreak}
                          </Text>
                          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                              Day Streak
                          </Text>
                      </View>
                  </View>
              </View>

              <View style={{ height: 100 }} />
          </ScrollView>
      </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
        marginBottom: 24,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        marginVertical: 8,
    },
    statLabel: {
        fontSize: 13,
    },
});

export default HomeScreen;