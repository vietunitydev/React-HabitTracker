import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitContext } from '../contexts/HabitContext';

const { width } = Dimensions.get('window');

const formatDateLocal = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const StatCard = ({ icon, title, value, color, theme }) => (
  <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <View style={[styles.statIcon, { backgroundColor: color }]}>
      <Icon name={icon} size={28} color="#fff" />
    </View>
    <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
    <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
  </View>
);

const HabitStatItem = ({ habit, stats, theme }) => (
  <View style={[styles.habitStatItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <View style={[styles.habitStatIcon, { backgroundColor: habit.color }]}>
      <Icon name={habit.icon} size={24} color="#fff" />
    </View>
    <View style={styles.habitStatContent}>
      <Text style={[styles.habitStatName, { color: theme.text }]}>
        {habit.name}
      </Text>
      <View style={styles.habitStatMeta}>
        <View style={styles.habitStatMetaItem}>
          <Icon name="fire" size={14} color="#FF6B6B" />
          <Text style={[styles.habitStatMetaText, { color: theme.textSecondary }]}>
            {stats.streak} day streak
          </Text>
        </View>
        <View style={styles.habitStatMetaItem}>
          <Icon name="check-circle" size={14} color="#4CAF50" />
          <Text style={[styles.habitStatMetaText, { color: theme.textSecondary }]}>
            {stats.completions} total
          </Text>
        </View>
      </View>
    </View>
    <Text style={[styles.habitStatPercentage, { color: theme.primary }]}>
      {stats.percentage}%
    </Text>
  </View>
);

const StatsScreen = () => {
  const { habits, theme } = useContext(HabitContext);
  const [stats, setStats] = useState({
    totalHabits: 0,
    completedToday: 0,
    currentStreak: 0,
    totalCompletions: 0,
    habitStats: [],
  });

  useEffect(() => {
    calculateStats();
  }, [habits]);

  const calculateStats = () => {
    const today = formatDateLocal(new Date());

    let completedToday = 0;
    let totalCompletions = 0;
    let maxStreak = 0;
    const habitStats = [];

    habits.forEach(habit => {
      const completionsPerDay = habit.completionsPerDay || 1;
      const currentCount = habit.completionCounts?.[today] || 0;

      if (currentCount >= completionsPerDay) {
        completedToday++;
      }

      const completions = habit.completions || [];
      totalCompletions += completions.length;

      // Calculate streak
      const streak = calculateStreak(completions);
      if (streak > maxStreak) {
        maxStreak = streak;
      }

      // Calculate completion percentage (last 30 days)
      const last30Days = getLast30Days();
      const completedIn30Days = completions.filter(date =>
        last30Days.includes(date)
      ).length;
      const percentage = Math.round((completedIn30Days / 30) * 100);

      habitStats.push({
        habit,
        streak,
        completions: completions.length,
        percentage,
      });
    });

    // Sort by percentage
    habitStats.sort((a, b) => b.percentage - a.percentage);

    setStats({
      totalHabits: habits.length,
      completedToday,
      currentStreak: maxStreak,
      totalCompletions,
      habitStats,
    });
  };

  const calculateStreak = (completions) => {
    if (completions.length === 0) return 0;

    const sortedCompletions = completions
      .map(date => new Date(date))
      .sort((a, b) => b - a);

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

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

  const getLast30Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(formatDateLocal(date));
    }
    return days;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Statistics</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="checkbox-multiple-marked"
            title="Total Habits"
            value={stats.totalHabits}
            color="#8B5CF6"
            theme={theme}
          />
          <StatCard
            icon="check-circle"
            title="Completed Today"
            value={stats.completedToday}
            color="#4CAF50"
            theme={theme}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="fire"
            title="Current Streak"
            value={`${stats.currentStreak} days`}
            color="#FF6B6B"
            theme={theme}
          />
          <StatCard
            icon="chart-line"
            title="Total Done"
            value={stats.totalCompletions}
            color="#FFA726"
            theme={theme}
          />
        </View>

        {/* Habit Performance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Habit Performance
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Last 30 days completion rate
          </Text>

          {stats.habitStats.length > 0 ? (
            stats.habitStats.map((item, index) => (
              <HabitStatItem
                key={item.habit.id}
                habit={item.habit}
                stats={item}
                theme={theme}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="chart-box-outline" size={64} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                No data yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
                Start tracking habits to see your progress
              </Text>
            </View>
          )}
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  habitStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  habitStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitStatContent: {
    flex: 1,
  },
  habitStatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  habitStatMeta: {
    flexDirection: 'row',
  },
  habitStatMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  habitStatMetaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  habitStatPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default StatsScreen;