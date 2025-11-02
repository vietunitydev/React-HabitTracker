import React, { useState, useEffect, useRef, useMemo, memo, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Animated,
    Alert,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { HabitContext } from '../contexts/HabitContext';
import ComingSoonDialog from '../components/ComingSoonDialog';
import CompletionAnimation from '../components/CompletionAnimation';
import SnoozeDialog from '../components/SnoozeDialog';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// --- HELPER FUNCTIONS ---

const formatDateLocal = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseTimeToSeconds = (timeString) => {
    if (!timeString) return 0;
    const parts = timeString.split(':');
    if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
};

const calculateStreakData = (completions, completionsPerDay) => {
    if (!completions || completions.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            isTodayCompleted: false
        };
    }

    const today = formatDateLocal(new Date());
    const completionCounts = completions.reduce((acc, dateStr) => {
        acc[dateStr] = (acc[dateStr] || 0) + 1;
        return acc;
    }, {});

    const isTodayCompleted = (completionCounts[today] || 0) >= completionsPerDay;
    let currentStreak = 0;
    let checkDate = new Date();

    if (!isTodayCompleted) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
        const dateStr = formatDateLocal(checkDate);
        const completionCount = completionCounts[dateStr] || 0;

        if (completionCount >= completionsPerDay) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    const sortedDates = Object.keys(completionCounts)
      .filter(date => completionCounts[date] >= completionsPerDay)
      .map(date => new Date(date))
      .sort((a, b) => a - b);

    let longestStreak = 0;
    let currentLongestStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
        const diffDays = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
            currentLongestStreak++;
        } else {
            longestStreak = Math.max(longestStreak, currentLongestStreak);
            currentLongestStreak = 1;
        }
    }
    longestStreak = Math.max(longestStreak, currentLongestStreak);

    return {
        currentStreak,
        longestStreak: sortedDates.length > 0 ? longestStreak : 0,
        isTodayCompleted
    };
};

// --- MEMOIZED COMPONENTS ---

const CircularTimer = memo(({ timeCompletion, isRunning, remainingTime, color }) => {
    const size = 80;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const progress = timeCompletion > 0 ? remainingTime / timeCompletion : 0;
    const strokeDashoffset = circumference - (progress * circumference);

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <View style={styles.timerContainer}>
          <View style={styles.circularTimer}>
              <Svg width={size} height={size}>
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color || "#8B5CF6"}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  />
              </Svg>
              <View style={styles.timerTextContainer}>
                  <Text style={styles.timerText}>
                      {formatTime(remainingTime)}
                  </Text>
              </View>
          </View>
      </View>
    );
});

