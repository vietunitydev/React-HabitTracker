import React, { useState, useEffect, useRef, useMemo, memo, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { HabitContext } from '../contexts/HabitContext';
import ComingSoonDialog from '../components/ComingSoonDialog';

const CircularTimer = memo(({ timeCompletion, onStart, isRunning, remainingTime }) => {
    const size = 50;
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const progress = timeCompletion > 0 ? remainingTime / timeCompletion : 0;
    const strokeDashoffset = circumference - (progress * circumference);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <View style={styles.timerContainer}>
          <View style={styles.circularTimer}>
              <Svg width={size} height={size}>
                  {/* Background circle */}
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#333"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  {/* Progress circle */}
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#FF6B6B"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  />
              </Svg>
          </View>
          <View style={styles.timerTextContainer}>
              <Text style={styles.timerText}>
                  {formatTime(remainingTime)}
              </Text>
          </View>
      </View>
    );
});


// Parse time string to seconds
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

// Timer Section Component
const TimerSection = memo(({ habitId, completionTime, habitData }) => {
    const { getTimerState, startTimer, pauseTimer, resumeTimer, resetTimer, completeEarly, toggleHabitCompletion } = useContext(HabitContext);
    const [completionsToday, setCompletionsToday] = useState(0);

    const timerState = getTimerState(habitId);
    const isTimerEnabled = completionTime?.enabled;
    const totalSeconds = parseTimeToSeconds(completionTime?.time);
    const isRunning = timerState?.isRunning || false;
    const remainingTime = timerState?.remainingTime || totalSeconds;

    // Get today's completions count
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
            // Timer logic
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
            // Check-in logic when timer is disabled
            handleCheckIn();
        }
    };

    const handleCheckIn = () => {
        const today = formatDateLocal(new Date());
        toggleHabitCompletion(habitId, today);
    };

    const handleCompleteEarly = () => {
        completeEarly(habitId);
    };

    const getButtonText = () => {
        if (isFullyCompleted) {
            if (completionsPerDay === 1) {
                return 'Đã hoàn thành';
            } else {
                return `Đã hoàn thành (${completionsToday}/${completionsPerDay})`;
            }
        }

        if (!isTimerEnabled) return 'Bắt đầu';

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

    const getButtonStyle = () => {
        if (isFullyCompleted) return [styles.startButton, styles.disabledButton];

        if (!isTimerEnabled) return [styles.startButton, styles.checkInButton];

        return styles.startButton;
    };

    const displayTime = isTimerEnabled ? remainingTime : 0;

    return (
      <View style={[styles.timerSection, isFullyCompleted && styles.timerSectionDisabled]}>
          <View style={styles.timerWrapper}>
              <View style={[styles.circularTimerWrapper, isFullyCompleted && styles.circularTimerDisabled]}>
                  <CircularTimer
                    timeCompletion={totalSeconds}
                    isRunning={isRunning}
                    remainingTime={displayTime}
                  />
              </View>
              {completionsPerDay > 1 && (
                <View style={styles.progressContainer}>
                    <Text style={[styles.progressText, isFullyCompleted && styles.progressTextCompleted]}>
                        {completionsToday}/{completionsPerDay} lần hôm nay
                    </Text>
                </View>
              )}
          </View>
          <View style={styles.timerButtons}>
              <TouchableOpacity
                style={getButtonStyle()}
                onPress={handleStart}
                disabled={isFullyCompleted}
                activeOpacity={isFullyCompleted ? 1 : 0.7}
              >
                  <Icon name={getButtonIcon()} size={20} color="#fff" />
                  <Text style={[styles.startButtonText, isFullyCompleted && styles.startButtonTextDisabled]}>
                      {getButtonText()}
                  </Text>
              </TouchableOpacity>
              {isTimerEnabled && timerState && remainingTime > 0 && isRunning && !isFullyCompleted && (
                <TouchableOpacity style={styles.completeEarlyButton} onPress={handleCompleteEarly}>
                    <Icon name="check" size={20} color="#fff" />
                    <Text style={styles.completeEarlyButtonText}>Xong</Text>
                </TouchableOpacity>
              )}
          </View>
      </View>
    );
});

// Notification Section Component
const NotificationSection = memo(({ notification, completionTime }) => {
    const hasNotification = notification?.enabled && notification?.time;
    const hasTimer = completionTime?.enabled && completionTime?.time;

    return (
      <View style={styles.notificationSection}>
          <View style={styles.notificationLeft}>
              <Icon name="bell-outline" size={20} color="#FFA500" />
              <View style={styles.notificationTextContainer}>
                  <Text style={styles.notificationLabel}>Thông báo</Text>
                  <Text style={styles.notificationValue}>
                      {hasNotification ? notification.time : 'Chưa cài đặt thông báo'}
                  </Text>
              </View>
          </View>
          <View style={styles.notificationRight}>
              <Icon name="timer-outline" size={20} color="#4CAF50" />
              <View style={styles.notificationTextContainer}>
                  <Text style={styles.notificationLabel}>Hẹn giờ</Text>
                  <Text style={styles.notificationValue}>
                      {hasTimer ? completionTime.time : 'Chưa cài đặt hẹn giờ'}
                  </Text>
              </View>
          </View>
      </View>
    );
});

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

