import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
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

const { width } = Dimensions.get('window');

const ProgressCircle = ({ progress, size = 28, strokeWidth = 2, color = '#34C759' }) => {
    // const radius = (size - strokeWidth) / 2;
    // const circumference = radius * 2 * Math.PI;
    // const strokeDasharray = `${circumference} ${circumference}`;
    // const strokeDashoffset = circumference - progress * circumference;

    return (
      <View style={[styles.progressCircle, { width: size, height: size }]}>
          <Animated.View style={styles.progressBackground}>
              <View style={[styles.progressRing, {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: strokeWidth,
                  borderColor: '#333'
              }]} />
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

// HabitItem Component
const HabitItem = memo(({ habit, navigation, onArchive }) => {
    const [habitData, setHabitData] = useState(habit);
    const [commitGrid, setCommitGrid] = useState([]);
    const scrollRef = useRef(null);
    const [isLongPressed, setIsLongPressed] = useState(false);
    const [overlayOpacity] = useState(new Animated.Value(0));
    const [habitScale] = useState(new Animated.Value(1));

    const getCompletionCount = useCallback((date) => {
        return habitData.completionCounts?.[date] || 0;
    }, [habitData]);

    const getCompletionColor = useCallback((completionCount) => {
        const completionsPerDay = habitData.completionsPerDay || 1;
        const baseColor = habitData.color || '#34C759';

        if (completionCount === 0) {
            return '#333';
        }

        if (completionsPerDay === 1) {
            return baseColor;
        }

        const percentage = Math.min(completionCount / completionsPerDay, 1);
        const opacity = 0.3 + (percentage * 0.7);
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }, [habitData]);

    const generateCommitGrid = useCallback((habit) => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const grid = [];
        const completions = habit.completions || [];

        for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
            const targetDate = new Date(currentYear, currentMonth - monthOffset, 1);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();
            const monthGrid = [];
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startOfWeek = new Date(firstDay);
            startOfWeek.setDate(firstDay.getDate() - firstDay.getDay());

            for (let week = 0; week < 6; week++) {
                const weekDays = [];
                for (let day = 0; day < 7; day++) {
                    const currentDate = new Date(startOfWeek);
                    currentDate.setDate(startOfWeek.getDate() + week * 7 + day);
                    const dateString = currentDate.toISOString().split('T')[0];
                    const isInCurrentMonth = currentDate.getMonth() === month;
                    const completionCount = getCompletionCount(dateString);
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

        return grid;
    }, [getCompletionCount]);

    useEffect(() => {
        setCommitGrid(generateCommitGrid(habitData));
    }, [habitData, generateCommitGrid]);

    // const scrollToEnd = useCallback(() => {
    //     if (scrollRef.current) {
    //         setTimeout(() => {
    //             scrollRef.current.scrollToEnd({ animated: false });
    //         }, 50);
    //     }
    // }, []);

    const toggleHabitCompletion = async (date) => {
        const completionsPerDay = habitData.completionsPerDay || 1;
        const currentCount = getCompletionCount(date);
        let newCount;

        if (completionsPerDay === 1) {
            newCount = currentCount >= 1 ? 0 : 1;
        } else {
            newCount = currentCount >= completionsPerDay ? 0 : currentCount + 1;
        }

        const updatedCompletionCounts = {
            ...habitData.completionCounts,
            [date]: newCount
        };
        const completions = [...(habitData.completions || [])];

        if (newCount === 0) {
            const dateIndex = completions.indexOf(date);
            if (dateIndex > -1) {
                completions.splice(dateIndex, 1);
            }
        } else if (newCount >= completionsPerDay && !completions.includes(date)) {
            completions.push(date);
        } else if (newCount < completionsPerDay && completions.includes(date)) {
            const dateIndex = completions.indexOf(date);
            completions.splice(dateIndex, 1);
        }

        const updatedHabit = {
            ...habitData,
            completionCounts: updatedCompletionCounts,
            completions
        };

        setHabitData(updatedHabit);
        await AsyncStorage.setItem('habits', JSON.stringify(
          JSON.parse(await AsyncStorage.getItem('habits') || '[]').map(h =>
            h.id === habitData.id ? updatedHabit : h
          )
        ));
    };

    const handleLongPress = () => {
        setIsLongPressed(true);
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
            setIsLongPressed(false);
        });
    };

    const handleEditHabit = () => {
        handleLongPressEnd();
        navigation.navigate('CreateHabit', { habit: habitData });
    };

    const handleArchiveHabit = () => {
        onArchive(habitData.id);
        handleLongPressEnd();
    };

    const today = new Date().toISOString().split('T')[0];
    const completionsPerDay = habitData.completionsPerDay || 1;
    const todayCompletionCount = getCompletionCount(today);
    const todayCompleted = todayCompletionCount >= completionsPerDay;
    const progress = completionsPerDay > 1 ? todayCompletionCount / completionsPerDay : (todayCompleted ? 1 : 0);

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
          {isLongPressed && (
            <Animated.View
              style={[
                  styles.overlay,
                  { opacity: overlayOpacity }
              ]}
            />
          )}
          <TouchableOpacity
            style={styles.habitHeader}
            onPress={() => !isLongPressed && navigation.navigate('HabitDetail', { habit: habitData })}
            onLongPress={handleLongPress}
            delayLongPress={500}
            activeOpacity={0.7}
          >
              <View style={styles.habitInfo}>
                  <View style={[styles.habitIcon, { backgroundColor: habitData.color }]}>
                      <Icon name={habitData.icon} size={20} color="#fff" />
                  </View>
                  <View style={styles.habitText}>
                      <Text style={styles.habitName}>{habitData.name}</Text>
                      <Text style={styles.habitDescription}>{habitData.description}</Text>
                  </View>
              </View>
              <TouchableOpacity
                style={styles.checkButtonContainer}
                onPress={(e) => {
                    e.stopPropagation();
                    if (!isLongPressed) {
                        toggleHabitCompletion(today);
                    }
                }}
              >
                  {completionsPerDay === 1 ? (
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
                    <View style={styles.progressContainer}>
                        {progress >= 1 ? (
                          <View style={[styles.checkButton, styles.checkButtonCompleted]}>
                              <Icon name="check" size={16} color="#fff" />
                          </View>
                        ) : (
                          <>
                              <ProgressCircle
                                progress={progress}
                                color={habitData.color || '#34C759'}
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
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.commitGridScroll}
                contentContainerStyle={styles.commitGridContent}
                scrollEnabled={!isLongPressed}
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
                                        ? getCompletionColor(dayData.completionCount)
                                        : (dayData.isFuture ? '#222' : '#333');

                                      return (
                                        <View
                                          key={weekIndex}
                                          style={[
                                              styles.commitDay,
                                              !dayData.isInCurrentMonth && styles.commitDayOutside,
                                              dayData.isInCurrentMonth && {
                                                  backgroundColor: dayColor
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
          {isLongPressed && (
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
      </Animated.View>
    );
}, (prevProps, nextProps) => prevProps.habit.id === nextProps.habit.id);

// HomeScreen Component (giữ nguyên)
const HomeScreen = ({ navigation }) => {
    const [habits, setHabits] = useState([]);

    useEffect(() => {
        loadHabits();
    }, []);

    const loadHabits = async () => {
        try {
            const habitsData = await AsyncStorage.getItem('habits');
            if (habitsData) {
                setHabits(JSON.parse(habitsData));
            }
        } catch (error) {
            console.error('Error loading habits:', error);
        }
    };

    const handleArchiveHabit = async (habitId) => {
        const updatedHabits = habits.filter(habit => habit.id !== habitId);
        setHabits(updatedHabits);
        await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
    };

    return (
      <SafeAreaView style={styles.container}>
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
            scrollEnabled={true}
          >
              {habits.filter(habit => habit && habit.id).map(habit => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  navigation={navigation}
                  onArchive={handleArchiveHabit}
                />
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
      </SafeAreaView>
    );
};

// Styles (giữ nguyên)
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
        transform: [{ scaleX: -1 }]
    },
    commitGridContent: {
        paddingRight: 10,
    },
    monthColumn: {
        marginRight: 12,
        alignItems: 'center',
        transform: [{ scaleX: -1 }]
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