const TimerSection = memo(({ habitId, completionTime, habitData, habitColor, onCheckIn }) => {
    const { getTimerState, startTimer, pauseTimer, resumeTimer, resetTimer, completeEarly, theme } = useContext(HabitContext);
    const [completionsToday, setCompletionsToday] = useState(0);

    const timerState = getTimerState(habitId);
    const isTimerEnabled = completionTime?.enabled;
    const totalSeconds = parseTimeToSeconds(completionTime?.time);
    const isRunning = timerState?.isRunning || false;
    const remainingTime = timerState?.remainingTime || totalSeconds;

    const getTodayCompletions = () => {
        const today = formatDateLocal(new Date());
        const completionCounts = habitData?.completionCounts || {};
        return completionCounts[today] || 0;
    };

    useEffect(() => {
        setCompletionsToday(getTodayCompletions());
    }, [habitData?.completionCounts]);

    const completionsPerDay = habitData?.completionsPerDay || 1;
    const isFullyCompleted = completionsToday >= completionsPerDay;

    const handleStart = () => {
        if (isFullyCompleted) return;

        if (isTimerEnabled && totalSeconds > 0) {
            if (!timerState) {
                startTimer(habitId);
            } else if (timerState) {
                if (isRunning) {
                    pauseTimer(habitId);
                } else if (remainingTime > 0) {
                    resumeTimer(habitId);
                } else {
                    resetTimer(habitId);
                }
            }
        } else {
            onCheckIn(true);
        }
    };

    const handleCompleteEarly = () => {
        completeEarly(habitId);
        onCheckIn(true);
    };

    const getButtonText = () => {
        if (isFullyCompleted) {
            if (completionsPerDay === 1) {
                return 'Đã hoàn thành';
            } else {
                return `Đã hoàn thành (${completionsToday}/${completionsPerDay})`;
            }
        }

        if (!isTimerEnabled) return 'Check-in';

        if (!timerState) return 'Bắt đầu';
        if (remainingTime === 0) return 'Đặt lại';
        if (isRunning) return 'Tạm dừng';
        return 'Tiếp tục';
    };

    const getButtonIcon = () => {
        if (isFullyCompleted) return 'check-circle';
        if (!isTimerEnabled) return 'calendar-check';
        if (!timerState) return 'play';
        if (remainingTime === 0) return 'refresh';
        if (isRunning) return 'pause';
        return 'play';
    };

    return (
      <View style={[styles.timerSection, { backgroundColor: theme.card }]}>
          {isTimerEnabled && timerState && (
            <View style={styles.timerWrapper}>
                <CircularTimer
                  timeCompletion={totalSeconds}
                  isRunning={isRunning}
                  remainingTime={remainingTime}
                  color={habitColor}
                />
                {completionsPerDay > 1 && (
                  <View style={styles.progressContainer}>
                      <Text style={[
                          styles.progressText,
                          isFullyCompleted && styles.progressTextCompleted,
                          { color: theme.textMuted }
                      ]}>
                          {completionsToday}/{completionsPerDay}
                      </Text>
                  </View>
                )}
            </View>
          )}

          <View style={styles.timerButtons}>
              <TouchableOpacity
                style={[
                    styles.startButton,
                    { backgroundColor: isFullyCompleted ? theme.border : habitColor },
                    !isTimerEnabled && styles.checkInButton,
                    isFullyCompleted && styles.disabledButton
                ]}
                onPress={handleStart}
                disabled={isFullyCompleted}
              >
                  <Icon name={getButtonIcon()} size={20} color="#fff" />
                  <Text style={[styles.startButtonText, isFullyCompleted && styles.startButtonTextDisabled]}>
                      {getButtonText()}
                  </Text>
              </TouchableOpacity>
              {isTimerEnabled && timerState && remainingTime > 0 && isRunning && !isFullyCompleted && (
                <TouchableOpacity style={[styles.completeEarlyButton, { backgroundColor: habitColor }]} onPress={handleCompleteEarly}>
                    <Icon name="check" size={20} color="#fff" />
                    <Text style={styles.completeEarlyButtonText}>Xong</Text>
                </TouchableOpacity>
              )}
          </View>
      </View>
    );
});