// Improved Streak Bar Component with Animation
const StreakBar = memo(({ currentStreak, goalStreak, onEdit, onSettings, isTodayCompleted, onStreakAnimationComplete }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const bounceAnim = useRef(new Animated.Value(1)).current;
    const [animatedStreak, setAnimatedStreak] = useState(currentStreak);
    const [showFireworks, setShowFireworks] = useState(false);

    // Animation when streak increases
    useEffect(() => {
        if (currentStreak > animatedStreak) {
            // Fire animation sequence
            setShowFireworks(true);

            // Scale animation
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.3,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Bounce animation for the number
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: 1.2,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.spring(bounceAnim, {
                    toValue: 1,
                    friction: 3,
                    tension: 100,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setAnimatedStreak(currentStreak);
                onStreakAnimationComplete?.();
                setTimeout(() => setShowFireworks(false), 1000);
            });
        } else {
            setAnimatedStreak(currentStreak);
        }
    }, [currentStreak, animatedStreak, scaleAnim, bounceAnim, onStreakAnimationComplete]);

    // Determine fire icon color
    const getFireColor = () => {
        if (!isTodayCompleted && currentStreak > 0) {
            return '#666'; // Gray when today is not completed yet
        }
        return '#FF6B6B'; // Red when completed or no streak
    };

    const getFireIcon = () => {
        if (!isTodayCompleted && currentStreak > 0) {
            return 'fire-off'; // Unlit fire icon
        }
        return 'fire'; // Lit fire icon
    };

    return (
      <View style={styles.streakBar}>
          <View style={styles.streakLeft}>
              <View style={styles.targetBlock}>
                  <Animated.View
                    style={[
                        styles.fireIconContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                        }
                    ]}
                  >
                      <Icon name={getFireIcon()} size={20} color={getFireColor()} />
                      {showFireworks && (
                        <View style={styles.fireworksContainer}>
                            <Text style={styles.fireworks}>✨</Text>
                            <Text style={styles.fireworks}>🎉</Text>
                            <Text style={styles.fireworks}>⭐</Text>
                        </View>
                      )}
                  </Animated.View>
                  <Animated.Text
                    style={[
                        styles.flameCount,
                        {
                            transform: [{ scale: bounceAnim }],
                            color: getFireColor()
                        }
                    ]}
                  >
                      {animatedStreak}
                  </Animated.Text>
              </View>
              {!isTodayCompleted && currentStreak > 0 && (
                <Text style={styles.streakHint}>Điểm danh hôm nay để giữ streak!</Text>
              )}
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
    );
});

