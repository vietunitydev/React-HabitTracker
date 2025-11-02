import React, { useState, useEffect, useRef, useMemo, memo, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Animated,
    Alert, // Thêm Alert để xử lý lỗi phát triển
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { HabitContext } from '../contexts/HabitContext';
import ComingSoonDialog from '../components/ComingSoonDialog';
import CompletionAnimation from '../components/CompletionAnimation';
import SnoozeDialog from '../components/SnoozeDialog';

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
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#333"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color || "#FF6B6B"}
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


const TimerSection = memo(({ habitId, completionTime, habitData, habitColor, onCheckIn }) => {
    const { getTimerState, startTimer, pauseTimer, resumeTimer, resetTimer, completeEarly } = useContext(HabitContext);
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
            // Check-in logic when timer is disabled (FIX 3: Dùng onCheckIn)
            onCheckIn(true);
        }
    };

    const handleCompleteEarly = () => {
        completeEarly(habitId);
        onCheckIn(true); // FIX 3: Kích hoạt check-in sau khi hoàn thành sớm
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

        return [styles.startButton, { backgroundColor: habitColor || '#FF6B6B' }];
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
                    color={habitColor}
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


const NotificationSection = memo(({ notification, completionTime, theme }) => {
    const hasNotification = notification?.enabled && notification?.time;
    const hasTimer = completionTime?.enabled && completionTime?.time;

    return (
      <View style={[styles.notificationSection, { backgroundColor: theme.card }]}>
          <View style={styles.notificationLeft}>
              <Icon name="bell-outline" size={20} color={theme.primary} />
              <View style={styles.notificationTextContainer}>
                  <Text style={[styles.notificationLabel, { color: theme.textSecondary }]}>Thông báo</Text>
                  <Text style={[styles.notificationValue, { color: theme.text }]}>
                      {hasNotification ? notification.time : 'Chưa cài đặt'}
                  </Text>
              </View>
          </View>
          <View style={styles.notificationRight}>
              <Icon name="timer-outline" size={20} color="#4CAF50" />
              <View style={styles.notificationTextContainer}>
                  <Text style={[styles.notificationLabel, { color: theme.textSecondary }]}>Hẹn giờ</Text>
                  <Text style={[styles.notificationValue, { color: theme.text }]}>
                      {hasTimer ? completionTime.time : 'Chưa cài đặt'}
                  </Text>
              </View>
          </View>
      </View>
    );
});


const HabitInfo = memo(({ name, icon, color, description, theme }) => (
  <View style={styles.habitInfo}>
      <View style={[styles.habitIcon, { backgroundColor: color }]}>
          <Icon name={icon} size={32} color="#fff" />
      </View>
      <View style={styles.habitText}>
          <Text style={[styles.habitName, { color: theme.text }]}>{name}</Text>
          {description && (
            <Text style={[styles.habitDescription, { color: theme.textSecondary }]}>{description}</Text>
          )}
      </View>
  </View>
));


const StreakBar = memo(({ currentStreak, isTodayCompleted, onEdit, onSettings, onStreakAnimationComplete }) => {
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
    }, [currentStreak, animatedStreak, scaleAnim, bounceAnim, onStreakAnimationComplete]);

    const getFireColor = () => {
        if (!isTodayCompleted && currentStreak > 0) {
            return '#666';
        }
        return '#FF6B6B';
    };

    const getFireIcon = () => {
        if (!isTodayCompleted && currentStreak > 0) {
            return 'fire-off';
        }
        return 'fire';
    };

    return (
      <View style={styles.streakBar}>
          <View style={styles.streakLeft}>
              <View style={styles.targetBlock}>
                  <Animated.View style={[styles.fireIconContainer, { transform: [{ scale: scaleAnim }] }]}>
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
        const baseColor = color || theme.primary;
        if (completionCount === 0) return theme.backgroundSecondary;
        if (completionsPerDay === 1) return baseColor;

        const percentage = Math.min(completionCount / completionsPerDay, 1);
        const opacity = 0.3 + (percentage * 0.7);
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const grid = useMemo(() => generateCommitGrid(), [completionCounts, completionsPerDay, color, theme]);

    return (
      <View style={{ marginTop: 1 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.commitGridScroll}
          >
              {grid.map((monthData, i) => (
                <View key={i} style={styles.monthColumn}>
                    <Text style={[styles.monthLabel, { color: theme.textSecondary }]}>{monthData.monthName}</Text>
                    <View style={styles.monthGrid}>
                        {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
                          <View key={dayOfWeek} style={styles.dayRow}>
                              {monthData.weeks.map((week, wi) => {
                                  const dayData = week[dayOfWeek];
                                  const dayColor = dayData.isInCurrentMonth && dayData.completionCount > 0
                                    ? getCompletionColorForDay(dayData.completionCount)
                                    : (dayData.isFuture ? theme.border : theme.backgroundSecondary);
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

const MonthCalendar = memo(({ completionCounts, completionsPerDay, color, onToggleDate, theme }) => {
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
        const baseColor = color || theme.primary;
        if (completionCount === 0) return theme.backgroundSecondary;
        if (completionsPerDay === 1) return baseColor;

        const percentage = Math.min(completionCount / completionsPerDay, 1);
        const opacity = (percentage * 0.7);
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const weeks = useMemo(() => generateMonthCalendar(viewMonth), [viewMonth, completionCounts, completionsPerDay, color, theme]);

    const monthLabel = viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
      <View style={{ marginTop: 12, backgroundColor: theme.card, padding: 16, borderRadius: 12 }}>
          <View style={styles.monthNavRow}>
              <TouchableOpacity onPress={goPrevMonth} style={styles.navIcon}>
                  <Icon name="chevron-left" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: theme.text }]}>{monthLabel}</Text>
              <TouchableOpacity onPress={goNextMonth} style={styles.navIcon}>
                  <Icon name="chevron-right" size={24} color={theme.text} />
              </TouchableOpacity>
          </View>
          <View style={styles.weekDaysHeader}>
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, i) => (
                <Text key={i} style={[styles.weekDayText, { color: theme.textSecondary }]}>{d}</Text>
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
                            day.isToday && { borderWidth: 2, borderColor: theme.primary }, // Highlight today
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
                                { color: theme.text },
                                day.isToday && styles.todayText,
                                disabled && styles.futureDayText,
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


// --- V1 COMPONENTS TÍCH HỢP ---

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
              style={[styles.subHabitItem, { borderColor: theme.border }]}
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
  <View style={{ marginVertical: 8 }}>
      <TouchableOpacity
        style={[styles.noteButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => navigation.navigate('Note', {
            date: today,
            habitId: habitId,
            habitName: habitName,
        })}
      >
          <Icon name="notebook" size={24} color={theme.primary} />
          <View style={{ flex: 1 }}>
              <Text style={[styles.noteTitle, { color: theme.text }]}>
                  Ghi chú hôm nay
              </Text>
              <Text style={[styles.noteSubtitle, { color: theme.textSecondary }]}>
                  Chia sẻ cảm nhận của bạn
              </Text>
          </View>
          <Icon name="chevron-right" size={24} color={theme.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.allNotesButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
        onPress={() => navigation.navigate('AllNotePage')}
      >
          <Icon name="note-text-outline" size={20} color={theme.primary} />
          <Text style={[styles.allNotesText, { color: theme.text }]}>
              Xem tất cả ghi chú
          </Text>
          <Icon name="arrow-right" size={20} color={theme.textMuted} />
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
    const [showAnimation, setShowAnimation] = useState(false); // FIX 3: State cho animation

    const today = formatDateLocal(new Date());

    // FIX 3: Hàm wrapper để xử lý điểm danh hôm nay và Animation
    const handleTodayCompletion = (isCompletingAction) => {
        const maxCompletions = habitInfo.completionsPerDay || 1;
        const todayCompletions = habitInfo.completionCounts?.[today] || 0;

        if (!isCompletingAction) {
            // Trường hợp: UNDO completion
            toggleHabitCompletion(habitInfo.id, today);
            return;
        }

        // Trường hợp: COMPLETE action
        const willBeCompleted = (todayCompletions + 1) >= maxCompletions;

        if (willBeCompleted && todayCompletions < maxCompletions) {
            // Chỉ hiển thị animation nếu lần hoàn thành này đạt limit
            setShowAnimation(true);
        }

        toggleHabitCompletion(habitInfo.id, today);
    };

    // Toggle date completion (Month Calendar click)
    const toggleDate = async (dateString) => {
        const maxCompletions = habitInfo.completionsPerDay || 1;
        const todayCompletions = habitInfo.completionCounts?.[dateString] || 0;

        const isCurrentlyCompleted = todayCompletions >= maxCompletions;
        const dateIsToday = dateString === today;
        const dateIsOld = new Date(dateString) < new Date(today);

        // Logic to UNDO completion
        if (isCurrentlyCompleted) {
            toggleHabitCompletion(habitInfo.id, dateString);
            return;
        }

        // Logic to COMPLETE action
        if (!isCurrentlyCompleted) {

            // FIX 2: Show Snooze Dialog cho ngày cũ chưa hoàn thành
            if (dateIsOld) {
                setSelectedDate(dateString);
                setShowSnooze(true);
                return;
            }

            // Xử lý điểm danh ngày hôm nay
            if (dateIsToday) {
                // Dùng hàm wrapper để xử lý animation
                handleTodayCompletion(true);
                return;
            }

            // Nếu không phải hôm nay và không phải ngày cũ (tức là ngày trong tương lai - không thể click được nhờ logic của MonthCalendar)
            toggleHabitCompletion(habitInfo.id, dateString);
        }
    };

    // Handler cho Snooze Dialog
    const handleSnooze = (reason) => {
        if (reason === 'completed') {
            // Giả định người dùng đã hoàn thành ngày hôm đó
            toggleHabitCompletion(habitInfo.id, selectedDate);
        } else if (reason === 'snoozed') {
            // Xử lý logic hoãn/bỏ lỡ
        }
        setShowSnooze(false);
        setSelectedDate(null);
    }

    // Logic Placeholder cho Sub-Habits (từ V1)
    const handleSubHabitToggle = (subHabitId) => {
        // Cần logic cập nhật `habitInfo.subHabits` và gọi `updateHabit` tại đây
        Alert.alert("Tính năng đang phát triển", "Logic Sub-Habit chưa được hoàn thiện trong HabitContext.");
        // setShowDialog(true);
    };

    // Calculate stats
    useEffect(() => {
        const completionsArray = habitInfo.completions || [];
        const newStreakData = calculateStreakData(
          completionsArray,
          habitInfo.completionsPerDay || 1
        );
        setStreakData(newStreakData);
    }, [habitInfo.completions, habitInfo.completionsPerDay]);

    const handleStreakAnimationComplete = () => {
        // console.log('Streak animation completed!');
    };

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
                  <Text style={{ color: theme.textSecondary }}>Đang tải...</Text>
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
              <Text style={[styles.title, { color: theme.text }]}>Chi tiết</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CreateHabit', { habit: habitInfo })}>
                  <Icon name="pencil" size={24} color={theme.text} />
              </TouchableOpacity>
          </View>
          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}>
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
                isTodayCompleted={streakData.isTodayCompleted}
                onEdit={() => setShowDialog(true)}
                onSettings={() => setShowDialog(true)}
                onStreakAnimationComplete={handleStreakAnimationComplete}
              />

              {/* History Grid (GitHub-style) */}
              <View style={{ backgroundColor: theme.card, borderRadius: 12, marginTop: 12, paddingVertical: 12 }}>
                  <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 16, marginBottom: 8 }]}>Lịch sử 12 tháng</Text>
                  <HistoryGrid
                    completionCounts={habitInfo.completionCounts || {}}
                    completionsPerDay={habitInfo.completionsPerDay || 1}
                    color={habitInfo.color}
                    theme={theme}
                  />
              </View>

              {/* Month Calendar (for detailed toggle) */}
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

              {/* Notes (FIX 1: Đảm bảo màn hình Note được đăng ký) */}
              <NotesSection
                today={today}
                habitId={habitInfo.id}
                habitName={habitInfo.name}
                theme={theme}
                navigation={navigation}
              />

              {/* Notifications & Timer/Check-in Settings */}
              <NotificationSection
                notification={habitInfo.notification}
                completionTime={habitInfo.completionTime}
                theme={theme}
              />

              {/* Timer/Check-in Section (Primary Action) */}
              <TimerSection
                habitId={habitInfo.id}
                completionTime={habitInfo.completionTime}
                habitData={habitInfo}
                habitColor={habitInfo.color}
                onCheckIn={handleTodayCompletion} // FIX 3: Dùng hàm wrapper
              />

              <View style={{ height: 40 }} />
          </ScrollView>

          {/* Dialogs */}
          <ComingSoonDialog visible={showDialog} onClose={() => setShowDialog(false)} theme={theme} />

          {/* FIX 2: Snooze Dialog */}
          <SnoozeDialog
            visible={showSnooze}
            onClose={() => setShowSnooze(false)}
            onSnooze={handleSnooze}
            theme={theme}
            remainingSnoozes={3}
            snoozeDate={selectedDate}
          />

          {/* FIX 3: Completion Animation */}
          <CompletionAnimation
            visible={showAnimation}
            onComplete={() => setShowAnimation(false)}
            habitColor={habitInfo.color}
          />
      </SafeAreaView>
    );
};

// --- STYLES (Đã hợp nhất V1 & V2) ---
// ... (Phần Styles không thay đổi, giữ nguyên từ phản hồi trước) ...
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: { padding: 8 },
    title: { fontSize: 18, fontWeight: '600' },
    content: { flex: 1 },

    habitInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 12,
        marginTop: 12,
    },
    habitIcon: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    habitText: { flex: 1 },
    habitName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
    habitDescription: { fontSize: 13 },

    commitGridScroll: { marginTop: 8, transform: [{ scaleX: -1 }] },
    monthColumn: { marginRight: 7, alignItems: 'center', transform: [{ scaleX: -1 }] },
    monthLabel: { fontSize: 10, fontWeight: '500', marginBottom: 6, textAlign: 'center', width: 32 },
    monthGrid: { flexDirection: 'column' },
    dayRow: { flexDirection: 'row', marginBottom: 2 },
    commitDay: { width: 7, height: 7, borderRadius: 2, marginRight: 2 },
    commitDayOutside: { backgroundColor: 'transparent' },

    streakBar: {
        height: 60,
        width: '100%',
        backgroundColor: '#2a2a2a',
        borderRadius: 10,
        marginTop: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    streakLeft: { flexDirection: 'column', alignItems: 'flex-start', flex: 1 },
    targetBlock: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    fireIconContainer: { position: 'relative', marginRight: 8 },
    fireworksContainer: { position: 'absolute', top: -10, left: -15, right: -15, bottom: -10, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', pointerEvents: 'none' },
    fireworks: { fontSize: 12, position: 'absolute' },
    flameCount: { color: '#FF6B6B', fontSize: 18, fontWeight: '700' },
    streakHint: { color: '#999', fontSize: 11, fontStyle: 'italic', marginTop: 2 },
    streakRight: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { padding: 8, marginLeft: 8 },

    monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    navIcon: { padding: 6 },
    monthTitle: { fontSize: 14, fontWeight: '600' },
    weekDaysHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    weekDayText: { fontSize: 12, fontWeight: '500', width: 38, textAlign: 'center' },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    dayButton: {
        width: 38,
        height: 38,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    todayButton: { borderWidth: 2 },
    futureDay: { opacity: 0.3 },
    dayText: { fontSize: 14, fontWeight: '400' },
    todayText: { fontWeight: 'bold' },
    futureDayText: { color: '#444' },
    smallCountText: { fontSize: 7, color: '#ddd', textAlign: 'center' },
    smallCountTextEmpty: { fontSize: 9, color: 'transparent' },

    section: {
        marginVertical: 8,
        padding: 16,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    subHabitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
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
    subHabitName: { flex: 1, fontSize: 15 },

    noteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    noteTitle: { fontSize: 16, fontWeight: '500' },
    noteSubtitle: { fontSize: 13, marginTop: 2 },
    allNotesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
    },
    allNotesText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500'
    },

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
    timerSectionDisabled: { opacity: 0.6 },
    timerWrapper: { flexDirection: 'column', alignItems: 'center' },
    circularTimerWrapper: { opacity: 1 },
    circularTimerDisabled: { opacity: 0.5 },
    progressContainer: { marginTop: 8 },
    progressText: { color: '#999', fontSize: 12, fontWeight: '500', textAlign: 'center' },
    progressTextCompleted: { color: '#4CAF50', fontWeight: '600' },
    timerContainer: { flexDirection: 'row', alignItems: 'center' },
    circularTimer: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
    timerTextContainer: { marginLeft: 12 },
    timerText: { color: '#fff', fontSize: 16, fontWeight: '600', fontFamily: 'monospace', textAlign: 'center' },
    timerButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 100,
        justifyContent: 'center',
    },
    checkInButton: { backgroundColor: '#4CAF50' },
    disabledButton: { backgroundColor: '#666', opacity: 0.8 },
    startButtonText: { color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 },
    startButtonTextDisabled: { color: '#ccc' },
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
    completeEarlyButtonText: { color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 },

    notificationSection: {
        width: '100%',
        borderRadius: 10,
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    notificationLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
    notificationRight: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    notificationTextContainer: { marginLeft: 8, flex: 1 },
    notificationLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
    notificationValue: { fontSize: 13, fontWeight: '600' },
});


export default HabitDetailScreen;