const NotificationSection = memo(({ notification, completionTime, theme }) => {
    const hasNotification = notification?.enabled && notification?.time;
    const hasTimer = completionTime?.enabled && completionTime?.time;

    if (!hasNotification && !hasTimer) return null;

    return (
      <View style={[styles.notificationSection, { backgroundColor: theme.card }]}>
          {hasNotification && (
            <View style={styles.notificationItem}>
                <View style={[styles.notificationIconBg, { backgroundColor: `${theme.primary}20` }]}>
                    <Icon name="bell-ring" size={18} color={theme.primary} />
                </View>
                <View style={styles.notificationTextContainer}>
                    <Text style={[styles.notificationLabel, { color: theme.textMuted }]}>Thông báo</Text>
                    <Text style={[styles.notificationValue, { color: theme.text }]}>
                        {notification.time}
                    </Text>
                </View>
            </View>
          )}
          {hasTimer && (
            <View style={styles.notificationItem}>
                <View style={[styles.notificationIconBg, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                    <Icon name="timer" size={18} color="#4CAF50" />
                </View>
                <View style={styles.notificationTextContainer}>
                    <Text style={[styles.notificationLabel, { color: theme.textMuted }]}>Hẹn giờ</Text>
                    <Text style={[styles.notificationValue, { color: theme.text }]}>
                        {completionTime.time}
                    </Text>
                </View>
            </View>
          )}
      </View>
    );
});

const HabitInfo = memo(({ name, icon, color, description, theme }) => (
  <View style={[styles.habitInfo, { backgroundColor: theme.card }]}>
      <View style={[styles.habitIcon, { backgroundColor: color }]}>
          <Icon name={icon} size={36} color="#fff" />
      </View>
      <View style={styles.habitText}>
          <Text style={[styles.habitName, { color: theme.text }]}>{name}</Text>
          {description ? (
            <Text style={[styles.habitDescription, { color: theme.textMuted }]}>{description}</Text>
          ) : null}
      </View>
  </View>
));

const StreakBar = memo(({ currentStreak, isTodayCompleted, longestStreak, onEdit, onSettings, onStreakAnimationComplete, theme, habitColor }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const bounceAnim = useRef(new Animated.Value(1)).current;
    const [animatedStreak, setAnimatedStreak] = useState(currentStreak);
    const [showFireworks, setShowFireworks] = useState(false);

    useEffect(() => {
        if (currentStreak > animatedStreak) {
            setShowFireworks(true);
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();

            Animated.sequence([
                Animated.timing(bounceAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
                Animated.spring(bounceAnim, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
            ]).start(() => {
                setAnimatedStreak(currentStreak);
                onStreakAnimationComplete?.();
                setTimeout(() => setShowFireworks(false), 1000);
            });
        } else {
            setAnimatedStreak(currentStreak);
        }
    }, [currentStreak]);

    const getFireColor = () => {
        if (!isTodayCompleted && currentStreak > 0) return theme.textMuted;
        return '#FF6B6B';
    };

    const getFireIcon = () => {
        if (!isTodayCompleted && currentStreak > 0) return 'fire-off';
        return 'fire';
    };

    return (
      <View style={[styles.streakBar, { backgroundColor: theme.card }]}>
          <View style={styles.streakContent}>
              <View style={styles.streakItem}>
                  <Animated.View style={[styles.fireIconContainer, { transform: [{ scale: scaleAnim }] }]}>
                      <Icon name={getFireIcon()} size={28} color={getFireColor()} />
                      {showFireworks && (
                        <View style={styles.fireworksContainer}>
                            <Text style={styles.fireworks}>✨</Text>
                            <Text style={styles.fireworks}>🎉</Text>
                            <Text style={styles.fireworks}>⭐</Text>
                        </View>
                      )}
                  </Animated.View>
                  <View style={styles.streakTextContainer}>
                      <Animated.Text style={[styles.streakNumber, { color: getFireColor(), transform: [{ scale: bounceAnim }] }]}>
                          {animatedStreak}
                      </Animated.Text>
                      <Text style={[styles.streakLabel, { color: theme.textMuted }]}>Streak</Text>
                  </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.streakItem}>
                  <Icon name="trophy" size={28} color={habitColor} />
                  <View style={styles.streakTextContainer}>
                      <Text style={[styles.streakNumber, { color: theme.text }]}>{longestStreak}</Text>
                      <Text style={[styles.streakLabel, { color: theme.textMuted }]}>Kỷ lục</Text>
                  </View>
              </View>
          </View>

          {!isTodayCompleted && currentStreak > 0 && (
            <Text style={[styles.streakHint, { color: theme.warning }]}>
                ⚠️ Điểm danh hôm nay để giữ streak!
            </Text>
          )}
      </View>
    );
});

const HistoryGrid = memo(({ completionCounts, completionsPerDay, color, theme }) => {
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
                    const dateString = formatDateLocal(currentDate);
                    const cdNorm = normalizeDate(currentDate);

                    const isInCurrentMonth = currentDate.getMonth() === month;
                    const completionCount = completionCounts[dateString] || 0;
                    const isCompleted = completionCount >= completionsPerDay;
                    const isToday = cdNorm.getTime() === now.getTime();
                    const isFuture = cdNorm > now && !isToday;

                    weekDays.push({
                        date: currentDate,
                        isCompleted,
                        isToday,
                        isInCurrentMonth,
                        isFuture,
                        count: completionCount
                    });
                }
                monthGrid.push(weekDays);
            }

            const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
            grid.push({ month: monthNames[month], weeks: monthGrid });
        }

        return grid;
    };

    const commitGrid = useMemo(() => generateCommitGrid(), [completionCounts, completionsPerDay]);

    const getCompletionColor = (count) => {
        if (count === 0) return theme.backgroundSecondary;
        const opacity = Math.min(count / completionsPerDay, 1);
        return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
    };

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.commitGridScroll}
      >
          {commitGrid.map((monthData, monthIndex) => (
            <View key={monthIndex} style={styles.monthColumn}>
                <Text style={[styles.monthLabel, { color: theme.textMuted }]}>{monthData.month}</Text>
                <View style={styles.monthGrid}>
                    {monthData.weeks.map((week, weekIndex) => (
                      <View key={weekIndex} style={styles.dayRow}>
                          {week.map((day, dayIndex) => {
                              if (!day.isInCurrentMonth) {
                                  return <View key={dayIndex} style={[styles.commitDay, styles.commitDayOutside]} />;
                              }
                              const bgColor = day.isFuture ? 'transparent' : getCompletionColor(day.count);
                              return (
                                <View
                                  key={dayIndex}
                                  style={[
                                      styles.commitDay,
                                      { backgroundColor: bgColor },
                                      day.isToday && { borderWidth: 1, borderColor: color }
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
    );
});

const MonthCalendar = memo(({ completionCounts, completionsPerDay, color, onToggleDate, theme }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const normalizeDate = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const generateCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const startOfWeek = new Date(firstDay);
        startOfWeek.setDate(firstDay.getDate() - firstDay.getDay());

        const weeks = [];
        const now = normalizeDate(new Date());

        for (let week = 0; week < 6; week++) {
            const days = [];
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startOfWeek);
                currentDate.setDate(startOfWeek.getDate() + week * 7 + day);
                const dateString = formatDateLocal(currentDate);
                const cdNorm = normalizeDate(currentDate);

                const count = completionCounts[dateString] || 0;
                const isCompleted = count >= completionsPerDay;
                const isInMonth = currentDate.getMonth() === month;
                const isToday = cdNorm.getTime() === now.getTime();
                const isFuture = cdNorm > now;

                days.push({
                    date: currentDate,
                    dateString,
                    count,
                    isCompleted,
                    isInMonth,
                    isToday,
                    isFuture
                });
            }
            weeks.push(days);
        }

        return weeks;
    };

    const weeks = useMemo(() => generateCalendar(), [currentMonth, completionCounts, completionsPerDay]);

    const getCompletionColorForDay = (count) => {
        if (count === 0) return 'transparent';
        const opacity = Math.min(count / completionsPerDay, 1);
        return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
    };

    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    return (
      <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.monthNavRow}>
              <TouchableOpacity
                style={styles.navIcon}
                onPress={() => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() - 1);
                    setCurrentMonth(newMonth);
                }}
              >
                  <Icon name="chevron-left" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: theme.text }]}>
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity
                style={styles.navIcon}
                onPress={() => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() + 1);
                    setCurrentMonth(newMonth);
                }}
              >
                  <Icon name="chevron-right" size={24} color={theme.text} />
              </TouchableOpacity>
          </View>
          <View style={styles.weekDaysHeader}>
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, i) => (
                <Text key={i} style={[styles.weekDayText, { color: theme.textMuted }]}>{d}</Text>
              ))}
          </View>
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
                {week.map((day, di) => {
                    const disabled = day.isFuture;
                    const bg = day.isInMonth
                      ? (day.count > 0 ? getCompletionColorForDay(day.count) : theme.backgroundSecondary)
                      : 'transparent';

                    return (
                      <TouchableOpacity
                        key={di}
                        style={[
                            styles.dayButton,
                            { backgroundColor: bg },
                            day.isToday && { borderWidth: 2, borderColor: color },
                            disabled && styles.futureDay,
                        ]}
                        onPress={() => {
                            if (!disabled) onToggleDate(day.dateString);
                        }}
                        disabled={disabled}
                      >
                          <Text
                            style={[
                                styles.dayText,
                                { color: theme.text },
                                day.isToday && styles.todayText,
                                disabled && styles.futureDayText,
                            ]}
                          >
                              {day.date.getDate()}
                          </Text>
                          {day.count > 0 && completionsPerDay > 1 && (
                            <Text style={[styles.smallCountText, { color: theme.textMuted }]}>
                                {day.count}/{completionsPerDay}
                            </Text>
                          )}
                      </TouchableOpacity>
                    );
                })}
            </View>
          ))}
      </View>
    );
});

