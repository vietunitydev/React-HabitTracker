import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import ComingSoonDialog from "../components/ComingSoonDialog";

// Static habit info component
const HabitInfo = memo(({ name, icon, color, description }) => (
  <View style={styles.habitInfo}>
      <View style={[styles.habitIcon, { backgroundColor: color }]}>
          <Icon name={icon} size={32} color="#fff" />
      </View>
      <View style={styles.habitText}>
          <Text style={styles.habitName}>{name}</Text>
          {description && (
            <Text style={styles.habitDescription}>{description}</Text>
          )}
      </View>
  </View>
));

// Streak bar component
const StreakBar = memo(({ currentStreak, goalStreak, onEdit, onSettings }) => (
  <View style={styles.streakBar}>
      <View style={styles.streakLeft}>
          <View style={styles.targetBlock}>
              <Text style={styles.targetLabel}>Target</Text>
              <Text style={styles.targetValue}>{goalStreak || '-'}</Text>
          </View>
          <View style={styles.flameBlock}>
              <Icon name="fire" size={20} color="#FF6B6B" />
              <Text style={styles.flameCount}>{currentStreak}</Text>
          </View>
      </View>
      <View style={styles.streakRight}>
          <TouchableOpacity style={styles.iconButton} onPress={onEdit}>
              <Icon name="pencil" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={onSettings}>
              <Icon name="cog" size={20} color="#fff" />
          </TouchableOpacity>
      </View>
  </View>
));

// History grid component
const HistoryGrid = memo(({ completionCounts, completionsPerDay, color }) => {
    const scrollRef = useRef(null);

    const normalizeDate = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const now = normalizeDate(new Date());

    const generateCommitGrid = () => {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const grid = [];

        for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
            const targetDate = new Date(currentYear, currentMonth - monthOffset, 1);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const startOfWeek = new Date(firstDay);
            startOfWeek.setDate(firstDay.getDate() - firstDay.getDay());

            const monthGrid = [];
            for (let week = 0; week < 6; week++) {
                const weekDays = [];
                for (let day = 0; day < 7; day++) {
                    const currentDate = new Date(startOfWeek);
                    currentDate.setDate(startOfWeek.getDate() + week * 7 + day);

                    const dateString = currentDate.toISOString().split('T')[0];
                    const cdNorm = normalizeDate(currentDate);

                    const isInCurrentMonth = currentDate.getMonth() === month;
                    const completionCount = completionCounts[dateString] || 0;
                    const isCompleted = completionCount >= completionsPerDay;
                    const isToday = cdNorm.getTime() === now.getTime();
                    const isFuture = cdNorm > now && !isToday;

                    weekDays.push({
                        date: dateString,
                        completionCount,
                        isCompleted,
                        isInCurrentMonth,
                        isFuture,
                        isToday,
                    });
                }
                monthGrid.push(weekDays);
            }

            grid.push({
                year,
                month,
                monthName: firstDay.toLocaleString('default', { month: 'short' }),
                weeks: monthGrid,
            });
        }
        return grid;
    };

    const getCompletionColorForDay = (completionCount) => {
        const baseColor = color || '#34C759';
        if (completionCount === 0) return '#333';
        if (completionsPerDay === 1) return baseColor;

        const percentage = Math.min(completionCount / completionsPerDay, 1);
        const opacity = 0.3 + (percentage * 0.7);
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const grid = useMemo(() => generateCommitGrid(), [completionCounts, completionsPerDay, color]);

    return (
      <View style={{ marginTop: 1 }}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.commitGridScroll}
          >
              {grid.map((monthData, i) => (
                <View key={i} style={styles.monthColumn}>
                    <Text style={styles.monthLabel}>{monthData.monthName}</Text>
                    <View style={styles.monthGrid}>
                        {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
                          <View key={dayOfWeek} style={styles.dayRow}>
                              {monthData.weeks.map((week, wi) => {
                                  const dayData = week[dayOfWeek];
                                  const dayColor = dayData.isInCurrentMonth && dayData.completionCount > 0
                                    ? getCompletionColorForDay(dayData.completionCount)
                                    : (dayData.isFuture ? '#222' : '#333');
                                  return (
                                    <View
                                      key={wi}
                                      style={[
                                          styles.commitDay,
                                          !dayData.isInCurrentMonth && styles.commitDayOutside,
                                          dayData.isInCurrentMonth && { backgroundColor: dayColor },
                                      ]}
                                    />
                                  );
                              })}
                          </View>
                        ))}
                    </View>
                </View>
              ))}
          </ScrollView>
      </View>
    );
});

