import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../core/contexts/ThemeContext';
import { formatDateLocal, getWeekDays } from '../../../utils/dateHelpers';

/**
 * Week Calendar Component
 * Displays 7 days of the week with today highlighted
 */
export const WeekCalendar = () => {
  const { theme } = useTheme();
  const [weekDays, setWeekDays] = useState([]);

  useEffect(() => {
    const days = getWeekDays().map((day, index) => ({
      dayName: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][day.getDay()],
      date: day.getDate(),
      isToday: formatDateLocal(day) === formatDateLocal(new Date()),
      fullDate: day,
    }));
    setWeekDays(days);
  }, []);

  return (
    <View style={styles.container}>
      {weekDays.map((day, index) => (
        <View
          key={index}
          style={[
            styles.dayItem,
            day.isToday && [styles.todayItem, { backgroundColor: theme.primary }],
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

const styles = StyleSheet.create({
  container: {
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
    // backgroundColor set dynamically
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
});