const SubHabitsSection = memo(({ subHabits, habitColor, theme, handleSubHabitToggle }) => {
    if (!subHabits || subHabits.length === 0) return null;

    return (
      <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Các bước thực hiện
          </Text>
          {subHabits.map((subHabit, index) => (
            <TouchableOpacity
              key={subHabit.id}
              style={[styles.subHabitItem, {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border
              }]}
              onPress={() => handleSubHabitToggle(subHabit.id)}
            >
                <View style={[
                    styles.checkbox,
                    {
                        backgroundColor: subHabit.completed ? habitColor : 'transparent',
                        borderColor: subHabit.completed ? habitColor : theme.border,
                    }
                ]}>
                    {subHabit.completed && (
                      <Icon name="check" size={16} color="#fff" />
                    )}
                </View>
                <Text style={[
                    styles.subHabitName,
                    {
                        color: theme.text,
                        textDecorationLine: subHabit.completed ? 'line-through' : 'none',
                    }
                ]}>
                    {index + 1}. {subHabit.name}
                </Text>
            </TouchableOpacity>
          ))}
      </View>
    );
});

const NotesSection = memo(({ today, habitId, habitName, theme, navigation }) => (
  <View style={styles.notesWrapper}>
      <TouchableOpacity
        style={[styles.noteButton, { backgroundColor: theme.card }]}
        onPress={() => navigation.navigate('Note', {
            date: today,
            habitId: habitId,
            habitName: habitName,
        })}
      >
          <View style={[styles.noteIconBg, { backgroundColor: `${theme.primary}20` }]}>
              <Icon name="notebook-edit" size={22} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
              <Text style={[styles.noteTitle, { color: theme.text }]}>
                  Ghi chú hôm nay
              </Text>
              <Text style={[styles.noteSubtitle, { color: theme.textMuted }]}>
                  Chia sẻ cảm nhận và tiến độ
              </Text>
          </View>
          <Icon name="chevron-right" size={24} color={theme.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.allNotesButton, { backgroundColor: theme.backgroundSecondary }]}
        onPress={() => navigation.navigate('AllNotePage')}
      >
          <Icon name="note-multiple" size={18} color={theme.primary} />
          <Text style={[styles.allNotesText, { color: theme.text }]}>
              Xem tất cả ghi chú
          </Text>
          <Icon name="arrow-right" size={18} color={theme.textMuted} />
      </TouchableOpacity>
  </View>
));

