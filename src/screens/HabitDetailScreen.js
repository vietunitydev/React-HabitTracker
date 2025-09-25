import React, {useState, useEffect, useRef} from 'react';
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

const HabitDetailScreen = ({navigation, route}) => {
    const [habit, setHabit] = useState(route.params.habit);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [totalCompletions, setTotalCompletions] = useState(0);
    const [showDialog, setShowDialog] = useState(false);


    // For month navigation in calendar (Google-like)
    const today = new Date();
    const maxMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const minMonth = new Date(today.getFullYear(), today.getMonth() - 11, 1); // allow 1 year back
    const [viewMonth, setViewMonth] = useState(maxMonth);

    // scroll ref for history grid
    const scrollRef = useRef(null);

    useEffect(() => {
        calculateStats();
    }, [habit]);

    // Helper: get completion count for a date (habit.completionCounts map)
    const getCompletionCount = (h, date) => {
        if (!h) return 0;
        const cc = h.completionCounts || {};
        return cc[date] || 0;
    };

    // Save updated habit to AsyncStorage and state
    const persistHabitUpdate = async (updatedHabit) => {
        setHabit(updatedHabit);
        try {
            const habitsData = await AsyncStorage.getItem('habits');
            const habits = habitsData ? JSON.parse(habitsData) : [];
            const updatedHabits = habits.map(h => (h.id === updatedHabit.id ? updatedHabit : h));
            await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
        } catch (error) {
            console.error('Error persisting habit:', error);
        }
    };

    // Set completion count for a specific date (handles completions array)
    const setCompletionCount = async (dateString, count) => {
        const completionsPerDay = habit.completionsPerDay || 1;
        const completionCounts = {...(habit.completionCounts || {})};
        const completions = Array.isArray(habit.completions) ? [...habit.completions] : [];

        if (count === 0) {
            delete completionCounts[dateString];
            const idx = completions.indexOf(dateString);
            if (idx > -1) completions.splice(idx, 1);
        } else {
            completionCounts[dateString] = count;
            if (count >= completionsPerDay && !completions.includes(dateString)) {
                completions.push(dateString);
            } else if (count < completionsPerDay && completions.includes(dateString)) {
                const idx = completions.indexOf(dateString);
                if (idx > -1) completions.splice(idx, 1);
            }
        }

        const updatedHabit = {...habit, completionCounts, completions};
        await persistHabitUpdate(updatedHabit);
    };

    // Toggle behavior when user taps a date cell
    const toggleDate = async (dateString) => {
        const completionsPerDay = habit.completionsPerDay || 1;
        const currentCount = getCompletionCount(habit, dateString);
        let newCount;

        if (completionsPerDay === 1) {
            newCount = currentCount >= 1 ? 0 : 1;
        } else {
            if (currentCount >= completionsPerDay) newCount = 0;
            else newCount = currentCount + 1;
        }

        await setCompletionCount(dateString, newCount);
    };

    const calculateStats = () => {
        const completions = habit.completions || [];
        setTotalCompletions(completions.length);

        // current streak
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

        // longest streak
        if (completions.length === 0) {
            setLongestStreak(0);
            return;
        }
        const sorted = completions.map(s => new Date(s)).sort((a,b)=>a-b);
        let maxStreak = 1, cur = 1;
        for (let i=1;i<sorted.length;i++){
            const diffDays = (sorted[i]-sorted[i-1])/(1000*60*60*24);
            if (diffDays === 1) cur++;
            else {
                if (cur > maxStreak) maxStreak = cur;
                cur = 1;
            }
        }
        maxStreak = Math.max(maxStreak, cur);
        setLongestStreak(maxStreak);
    };

    // Generate commit grid (12 months back) - same logic as HomeScreen
    const generateCommitGrid = (h) => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const grid = [];
        const completions = h.completions || [];

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
                    const isInCurrentMonth = currentDate.getMonth() === month;
                    const completionCount = getCompletionCount(h, dateString);
                    const isCompleted = completions.includes(dateString);
                    const isFuture = currentDate > now;

                    weekDays.push({
                        date: dateString,
                        completionCount,
                        isCompleted,
                        isInCurrentMonth,
                        isFuture,
                    });
                }
                monthGrid.push(weekDays);
            }

            grid.push({
                year,
                month,
                monthName: firstDay.toLocaleString('default', { month: 'short' }),
                weeks: monthGrid
            });
        }

        return grid.reverse();
    };

    // Calendar for one month (viewMonth)
    const generateMonthCalendar = (monthDate) => {
        const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        const startOfWeek = new Date(start);
        startOfWeek.setDate(start.getDate() - start.getDay());
        const weeks = [];
        for (let w=0; w<6; w++){
            const week = [];
            for (let d=0; d<7; d++){
                const cd = new Date(startOfWeek);
                cd.setDate(startOfWeek.getDate() + w*7 + d);
                const dateString = cd.toISOString().split('T')[0];
                const isInMonth = cd.getMonth() === monthDate.getMonth();
                const isToday = dateString === new Date().toISOString().split('T')[0];
                const isFuture = cd > today;
                const count = getCompletionCount(habit, dateString);
                week.push({
                    date: cd,
                    dateString,
                    isInMonth,
                    isToday,
                    isFuture,
                    count,
                });
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

    // UI components
    const HistoryGrid = ({h}) => {
        const grid = generateCommitGrid(h);
        useEffect(()=> {
            // scroll to end on mount
            if (scrollRef.current && scrollRef.current.scrollToEnd) {
                setTimeout(()=> scrollRef.current.scrollToEnd({animated:false}), 50);
            }
        }, [h]);
        return (
          <View style={{marginTop: 1}}>
              <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                // contentContainerStyle={{paddingRight: 12}}
              >
                  {grid.map((monthData, i) => (
                    <View key={i} style={styles.monthColumn}>
                        <Text style={styles.monthLabel}>{monthData.monthName}</Text>
                        <View style={styles.monthGrid}>
                            {[0,1,2,3,4,5,6].map(dayOfWeek => (
                              <View key={dayOfWeek} style={styles.dayRow}>
                                  {monthData.weeks.map((week, wi) => {
                                      const dayData = week[dayOfWeek];
                                      const dayColor = dayData.isInCurrentMonth && dayData.completionCount > 0
                                        ? getCompletionColorForDay(h, dayData.completionCount)
                                        : (dayData.isFuture ? '#222' : '#333');
                                      return (
                                        <View
                                          key={wi}
                                          style={[
                                              styles.commitDay,
                                              !dayData.isInCurrentMonth && styles.commitDayOutside,
                                              dayData.isInCurrentMonth && { backgroundColor: dayColor }
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
    };

    // reuse color calc from HomeScreen logic (simple)
    const getCompletionColorForDay = (h, completionCount) => {
        const completionsPerDay = h.completionsPerDay || 1;
        const baseColor = h.color || '#34C759';

        if (completionCount === 0) return '#333';
        if (completionsPerDay === 1) return baseColor;

        const percentage = Math.min(completionCount / completionsPerDay, 1);
        const opacity = 0.3 + (percentage * 0.7);
        const hex = baseColor.replace('#','');
        const r = parseInt(hex.substr(0,2),16);
        const g = parseInt(hex.substr(2,2),16);
        const b = parseInt(hex.substr(4,2),16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    // Render Google-like month calendar
    const renderMonthCalendar = () => {
        const weeks = generateMonthCalendar(viewMonth);
        const monthLabel = viewMonth.toLocaleString('default', {month: 'long', year: 'numeric'});
        const completionsPerDay = habit.completionsPerDay || 1;

        return (
          <View style={{marginTop: 12}}>
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
                  {['S','M','T','W','T','F','S'].map((d,i)=>(
                    <Text key={i} style={styles.weekDayText}>{d}</Text>
                  ))}
              </View>

              {weeks.map((week, wi) => (
                <View key={wi} style={styles.weekRow}>
                    {week.map((day, di) => {
                        const disabled = day.isFuture;
                        const bg = day.isInMonth
                          ? (day.count > 0 ? getCompletionColorForDay(habit, day.count) : '#333')
                          : 'transparent';
                        return (
                          <TouchableOpacity
                            key={di}
                            style={[
                                styles.dayButton,
                                day.isToday && styles.todayButton,
                                disabled && styles.futureDay,
                                day.isInMonth && { backgroundColor: bg }
                            ]}
                            onPress={() => {
                                if (!disabled) toggleDate(day.dateString);
                            }}
                            disabled={disabled}
                          >
                              <Text style={[
                                  styles.dayText,
                                  day.isToday && styles.todayText,
                                  disabled && styles.futureDayText,
                                  day.isInMonth && day.count > 0 && styles.completedDayText
                              ]}>
                                  {day.date.getDate()}
                              </Text>

                              {/* small counter under the day */}

                              <View style={{position:'absolute', bottom:0}}>
                                  { (day.count > 0 && completionsPerDay > 1) ? (
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
    };

    return (
      <SafeAreaView style={styles.container}>
          <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                  <Icon name="arrow-left" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.title}>Habit Details</Text>
              <View style={{width:36}} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{paddingBottom: 40}}>
              {/* Habit Info */}
              <View style={styles.habitInfo}>
                  <View style={[styles.habitIcon, {backgroundColor: habit.color}]}>
                      <Icon name={habit.icon} size={32} color="#fff" />
                  </View>
                  <View style={styles.habitText}>
                      <Text style={styles.habitName}>{habit.name}</Text>
                      {habit.description && (
                        <Text style={styles.habitDescription}>{habit.description}</Text>
                      )}
                  </View>
              </View>

              {/* History (scrollable commit grid) */}
              <View style={{marginTop: 12}}>
                  {/*<Text style={styles.sectionTitleSmall}>History</Text>*/}
                  <HistoryGrid h={habit} />
              </View>

              {/* Streak bar (~50px high) */}
              <View style={styles.streakBar}>
                  <View style={styles.streakLeft}>
                      <View style={styles.targetBlock}>
                          <Text style={styles.targetLabel}>Target</Text>
                          <Text style={styles.targetValue}>{habit.goalStreak || '-'}</Text>
                      </View>

                      <View style={styles.flameBlock}>
                          <Icon name="fire" size={20} color="#FF6B6B" />
                          <Text style={styles.flameCount}>{currentStreak}</Text>
                      </View>
                  </View>

                  <View style={styles.streakRight}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        // onPress={() => navigation.navigate('CreateHabit', {habit})}
                        onPress={() => setShowDialog(true)}
                      >
                          <Icon name="pencil" size={20} color="#fff" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.iconButton}
                        // onPress={() => navigation.navigate('Settings')}
                        onPress={() => setShowDialog(true)}
                      >
                          <Icon name="cog" size={20} color="#fff" />
                      </TouchableOpacity>

                      {/*<ComingSoonButton label="Sửa" icon="pencil" />*/}
                      {/*<ComingSoonButton label="Cài đặt" icon="cog" />*/}

                  </View>
              </View>

              {/* Month calendar (google-like) */}
              <View style={{marginTop: 12}}>
                  {/*<Text style={styles.sectionTitleSmall}>Calendar</Text>*/}
                  {renderMonthCalendar()}
              </View>

              {/* Danger Zone */}
              {/*<View style={{marginTop: 20}}>*/}
              {/*    <Text style={styles.sectionTitleSmall}>Danger Zone</Text>*/}
              {/*    <TouchableOpacity*/}
              {/*      style={[styles.actionButton, styles.deleteButton]}*/}
              {/*      onPress={async () => {*/}
              {/*          Alert.alert(*/}
              {/*            'Delete Habit',*/}
              {/*            'Are you sure you want to delete this habit? This action cannot be undone.',*/}
              {/*            [*/}
              {/*                {text: 'Cancel', style: 'cancel'},*/}
              {/*                {text: 'Delete', style: 'destructive', onPress: async () => {*/}
              {/*                        try {*/}
              {/*                            const habitsData = await AsyncStorage.getItem('habits');*/}
              {/*                            const habits = habitsData ? JSON.parse(habitsData) : [];*/}
              {/*                            const updatedHabits = habits.filter(h => h.id !== habit.id);*/}
              {/*                            await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));*/}
              {/*                            navigation.goBack();*/}
              {/*                        } catch (error) {*/}
              {/*                            console.error('Error deleting habit:', error);*/}
              {/*                            Alert.alert('Error', 'Failed to delete habit');*/}
              {/*                        }*/}
              {/*                    }},*/}
              {/*            ]*/}
              {/*          );*/}
              {/*      }}*/}
              {/*    >*/}
              {/*        <Icon name="delete" size={20} color="#F44336" />*/}
              {/*        <Text style={[styles.actionButtonText, {marginLeft: 12}]}>Delete Habit</Text>*/}
              {/*    </TouchableOpacity>*/}
              {/*</View>*/}
          </ScrollView>

          <ComingSoonDialog
            visible={showDialog}
            onClose={() => setShowDialog(false)}
          />
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

    sectionTitleSmall: { color: '#999', fontSize: 12, marginBottom: 8 },

    // History grid styles (reused look)
    monthColumn: { marginRight: 7, alignItems: 'center' },
    monthLabel: { color: '#999', fontSize: 10, fontWeight: '500', marginBottom: 6, textAlign: 'center', width: 32 },
    monthGrid: { flexDirection: 'column' },
    dayRow: { flexDirection: 'row', marginBottom: 2 },
    commitDay: { width: 7, height: 7, backgroundColor: '#333', borderRadius: 2, marginRight: 2 },
    commitDayOutside: { backgroundColor: 'transparent' },

    // Streak bar
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
    flameBlock: { flexDirection: 'row', alignItems: 'center' , paddingLeft: 6},
    flameCount: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 6 },

    streakRight: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { padding: 8, marginLeft: 8 },

    // Month calendar
    monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    navIcon: { padding: 6 },
    monthTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },

    weekDaysHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    weekDayText: { color: '#666', fontSize: 12, fontWeight: '500', width: 32, textAlign: 'center' },

    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    dayButton: {
        width: 32, height: 32, borderRadius: 6, backgroundColor: '#333',
        justifyContent: 'center', alignItems: 'center', position: 'relative'
    },
    todayButton: { borderWidth: 2, borderColor: '#007AFF' },
    futureDay: { backgroundColor: '#1a1a1a' },

    dayText: { color: '#fff', fontSize: 12, fontWeight: '500' },
    completedDayText: { color: '#fff', fontWeight: 'bold' },
    todayText: { color: '#007AFF', fontWeight: 'bold' },
    futureDayText: { color: '#444' },

    smallCountText: { fontSize: 7, color: '#ddd', textAlign: 'center' },
    smallCountTextEmpty: { fontSize: 9, color: 'transparent' },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statNumber: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    statLabel: { fontSize: 14, color: '#999', textAlign: 'center' },

    // Danger / action
    actionButton: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', padding: 16, borderRadius: 8, marginTop: 8
    },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '500', marginLeft: 12 },
    deleteButton: { backgroundColor: '#2a1a1a' },
    deleteButtonText: { color: '#F44336' },
});

export default HabitDetailScreen;
