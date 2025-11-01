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
import { HabitContext } from '../contexts/HabitContext';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

const formatDateLocal = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Progress Circle Component
const ProgressCircle = ({ progress, size = 100, strokeWidth = 8 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={styles.progressCircleContainer}>
          <Svg width={size} height={size}>
              {/* Background Circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress Circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#4FC3F7"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${size / 2}, ${size / 2}`}
              />
          </Svg>
          <View style={styles.progressTextContainer}>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
      </View>
    );
};

// Week Calendar Component
const WeekCalendar = ({ theme }) => {
    const [weekDays, setWeekDays] = useState([]);
    const today = new Date();

    useEffect(() => {
        const days = [];
        const currentDay = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            days.push({
                dayName: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][day.getDay()],
                date: day.getDate(),
                isToday: formatDateLocal(day) === formatDateLocal(today),
                fullDate: day,
            });
        }
        setWeekDays(days);
    }, []);

    return (
      <View style={styles.weekCalendar}>
          {weekDays.map((day, index) => (
            <View
              key={index}
              style={[
                  styles.dayItem,
                  day.isToday && styles.todayItem,
              ]}
            >
                <Text
                  style={[
                      styles.dayName,
                      { color: day.isToday ? '#fff' : theme.textTertiary },
                  ]}
                >
                    {day.dayName}
                </Text>
                <Text
                  style={[
                      styles.dayDate,
                      { color: day.isToday ? '#fff' : theme.text },
                  ]}
                >
                    {day.date}
                </Text>
            </View>
          ))}
      </View>
    );
};

// Today Habit Item Component
const TodayHabitItem = ({ habit, theme, onPress }) => {
    const today = formatDateLocal(new Date());
    const completionsPerDay = habit.completionsPerDay || 1;
    const currentCount = habit.completionCounts?.[today] || 0;
    const progress = (currentCount / completionsPerDay) * 100;
    const isCompleted = currentCount >= completionsPerDay;

    const getStatusColor = () => {
        if (isCompleted) return '#4CAF50';
        if (currentCount > 0) return '#FFA726';
        return theme.textMuted;
    };

    const getStatusText = () => {
        if (isCompleted) return '✓ Completed!';
        if (currentCount > 0) return `${currentCount}/${completionsPerDay} Completed`;
        return 'Pending';
    };

    return (
      <TouchableOpacity
        style={[
            styles.habitCard,
            {
                backgroundColor: theme.card,
                borderColor: isCompleted ? '#4CAF50' : getStatusColor(),
            }
        ]}
        onPress={onPress}
      >
          <View style={styles.habitCardContent}>
              <View style={[styles.habitIconContainer, { backgroundColor: habit.color }]}>
                  <Icon name={habit.icon} size={32} color="#fff" />
              </View>

              <View style={styles.habitInfo}>
                  <Text style={[styles.habitName, { color: theme.text }]}>
                      {habit.name}
                  </Text>
                  <Text style={[styles.habitStatus, { color: getStatusColor() }]}>
                      {getStatusText()}
                  </Text>
              </View>

              <View style={styles.habitProgress}>
                  {isCompleted ? (
                    <View style={[styles.completedBadge, { backgroundColor: '#4CAF50' }]}>
                        <Text style={styles.completedText}>100%</Text>
                    </View>
                  ) : (
                    <View style={[styles.progressBadge, { borderColor: getStatusColor() }]}>
                        <Text style={[styles.progressBadgeText, { color: theme.text }]}>
                            {Math.round(progress)}%
                        </Text>
                    </View>
                  )}
              </View>
          </View>
      </TouchableOpacity>
    );
};

const HomeScreen = ({ navigation }) => {
    const { habits, theme, toggleHabitCompletion } = useContext(HabitContext);
    const [todayHabits, setTodayHabits] = useState([]);
    const [completionPercentage, setCompletionPercentage] = useState(0);

    useEffect(() => {
        const today = formatDateLocal(new Date());

        // Get today's habits
        const todayList = habits.filter(habit => {
            const completionsPerDay = habit.completionsPerDay || 1;
            const currentCount = habit.completionCounts?.[today] || 0;
            return true; // Show all habits
        });

        setTodayHabits(todayList);

        // Calculate completion percentage
        if (todayList.length > 0) {
            let completed = 0;
            todayList.forEach(habit => {
                const completionsPerDay = habit.completionsPerDay || 1;
                const currentCount = habit.completionCounts?.[today] || 0;
                if (currentCount >= completionsPerDay) {
                    completed++;
                }
            });
            setCompletionPercentage((completed / todayList.length) * 100);
        } else {
            setCompletionPercentage(0);
        }
    }, [habits]);

    const completedCount = todayHabits.filter(habit => {
        const today = formatDateLocal(new Date());
        const completionsPerDay = habit.completionsPerDay || 1;
        const currentCount = habit.completionCounts?.[today] || 0;
        return currentCount >= completionsPerDay;
    }).length;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
          <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                  <Text style={[styles.greeting, { color: theme.text }]}>
                      Hello, Viet!
                  </Text>
              </View>

              {/* Week Calendar */}
              <WeekCalendar theme={theme} />

              {/* Progress Card */}
              <View style={styles.progressCard}>
                  <View style={styles.progressCardContent}>
                      <ProgressCircle progress={completionPercentage} />
                      <View style={styles.progressInfo}>
                          <Text style={styles.progressTitle}>
                              {completedCount} of {todayHabits.length} habits
                          </Text>
                          <Text style={styles.progressSubtitle}>
                              completed today!
                          </Text>
                          <View style={styles.celebrationEmoji}>
                              <Text style={styles.emoji}>👏 🎯 📊</Text>
                          </View>
                      </View>
                  </View>
                  <View style={styles.illustration}>
                      <Icon name="notebook-check" size={80} color="rgba(255,255,255,0.3)" />
                  </View>
              </View>

              {/* Today Habits Section */}
              <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>
                          Today habit
                      </Text>
                      <TouchableOpacity onPress={() => navigation.navigate('AllHabits')}>
                          <Text style={[styles.seeAllText, { color: theme.textTertiary }]}>
                              See all
                          </Text>
                      </TouchableOpacity>
                  </View>

                  {todayHabits.length > 0 ? (
                    todayHabits.slice(0, 3).map((habit) => (
                      <TodayHabitItem
                        key={habit.id}
                        habit={habit}
                        theme={theme}
                        onPress={() => navigation.navigate('HabitDetail', { habit })}
                      />
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                        <Icon name="inbox" size={48} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            No habits for today
                        </Text>
                        <TouchableOpacity
                          style={[styles.addButton, { backgroundColor: theme.primary }]}
                          onPress={() => navigation.navigate('CreateHabit')}
                        >
                            <Text style={styles.addButtonText}>Create your first habit</Text>
                        </TouchableOpacity>
                    </View>
                  )}
              </View>

              {/* Bottom padding for tab bar */}
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
        paddingTop: 10,
        paddingBottom: 20,
        alignItems: 'center',
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    weekCalendar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 10,
        paddingVertical: 15,
        marginBottom: 20,
    },
    dayItem: {
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 12,
        minWidth: 45,
    },
    todayItem: {
        backgroundColor: '#42A5F5',
    },
    dayName: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    dayDate: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    progressCard: {
        marginHorizontal: 20,
        marginBottom: 30,
        padding: 24,
        borderRadius: 20,
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        overflow: 'hidden',
        position: 'relative',
        minHeight: 180,
        // Gradient background
        // backgroundColor: '#667eea',
    },
    progressCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    progressCircleContainer: {
        position: 'relative',
    },
    progressTextContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    progressInfo: {
        marginLeft: 20,
        flex: 1,
    },
    progressTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    progressSubtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 16,
        marginTop: 4,
    },
    celebrationEmoji: {
        marginTop: 8,
    },
    emoji: {
        fontSize: 24,
    },
    illustration: {
        position: 'absolute',
        right: -10,
        bottom: -10,
        opacity: 0.3,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '500',
    },
    habitCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    habitCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    habitIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    habitInfo: {
        flex: 1,
    },
    habitName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    habitStatus: {
        fontSize: 14,
        fontWeight: '500',
    },
    habitProgress: {
        marginLeft: 12,
    },
    completedBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    progressBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBadgeText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 12,
        marginBottom: 20,
    },
    addButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default HomeScreen;