// --- MAIN SCREEN COMPONENT ---

const HabitDetailScreen = ({ navigation, route }) => {
    const { habits, updateHabit, toggleHabitCompletion, habitsLoaded, theme } = useContext(HabitContext);
    const habitInfo = habits.find((h) => h.id === route.params.habit.id) || route.params.habit;
    const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, isTodayCompleted: false });
    const [showDialog, setShowDialog] = useState(false);
    const [showSnooze, setShowSnooze] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showAnimation, setShowAnimation] = useState(false);

    const today = formatDateLocal(new Date());

    const handleTodayCompletion = (isCompletingAction) => {
        const maxCompletions = habitInfo.completionsPerDay || 1;
        const todayCompletions = habitInfo.completionCounts?.[today] || 0;

        if (!isCompletingAction) {
            toggleHabitCompletion(habitInfo.id, today);
            return;
        }

        const willBeCompleted = (todayCompletions + 1) >= maxCompletions;

        if (willBeCompleted && todayCompletions < maxCompletions) {
            setShowAnimation(true);
        }

        toggleHabitCompletion(habitInfo.id, today);
    };

    const toggleDate = async (dateString) => {
        const maxCompletions = habitInfo.completionsPerDay || 1;
        const currentCount = habitInfo.completionCounts?.[dateString] || 0;
        const dateIsToday = dateString === today;

        if (currentCount >= maxCompletions) {
            if (dateIsToday && currentCount === maxCompletions) {
                setSelectedDate(dateString);
                setShowSnooze(true);
                return;
            }
            toggleHabitCompletion(habitInfo.id, dateString);
            return;
        }

        if (dateIsToday) {
            handleTodayCompletion(true);
            return;
        }

        toggleHabitCompletion(habitInfo.id, dateString);
    };

    const handleSnooze = (reason) => {
        if (reason === 'completed') {
            toggleHabitCompletion(habitInfo.id, selectedDate);
        }
        setShowSnooze(false);
        setSelectedDate(null);
    };

    const handleSubHabitToggle = (subHabitId) => {
        Alert.alert("Tính năng đang phát triển", "Logic Sub-Habit chưa được hoàn thiện.");
    };

    useEffect(() => {
        const completionsArray = habitInfo.completions || [];
        const newStreakData = calculateStreakData(
          completionsArray,
          habitInfo.completionsPerDay || 1
        );
        setStreakData(newStreakData);
    }, [habitInfo.completions, habitInfo.completionsPerDay]);

    const handleStreakAnimationComplete = () => {};

    if (!habitsLoaded) {
        return (
          <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
              <View style={styles.header}>
                  <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                      <Icon name="arrow-left" size={24} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.title, { color: theme.text }]}>Chi tiết</Text>
                  <View style={{ width: 36 }} />
              </View>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: theme.textMuted }}>Đang tải...</Text>
              </View>
          </SafeAreaView>
        );
    }

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                  <Icon name="arrow-left" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.text }]}>Chi tiết thói quen</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CreateHabit', { habit: habitInfo })}>
                  <Icon name="pencil" size={24} color={theme.text} />
              </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
              {/* Habit Info */}
              <HabitInfo
                name={habitInfo.name}
                icon={habitInfo.icon}
                color={habitInfo.color}
                description={habitInfo.description}
                theme={theme}
              />

              {/* Streak Bar */}
              <StreakBar
                currentStreak={streakData.currentStreak}
                longestStreak={streakData.longestStreak}
                isTodayCompleted={streakData.isTodayCompleted}
                onEdit={() => setShowDialog(true)}
                onSettings={() => setShowDialog(true)}
                onStreakAnimationComplete={handleStreakAnimationComplete}
                theme={theme}
                habitColor={habitInfo.color}
              />

              {/* Timer/Check-in Section */}
              <TimerSection
                habitId={habitInfo.id}
                completionTime={habitInfo.completionTime}
                habitData={habitInfo}
                habitColor={habitInfo.color}
                onCheckIn={handleTodayCompletion}
              />

              {/* Notifications & Timer Settings */}
              <NotificationSection
                notification={habitInfo.notification}
                completionTime={habitInfo.completionTime}
                theme={theme}
              />

              {/* History Grid (12 months) */}
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Lịch sử 12 tháng
                  </Text>
                  <HistoryGrid
                    completionCounts={habitInfo.completionCounts || {}}
                    completionsPerDay={habitInfo.completionsPerDay || 1}
                    color={habitInfo.color}
                    theme={theme}
                  />
              </View>

              {/* Month Calendar */}
              <MonthCalendar
                completionCounts={habitInfo.completionCounts || {}}
                completionsPerDay={habitInfo.completionsPerDay || 1}
                color={habitInfo.color}
                onToggleDate={toggleDate}
                theme={theme}
              />

              {/* Sub-Habits */}
              <SubHabitsSection
                subHabits={habitInfo.subHabits}
                habitColor={habitInfo.color}
                theme={theme}
                handleSubHabitToggle={handleSubHabitToggle}
              />

              {/* Notes */}
              <NotesSection
                today={today}
                habitId={habitInfo.id}
                habitName={habitInfo.name}
                theme={theme}
                navigation={navigation}
              />
          </ScrollView>

          {/* Dialogs */}
          <ComingSoonDialog visible={showDialog} onClose={() => setShowDialog(false)} theme={theme} />
          <SnoozeDialog
            visible={showSnooze}
            onClose={() => setShowSnooze(false)}
            onSnooze={handleSnooze}
            theme={theme}
            remainingSnoozes={3}
            snoozeDate={selectedDate}
          />
          <CompletionAnimation
            visible={showAnimation}
            onComplete={() => setShowAnimation(false)}
            habitColor={habitInfo.color}
          />
      </SafeAreaView>
    );
};