// Month calendar component
const MonthCalendar = memo(({ completionCounts, completionsPerDay, color, onToggleDate }) => {
    const today = new Date();
    const maxMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const minMonth = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    const [viewMonth, setViewMonth] = useState(maxMonth);

    const normalizeDate = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const generateMonthCalendar = (monthDate) => {
        const todayNorm = normalizeDate(new Date());
        const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        // Bắt đầu từ chủ nhật của tuần chứa ngày 1
        const startOfWeek = new Date(start);
        startOfWeek.setDate(start.getDate() - start.getDay());

        // Kết thúc ở thứ bảy của tuần chứa ngày cuối cùng
        const endOfWeek = new Date(end);
        endOfWeek.setDate(end.getDate() + (6 - end.getDay()));

        const weeks = [];
        let current = new Date(startOfWeek);

        while (current <= endOfWeek) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                const cd = normalizeDate(current);
                const dateString = cd.toISOString().split('T')[0];
                const isInMonth = cd.getMonth() === monthDate.getMonth();
                const isToday = cd.getTime() === todayNorm.getTime();
                const isFuture = cd > todayNorm && !isToday;
                const count = completionCounts[dateString] || 0;

                week.push({
                    date: cd,
                    dateString,
                    isInMonth,
                    isToday,
                    isFuture,
                    count,
                });

                current.setDate(current.getDate() + 1);
            }
            weeks.push(week);
        }

        return weeks;
    };

    const goPrevMonth = () => {
        const prev = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
        if (prev < minMonth) return;
        setViewMonth(prev);
    };

    const goNextMonth = () => {
        const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
        if (next > maxMonth) return;
        setViewMonth(next);
    };

    const getCompletionColorForDay = (completionCount) => {
        const baseColor = color || '#34C759';
        if (completionCount === 0) return '#333';
        if (completionsPerDay === 1) return baseColor;

        const percentage = Math.min(completionCount / completionsPerDay, 1);
        const opacity = 0.3 + (percentage * 0.7);
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const weeks = useMemo(() => generateMonthCalendar(viewMonth), [viewMonth, completionCounts, completionsPerDay, color]);

    const monthLabel = viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
      <View style={{ marginTop: 12 }}>
          <View style={styles.monthNavRow}>
              <TouchableOpacity onPress={goPrevMonth} style={styles.navIcon}>
                  <Icon name="chevron-left" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{monthLabel}</Text>
              <TouchableOpacity onPress={goNextMonth} style={styles.navIcon}>
                  <Icon name="chevron-right" size={24} color="#fff" />
              </TouchableOpacity>
          </View>
          <View style={styles.weekDaysHeader}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Text key={i} style={styles.weekDayText}>{d}</Text>
              ))}
          </View>
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
                {week.map((day, di) => {
                    const disabled = day.isFuture;
                    const bg = day.isInMonth
                      ? (day.count > 0 ? getCompletionColorForDay(day.count) : '#333')
                      : 'transparent';

                    console.log(day, day.date.getDate())
                    return (
                      <TouchableOpacity
                        key={di}
                        style={[
                            styles.dayButton,
                            day.isToday && styles.todayButton,
                            disabled && styles.futureDay,
                            day.isInMonth && { backgroundColor: bg },
                        ]}
                        onPress={() => {
                            if (!disabled) onToggleDate(day.dateString);
                        }}
                        disabled={disabled}
                      >
                          <Text
                            style={[
                                styles.dayText,
                                day.isToday && styles.todayText,
                                disabled && styles.futureDayText,
                                day.isInMonth && day.count > 0 && styles.completedDayText,
                            ]}
                          >
                              {day.date.getDate()}
                          </Text>
                          <View style={{ position: 'absolute', bottom: 0 }}>
                              {day.count > 0 && completionsPerDay > 1 ? (
                                <Text style={styles.smallCountText}>
                                    {day.count}/{completionsPerDay}
                                </Text>
                              ) : (
                                <Text style={styles.smallCountTextEmpty}> </Text>
                              )}
                          </View>
                      </TouchableOpacity>
                    );
                })}
            </View>
          ))}
      </View>
    );
});