const formatDateLocal = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Improved streak calculation function
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

    // Check if today is completed
    const isTodayCompleted = (completionCounts[today] || 0) >= completionsPerDay;

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = new Date();

    // If today is completed, start from today, otherwise start from yesterday
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

    // Calculate longest streak
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
                    const dateString = formatDateLocal(currentDate)
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

        const startOfWeek = new Date(start);
        startOfWeek.setDate(start.getDate() - start.getDay());

        const endOfWeek = new Date(end);
        endOfWeek.setDate(end.getDate() + (6 - end.getDay()));

        const weeks = [];
        let current = new Date(startOfWeek);

        while (current <= endOfWeek) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                const cd = normalizeDate(current);
                const dateString = formatDateLocal(cd);
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
        const opacity = (percentage * 0.7);
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
                                day.isInMonth && day.count > 0,
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
    const { habits, updateHabit, toggleHabitCompletion, habitsLoaded } = useContext(HabitContext);
    const habitInfo = habits.find((h) => h.id === route.params.habit.id) || route.params.habit;
    const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, isTodayCompleted: false });
    const [totalCompletions, setTotalCompletions] = useState(0);
    const [showDialog, setShowDialog] = useState(false);
    const [previousStreak, setPreviousStreak] = useState(0);

    // Toggle date completion with animation support
    const toggleDate = async (dateString) => {
        const currentCompletions = habitInfo.completions || [];
        const newStreakData = calculateStreakData(
          [...currentCompletions, dateString], // Simulate adding completion
          habitInfo.completionsPerDay || 1
        );

        // If this action will increase streak, store previous value for animation
        if (newStreakData.currentStreak > streakData.currentStreak) {
            setPreviousStreak(streakData.currentStreak);
        }

        toggleHabitCompletion(habitInfo.id, dateString);
    };

    // Calculate stats
    useEffect(() => {
        const completionsArray = habitInfo.completions || [];
        setTotalCompletions(completionsArray.length);

        const newStreakData = calculateStreakData(
          completionsArray,
          habitInfo.completionsPerDay || 1
        );

        setStreakData(newStreakData);
    }, [habitInfo.completions, habitInfo.completionsPerDay]);

    const handleStreakAnimationComplete = () => {
        // Optional: Add any post-animation logic here
        console.log('Streak animation completed!');
    };

    if (!habitsLoaded) {
        return (
          <SafeAreaView style={styles.container}>
              <View style={styles.header}>
                  <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                      <Icon name="arrow-left" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.title}>Chi tiết</Text>
                  <View style={{ width: 36 }} />
              </View>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#fff' }}>Đang tải...</Text>
              </View>
          </SafeAreaView>
        );
    }

    return (
      <SafeAreaView style={styles.container}>
          <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                  <Icon name="arrow-left" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.title}>Chi tiết</Text>
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
                completionCounts={habitInfo.completionCounts || {}}
                completionsPerDay={habitInfo.completionsPerDay || 1}
                color={habitInfo.color}
              />
              <MonthCalendar
                completionCounts={habitInfo.completionCounts || {}}
                completionsPerDay={habitInfo.completionsPerDay || 1}
                color={habitInfo.color}
                onToggleDate={toggleDate}
              />
              <StreakBar
                currentStreak={streakData.currentStreak}
                goalStreak={habitInfo.goalStreak}
                isTodayCompleted={streakData.isTodayCompleted}
                onEdit={() => setShowDialog(true)}
                onSettings={() => setShowDialog(true)}
                onStreakAnimationComplete={handleStreakAnimationComplete}
              />
              <NotificationSection
                notification={habitInfo.notification}
                completionTime={habitInfo.completionTime}
              />
              <TimerSection
                habitId={habitInfo.id}
                completionTime={habitInfo.completionTime}
                habitData={habitInfo}
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
        height: 60,
        width: '100%',
        backgroundColor: '#2a2a2a',
        borderRadius: 10,
        marginTop: 12,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    streakLeft: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        flex: 1,
    },
    targetBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    fireIconContainer: {
        position: 'relative',
        marginRight: 8,
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
        fontSize: 12,
        position: 'absolute',
    },
    flameCount: {
        color: '#FF6B6B',
        fontSize: 16,
        fontWeight: '700',
    },
    streakHint: {
        color: '#999',
        fontSize: 11,
        fontStyle: 'italic',
        marginTop: 2,
    },
    targetLabel: { color: '#999', fontSize: 11 },
    targetValue: { color: '#fff', fontWeight: '700', fontSize: 14 },
    streakRight: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { padding: 8, marginLeft: 8 },
    monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    navIcon: { padding: 6 },
    monthTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
    weekDaysHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    weekDayText: { color: '#666', fontSize: 12, fontWeight: '500', width: 32, textAlign: 'center' },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    dayButton: {
        width: 38,
        height: 38,
        borderRadius: 6,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    todayButton: { borderWidth: 2, borderColor: '#007AFF' },
    futureDay: { backgroundColor: '#1a1a1a' },
    dayText: { color: '#fff', fontSize: 14, fontWeight: '400' },
    completedDayText: { color: '#fff', fontWeight: '400' },
    todayText: { color: '#fff', fontWeight: 'bold' },
    futureDayText: { color: '#444' },
    smallCountText: { fontSize: 7, color: '#ddd', textAlign: 'center' },
    smallCountTextEmpty: { fontSize: 9, color: 'transparent' },
    // Timer styles
    timerSection: {
        width: '100%',
        backgroundColor: '#2a2a2a',
        borderRadius: 10,
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timerSectionDisabled: {
        opacity: 0.6,
        // backgroundColor: '#1a1a1a',
    },
    timerWrapper: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    circularTimerWrapper: {
        opacity: 1,
    },
    circularTimerDisabled: {
        opacity: 0.5,
    },
    progressContainer: {
        marginTop: 8,
    },
    progressText: {
        color: '#999',
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    progressTextCompleted: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        // flex: 1,
    },
    circularTimer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clockIconContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -8,
        marginLeft: -8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerTextContainer: {
        marginLeft: 12,
    },
    timerText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'monospace',
        textAlign: 'center',
    },
    timerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 100,
        justifyContent: 'center',
    },
    checkInButton: {
        backgroundColor: '#4CAF50',
    },
    disabledButton: {
        backgroundColor: '#666',
        opacity: 0.8,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
    },
    startButtonTextDisabled: {
        color: '#ccc',
    },
    completeEarlyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 80,
        justifyContent: 'center',
    },
    completeEarlyButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
    },
    // Notification styles
    notificationSection: {
        width: '100%',
        backgroundColor: '#2a2a2a',
        borderRadius: 10,
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    notificationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    notificationRight: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    notificationTextContainer: {
        marginLeft: 8,
        flex: 1,
    },
    notificationLabel: {
        color: '#999',
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 2,
    },
    notificationValue: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default HabitDetailScreen;