// --- BEAUTIFUL MODERN STYLES ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },

    // Habit Info - Hero Card
    habitInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    habitIcon: {
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    habitText: {
        flex: 1,
    },
    habitName: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 4,
    },
    habitDescription: {
        fontSize: 14,
        lineHeight: 20,
    },

    // Streak Bar - Glass Morphism Style
    streakBar: {
        borderRadius: 20,
        marginTop: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    streakContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    streakItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        justifyContent: 'center',
    },
    fireIconContainer: {
        position: 'relative',
    },
    fireworksContainer: {
        position: 'absolute',
        top: -10,
        left: -15,
        right: -15,
        bottom: -10,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    fireworks: {
        fontSize: 16,
        position: 'absolute',
    },
    streakTextContainer: {
        alignItems: 'center',
    },
    streakNumber: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 2,
    },
    streakLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        width: 1,
        height: 40,
        marginHorizontal: 8,
    },
    streakHint: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 12,
        textAlign: 'center',
    },

    // Timer Section - Modern Card
    timerSection: {
        borderRadius: 20,
        marginTop: 16,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    timerWrapper: {
        alignItems: 'center',
    },
    timerContainer: {
        alignItems: 'center',
    },
    circularTimer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerTextContainer: {
        position: 'absolute',
    },
    timerText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'monospace',
    },
    progressContainer: {
        marginTop: 12,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressTextCompleted: {
        color: '#4CAF50',
    },
    timerButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        minWidth: 120,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    checkInButton: {
        backgroundColor: '#4CAF50',
    },
    disabledButton: {
        opacity: 0.6,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    startButtonTextDisabled: {
        color: '#ccc',
    },
    completeEarlyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    completeEarlyButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },

    // Notification Section
    notificationSection: {
        borderRadius: 16,
        marginTop: 16,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
    },
    notificationItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    notificationIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationTextContainer: {
        flex: 1,
    },
    notificationLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    notificationValue: {
        fontSize: 15,
        fontWeight: '700',
    },

    // History Grid
    commitGridScroll: {
        marginTop: 12,
        transform: [{ scaleX: -1 }],
    },
    monthColumn: {
        marginRight: 8,
        alignItems: 'center',
        transform: [{ scaleX: -1 }],
    },
    monthLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
        width: 32,
    },
    monthGrid: {
        flexDirection: 'column',
    },
    dayRow: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    commitDay: {
        width: 8,
        height: 8,
        borderRadius: 2,
        marginRight: 3,
    },
    commitDayOutside: {
        backgroundColor: 'transparent',
    },

    // Month Calendar
    section: {
        marginTop: 16,
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    monthNavRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    navIcon: {
        padding: 8,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    weekDaysHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '600',
        width: 40,
        textAlign: 'center',
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    dayButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    todayText: {
        fontWeight: '800',
    },
    futureDay: {
        opacity: 0.3,
    },
    dayText: {
        fontSize: 14,
        fontWeight: '600',
    },
    futureDayText: {
        color: '#666',
    },
    smallCountText: {
        fontSize: 8,
        position: 'absolute',
        bottom: 2,
    },

    // Sub-habits
    subHabitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subHabitName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },

    // Notes Section
    notesWrapper: {
        marginTop: 16,
    },
    noteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    noteIconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noteTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    noteSubtitle: {
        fontSize: 14,
    },
    allNotesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    allNotesText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
});

export default HabitDetailScreen;