const HabitDetailScreen = ({ navigation, route }) => {
    const [habitInfo, setHabitInfo] = useState({
        id: route.params.habit.id,
        name: route.params.habit.name,
        icon: route.params.habit.icon,
        color: route.params.habit.color,
        description: route.params.habit.description,
        completionsPerDay: route.params.habit.completionsPerDay,
        goalStreak: route.params.habit.goalStreak,
    });
    const [completionCounts, setCompletionCounts] = useState(route.params.habit.completionCounts || {});
    const [completions, setCompletions] = useState(route.params.habit.completions || []);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [totalCompletions, setTotalCompletions] = useState(0);
    const [showDialog, setShowDialog] = useState(false);

    // Persist habit data to AsyncStorage
    const persistHabitUpdate = async (updatedData) => {
        try {
            const habitsData = await AsyncStorage.getItem('habits');
            const habits = habitsData ? JSON.parse(habitsData) : [];
            const updatedHabits = habits.map((h) =>
              h.id === habitInfo.id
                ? { ...h, completionCounts, completions, ...updatedData }
                : h
            );
            await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
        } catch (error) {
            console.error('Error persisting habit:', error);
        }
    };

    // Update completion count for a specific date
    const setCompletionCount = async (dateString, count) => {
        const newCompletionCounts = { ...completionCounts };
        const newCompletions = [...completions];

        if (count === 0) {
            delete newCompletionCounts[dateString];
            const idx = newCompletions.indexOf(dateString);
            if (idx > -1) newCompletions.splice(idx, 1);
        } else {
            newCompletionCounts[dateString] = count;
            if (count >= habitInfo.completionsPerDay && !newCompletions.includes(dateString)) {
                newCompletions.push(dateString);
            } else if (count < habitInfo.completionsPerDay && newCompletions.includes(dateString)) {
                const idx = newCompletions.indexOf(dateString);
                if (idx > -1) newCompletions.splice(idx, 1);
            }
        }

        setCompletionCounts(newCompletionCounts);
        setCompletions(newCompletions);
        await persistHabitUpdate({ completionCounts: newCompletionCounts, completions: newCompletions });
    };

    // Toggle date completion
    const toggleDate = async (dateString) => {
        const currentCount = completionCounts[dateString] || 0;
        let newCount;

        if (habitInfo.completionsPerDay === 1) {
            newCount = currentCount >= 1 ? 0 : 1;
        } else {
            if (currentCount >= habitInfo.completionsPerDay) newCount = 0;
            else newCount = currentCount + 1;
        }

        await setCompletionCount(dateString, newCount);
    };

    // Calculate stats
    useEffect(() => {
        setTotalCompletions(completions.length);

        // Current streak
        const todayDate = new Date();
        let streak = 0;
        let check = new Date(todayDate);
        while (true) {
            const d = check.toISOString().split('T')[0];
            if (completions.includes(d)) {
                streak++;
                check.setDate(check.getDate() - 1);
            } else break;
        }
        setCurrentStreak(streak);

        // Longest streak
        if (completions.length === 0) {
            setLongestStreak(0);
            return;
        }
        const sorted = completions.map((s) => new Date(s)).sort((a, b) => a - b);
        let maxStreak = 1,
          cur = 1;
        for (let i = 1; i < sorted.length; i++) {
            const diffDays = (sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24);
            if (diffDays === 1) cur++;
            else {
                if (cur > maxStreak) maxStreak = cur;
                cur = 1;
            }
        }
        maxStreak = Math.max(maxStreak, cur);
        setLongestStreak(maxStreak);
    }, [completions]);

    return (
      <SafeAreaView style={styles.container}>
          <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                  <Icon name="arrow-left" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.title}>Habit Details</Text>
              <View style={{ width: 36 }} />
          </View>
          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
              <HabitInfo
                name={habitInfo.name}
                icon={habitInfo.icon}
                color={habitInfo.color}
                description={habitInfo.description}
              />
              <HistoryGrid
                completionCounts={completionCounts}
                completionsPerDay={habitInfo.completionsPerDay}
                color={habitInfo.color}
              />
              <StreakBar
                currentStreak={currentStreak}
                goalStreak={habitInfo.goalStreak}
                onEdit={() => setShowDialog(true)}
                onSettings={() => setShowDialog(true)}
              />
              <MonthCalendar
                completionCounts={completionCounts}
                completionsPerDay={habitInfo.completionsPerDay}
                color={habitInfo.color}
                onToggleDate={toggleDate}
              />
          </ScrollView>
          <ComingSoonDialog visible={showDialog} onClose={() => setShowDialog(false)} />
      </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1a1a1a' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: { padding: 8 },
    title: { fontSize: 18, fontWeight: '600', color: '#fff' },
    content: { flex: 1, paddingHorizontal: 20 },
    habitInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        padding: 8,
        borderRadius: 12,
    },
    habitIcon: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    habitText: { flex: 1 },
    habitName: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 4 },
    habitDescription: { fontSize: 13, color: '#999' },
    commitGridScroll: { marginTop: 8, transform: [{ scaleX: -1 }] },
    monthColumn: { marginRight: 7, alignItems: 'center', transform: [{ scaleX: -1 }] },
    monthLabel: { color: '#999', fontSize: 10, fontWeight: '500', marginBottom: 6, textAlign: 'center', width: 32 },
    monthGrid: { flexDirection: 'column' },
    dayRow: { flexDirection: 'row', marginBottom: 2 },
    commitDay: { width: 7, height: 7, backgroundColor: '#333', borderRadius: 2, marginRight: 2 },
    commitDayOutside: { backgroundColor: 'transparent' },
    streakBar: {
        height: 50,
        width: '100%',
        backgroundColor: '#2a2a2a',
        borderRadius: 10,
        marginTop: 12,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    streakLeft: { flexDirection: 'row', alignItems: 'center' },
    targetBlock: { marginRight: 12, alignItems: 'flex-start' },
    targetLabel: { color: '#999', fontSize: 11 },
    targetValue: { color: '#fff', fontWeight: '700', fontSize: 14 },
    flakeBlock: { flexDirection: 'row', alignItems: 'center', paddingLeft: 6 },
    flameCount: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 6 },
    streakRight: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { padding: 8, marginLeft: 8 },
    monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    navIcon: { padding: 6 },
    monthTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
    weekDaysHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    weekDayText: { color: '#666', fontSize: 12, fontWeight: '500', width: 32, textAlign: 'center' },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    dayButton: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    todayButton: { borderWidth: 2, borderColor: '#007AFF' },
    futureDay: { backgroundColor: '#1a1a1a' },
    dayText: { color: '#fff', fontSize: 12, fontWeight: '500' },
    completedDayText: { color: '#fff', fontWeight: 'bold' },
    todayText: { color: '#007AFF', fontWeight: 'bold' },
    futureDayText: { color: '#444' },
    smallCountText: { fontSize: 7, color: '#ddd', textAlign: 'center' },
    smallCountTextEmpty: { fontSize: 9, color: 'transparent' },
});

export default HabitDetailScreen;