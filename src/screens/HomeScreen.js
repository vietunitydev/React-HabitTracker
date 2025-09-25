import React, {useState, useEffect, useRef} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
    Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const {width} = Dimensions.get('window');

const HomeScreen = ({navigation}) => {
    const [habits, setHabits] = useState([]);
    const [longPressedHabit, setLongPressedHabit] = useState(null);
    const [overlayOpacity] = useState(new Animated.Value(0));
    const [habitScale] = useState(new Animated.Value(1));
    const scrollRefs = useRef({});
    useEffect(() => {
        loadHabits();
    }, []);

    const loadHabits = async () => {
        try {
            const habitsData = await AsyncStorage.getItem('habits');
            if (habitsData) {
                setHabits(JSON.parse(habitsData));
                console.log(habitsData);
            }
        } catch (error) {
            console.error('Error loading habits:', error);
        }
    };

    // Get completion count for a specific date
    const getCompletionCount = (habit, date) => {
        if (!habit.completionCounts || !habit.completionCounts[date]) {
            return 0;
        }
        return habit.completionCounts[date];
    };

    // Set completion count for a specific date
    const setCompletionCount = async (habitId, date, count) => {
        const updatedHabits = habits.map(habit => {
            if (habit.id === habitId) {
                const completionCounts = habit.completionCounts || {};
                const completions = habit.completions || [];

                if (count === 0) {
                    delete completionCounts[date];
                    // Remove from completions array if exists
                    const dateIndex = completions.indexOf(date);
                    if (dateIndex > -1) {
                        completions.splice(dateIndex, 1);
                    }
                } else {
                    completionCounts[date] = count;
                    // Add to completions array if not exists and fully completed
                    const completionsPerDay = habit.completionsPerDay || 1;
                    if (count >= completionsPerDay && !completions.includes(date)) {
                        completions.push(date);
                    } else if (count < completionsPerDay && completions.includes(date)) {
                        const dateIndex = completions.indexOf(date);
                        completions.splice(dateIndex, 1);
                    }
                }

                return {...habit, completionCounts, completions};
            }
            return habit;
        });

        setHabits(updatedHabits);
        await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
    };

    const toggleHabitCompletion = async (habitId, date) => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        const completionsPerDay = habit.completionsPerDay || 1;
        const currentCount = getCompletionCount(habit, date);

        let newCount;
        if (completionsPerDay === 1) {
            // Toggle behavior for single completion per day
            newCount = currentCount >= 1 ? 0 : 1;
        } else {
            // Increment behavior for multiple completions per day
            if (currentCount >= completionsPerDay) {
                newCount = 0; // Reset to 0 if already at max
            } else {
                newCount = currentCount + 1;
            }
        }

        await setCompletionCount(habitId, date, newCount);
    };

    const handleLongPress = (habit) => {
        setLongPressedHabit(habit);

        // Animate overlay and scale
        Animated.parallel([
            Animated.timing(overlayOpacity, {
                toValue: 0.5,
                duration: 200,
                useNativeDriver: false,
            }),
            Animated.timing(habitScale, {
                toValue: 1.05,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleLongPressEnd = () => {
        Animated.parallel([
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
            Animated.timing(habitScale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setLongPressedHabit(null);
        });
    };

    const handleEditHabit = () => {
        if (longPressedHabit) {
            handleLongPressEnd();
            // Navigate to edit habit screen
            navigation.navigate('CreateHabit', { habit: longPressedHabit });
        }
    };

    const handleArchiveHabit = () => {
        if (longPressedHabit) {
            // Archive habit logic here
            const updatedHabits = habits.filter(habit => habit.id !== longPressedHabit.id);
            setHabits(updatedHabits);
            AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
            handleLongPressEnd();
        }
    };

    // Get color with opacity based on completion percentage
    const getCompletionColor = (habit, completionCount) => {
        const completionsPerDay = habit.completionsPerDay || 1;
        const baseColor = habit.color || '#34C759';

        if (completionCount === 0) {
            return '#333';
        }

        if (completionsPerDay === 1) {
            return baseColor;
        }

        // Calculate opacity based on completion percentage
        const percentage = Math.min(completionCount / completionsPerDay, 1);
        const opacity = 0.3 + (percentage * 0.7); // Min opacity 0.3, max 1.0

        // Convert hex to rgba
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const generateCommitGrid = (habit) => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Tạo grid cho 12 tháng (từ tháng hiện tại về trước)
        const grid = [];
        const completions = habit.completions || [];

        for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
            const targetDate = new Date(currentYear, currentMonth - monthOffset, 1);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();

            // Tạo ma trận 7x4/5 tuần cho mỗi tháng
            const monthGrid = [];
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            // Tìm ngày đầu tuần của tuần chứa ngày 1
            const startOfWeek = new Date(firstDay);
            startOfWeek.setDate(firstDay.getDate() - firstDay.getDay());

            // Tạo 6 tuần để đảm bảo đủ chỗ cho tháng
            for (let week = 0; week < 6; week++) {
                const weekDays = [];
                for (let day = 0; day < 7; day++) {
                    const currentDate = new Date(startOfWeek);
                    currentDate.setDate(startOfWeek.getDate() + week * 7 + day);

                    const dateString = currentDate.toISOString().split('T')[0];
                    const isInCurrentMonth = currentDate.getMonth() === month;
                    const completionCount = getCompletionCount(habit, dateString);
                    const isCompleted = completions.includes(dateString);
                    const isFuture = currentDate > today;

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

    // Progress Circle Component
    const ProgressCircle = ({ progress, size = 28, strokeWidth = 2, color = '#34C759' }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const strokeDasharray = `${circumference} ${circumference}`;
        const strokeDashoffset = circumference - progress * circumference;

        return (
          <View style={[styles.progressCircle, { width: size, height: size }]}>
              <Animated.View style={styles.progressBackground}>
                  {/* Background circle */}
                  <View style={[styles.progressRing, {
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      borderWidth: strokeWidth,
                      borderColor: '#333'
                  }]} />

                  {/* Progress overlay - simplified version using border */}
                  {progress > 0 && (
                    <View style={[styles.progressRing, {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: strokeWidth,
                        borderColor: color,
                        borderTopColor: progress >= 1 ? color : '#333',
                        borderRightColor: progress >= 0.25 ? color : '#333',
                        borderBottomColor: progress >= 0.5 ? color : '#333',
                        borderLeftColor: progress >= 0.75 ? color : '#333',
                        position: 'absolute'
                    }]} />
                  )}
              </Animated.View>
          </View>
        );
    };

    const HabitItem = ({habit}) => {
        if (!habit || !habit.id) {
            return null;
        }

        const commitGrid = generateCommitGrid(habit);
        const today = new Date().toISOString().split('T')[0];
        const completionsPerDay = habit.completionsPerDay || 1;
        const todayCompletionCount = getCompletionCount(habit, today);
        const todayCompleted = todayCompletionCount >= completionsPerDay;
        const progress = completionsPerDay > 1 ? todayCompletionCount / completionsPerDay : (todayCompleted ? 1 : 0);
        const isLongPressed = longPressedHabit?.id === habit.id;

        const scrollToEnd = () => {
            if (!habit?.id) return;
            const scrollRef = scrollRefs.current[habit.id];
            if (scrollRef) {
                // Sử dụng setTimeout để đảm bảo ScrollView đã render xong
                setTimeout(() => {
                    scrollRef.scrollToEnd({ animated: false });
                }, 50);
            }
        };

        return (
          <Animated.View
            style={[
                styles.habitItem,
                isLongPressed && {
                    transform: [{ scale: habitScale }],
                    zIndex: 1000,
                }
            ]}
          >
              <TouchableOpacity
                style={styles.habitHeader}
                onPress={() => !longPressedHabit && navigation.navigate('HabitDetail', {habit})}
                onLongPress={() => handleLongPress(habit)}
                delayLongPress={500}
                activeOpacity={0.7}
              >
                  <View style={styles.habitInfo}>
                      <View style={[styles.habitIcon, {backgroundColor: habit.color}]}>
                          <Icon name={habit.icon} size={20} color="#fff" />
                      </View>
                      <View style={styles.habitText}>
                          <Text style={styles.habitName}>{habit.name}</Text>
                          <Text style={styles.habitDescription}>{habit.description}</Text>
                          {/*{completionsPerDay > 1 && (*/}
                          {/*  <Text style={styles.habitProgress}>*/}
                          {/*      {todayCompletionCount}/{completionsPerDay} completed today*/}
                          {/*  </Text>*/}
                          {/*)}*/}
                      </View>
                  </View>

                  <TouchableOpacity
                    style={styles.checkButtonContainer}
                    onPress={(e) => {
                        e.stopPropagation();
                        if (!longPressedHabit) {
                            toggleHabitCompletion(habit.id, today);
                        }
                    }}>
                      {completionsPerDay === 1 ? (
                        // Simple check button for single completion
                        <View style={[
                            styles.checkButton,
                            todayCompleted && styles.checkButtonCompleted,
                        ]}>
                            <Icon
                              name="check"
                              size={16}
                              color={todayCompleted ? '#fff' : '#666'}
                            />
                        </View>
                      ) : (
                        // Progress circle for multiple completions
                        <View style={styles.progressContainer}>
                            {progress >= 1 ? (
                              <View style={[styles.checkButton, styles.checkButtonCompleted]}>
                                  <Icon name="check" size={16} color="#fff" />
                              </View>
                            ) : (
                              <>
                                  <ProgressCircle
                                    progress={progress}
                                    color={habit.color || '#34C759'}
                                  />
                                  <View style={styles.progressText}>
                                      <Text style={styles.progressCount}>
                                          {todayCompletionCount}
                                      </Text>
                                  </View>
                              </>
                            )}
                        </View>
                      )}
                  </TouchableOpacity>
              </TouchableOpacity>

              <View style={styles.commitGridContainer}>
                  <ScrollView
                    ref={(ref) => {
                        if (habit?.id && ref) {
                            scrollRefs.current[habit.id] = ref;
                        }
                    }}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.commitGridScroll}
                    contentContainerStyle={styles.commitGridContent}
                    scrollEnabled={!longPressedHabit}
                    onContentSizeChange={scrollToEnd}
                    onLayout={scrollToEnd}
                  >
                      {commitGrid.map((monthData, monthIndex) => (
                        <View key={monthIndex} style={styles.monthColumn}>
                            <Text style={styles.monthLabel}>{monthData.monthName}</Text>
                            <View style={styles.monthGrid}>
                                {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => (
                                  <View key={dayOfWeek} style={styles.dayRow}>
                                      {monthData.weeks.map((week, weekIndex) => {
                                          const dayData = week[dayOfWeek];
                                          const dayColor = dayData.isInCurrentMonth && dayData.completionCount > 0
                                            ? getCompletionColor(habit, dayData.completionCount)
                                            : (dayData.isFuture ? '#222' : '#333');

                                          return (
                                            <View
                                              key={weekIndex}
                                              style={[
                                                  styles.commitDay,
                                                  !dayData.isInCurrentMonth && styles.commitDayOutside,
                                                  dayData.isInCurrentMonth && {
                                                      backgroundColor: dayColor || '#34C759'
                                                  },
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
          </Animated.View>
        );
    };

    return (
      <SafeAreaView style={styles.container}>
          {longPressedHabit && (
            <Animated.View
              style={[
                  styles.overlay,
                  { opacity: overlayOpacity }
              ]}
            />
          )}

          <View style={styles.header}>
              <View style={styles.leftHeader}>
                  <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => navigation.navigate('Settings')}>
                      <Icon name="cog" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.appTitle}>Habit Tracker</Text>
              </View>

              <View style={styles.headerActions}>
                  <TouchableOpacity style={styles.proButton}>
                      <Text style={styles.proButtonText}>PRO</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                      <Icon name="chart-line" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('CreateHabit')}>
                      <Icon name="plus-circle" size={24} color="#fff" />
                  </TouchableOpacity>
              </View>
          </View>

          <ScrollView
            style={styles.habitsList}
            scrollEnabled={!longPressedHabit}
          >
              {habits.filter(habit => habit && habit.id).map(habit => (
                <HabitItem key={habit.id} habit={habit} />
              ))}

              {habits.length === 0 && (
                <View style={styles.emptyState}>
                    <Icon name="format-list-checks" size={48} color="#444" />
                    <Text style={styles.emptyText}>No habits yet</Text>
                    <Text style={styles.emptySubtext}>
                        Tap the + button to create your first habit
                    </Text>
                </View>
              )}
          </ScrollView>

          {longPressedHabit && (
            <View style={styles.longPressMenu}>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={handleEditHabit}
                >
                    <Icon name="pencil" size={20} color="#fff" />
                    <Text style={styles.menuButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={handleArchiveHabit}
                >
                    <Icon name="archive" size={20} color="#fff" />
                    <Text style={styles.menuButtonText}>Archive</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuCancelButton}
                  onPress={handleLongPressEnd}
                >
                    <Icon name="close" size={20} color="#666" />
                    <Text style={styles.menuCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
          )}
      </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 999,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    leftHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsButton: {
        padding: 8,
        marginRight: 8,
    },
    appTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    proButton: {
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    proButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    habitsList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    habitItem: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    habitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    habitInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    habitIcon: {
        width: 32,
        height: 32,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    habitText: {
        flex: 1,
    },
    habitName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    habitDescription: {
        color: '#999',
        fontSize: 12,
        marginTop: 1,
    },
    habitProgress: {
        color: '#666',
        fontSize: 11,
        marginTop: 2,
        fontStyle: 'italic',
    },
    checkButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkButton: {
        width: 28,
        height: 28,
        borderRadius: 5,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkButtonCompleted: {
        backgroundColor: '#34C759',
    },
    progressContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressCircle: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressBackground: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressRing: {
        backgroundColor: 'transparent',
    },
    progressText: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressCount: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    commitGridContainer: {
        marginTop: 8,
    },
    commitGridScroll: {
        marginTop: 8,
    },
    commitGridContent: {
        paddingRight: 10,
    },
    monthColumn: {
        marginRight: 12,
        alignItems: 'center',
    },
    monthLabel: {
        color: '#999',
        fontSize: 10,
        fontWeight: '500',
        marginBottom: 6,
        textAlign: 'center',
        width: 32,
    },
    monthGrid: {
        flexDirection: 'column',
    },
    dayRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    commitDay: {
        width: 6,
        height: 6,
        backgroundColor: '#333',
        borderRadius: 1,
        marginRight: 2,
    },
    commitDayOutside: {
        backgroundColor: 'transparent',
    },
    commitDayFuture: {
        backgroundColor: '#222',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: '#666',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#555',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    longPressMenu: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        backgroundColor: '#333',
        borderRadius: 12,
        padding: 16,
        zIndex: 1001,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    menuButton: {
        alignItems: 'center',
        padding: 12,
        flex: 1,
    },
    menuButtonText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
    menuCancelButton: {
        alignItems: 'center',
        padding: 12,
        flex: 1,
    },
    menuCancelButtonText: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
});

export default HomeScreen;