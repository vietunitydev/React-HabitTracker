import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DatePicker from 'react-native-date-picker';

// ✅ REFACTORED IMPORTS
import { useTheme } from '../../../core/contexts/ThemeContext';
import { HabitContext } from '../../../core/contexts/HabitContext';
import Button from '../../../shared/components/ui/Button';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726',
  '#AB47BC', '#66BB6A', '#EF5350', '#26A69A'
];

const FREQUENCIES = [
  { id: 'daily', label: 'Daily', icon: 'calendar-today' },
  { id: 'weekly', label: 'Weekly', icon: 'calendar-week' },
  { id: 'custom', label: 'Custom', icon: 'calendar-range' },
];

const WEEK_DAYS = [
  { id: 0, label: 'Sun', full: 'Sunday' },
  { id: 1, label: 'Mon', full: 'Monday' },
  { id: 2, label: 'Tue', full: 'Tuesday' },
  { id: 3, label: 'Wed', full: 'Wednesday' },
  { id: 4, label: 'Thu', full: 'Thursday' },
  { id: 5, label: 'Fri', full: 'Friday' },
  { id: 6, label: 'Sat', full: 'Saturday' },
];

const CreateHabitScreen = ({ navigation, route }) => {
  const { theme } = useTheme(); // ✅ Separated theme
  const { addHabit, updateHabit } = useContext(HabitContext);

  const editingHabit = route.params?.habit;
  const isEditing = !!editingHabit;

  // States
  const [name, setName] = useState(editingHabit?.name || '');
  const [description, setDescription] = useState(editingHabit?.description || '');
  const [icon, setIcon] = useState(editingHabit?.icon || 'target');
  const [color, setColor] = useState(editingHabit?.color || COLORS[0]);
  const [frequency, setFrequency] = useState(editingHabit?.frequency?.type || 'daily');
  const [selectedDays, setSelectedDays] = useState(editingHabit?.frequency?.days || []);
  const [completionsPerDay, setCompletionsPerDay] = useState(
    editingHabit?.completionsPerDay?.toString() || '1'
  );
  const [hasTimer, setHasTimer] = useState(editingHabit?.timer?.enabled || false);
  const [timerDuration, setTimerDuration] = useState(
    editingHabit?.timer?.duration?.toString() || '30'
  );
  const [notification, setNotification] = useState(editingHabit?.notification?.enabled || false);
  const [notificationTime, setNotificationTime] = useState(
    editingHabit?.notification?.time
      ? new Date(`2000-01-01T${editingHabit.notification.time}`)
      : new Date()
  );
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Update icon from ChooseIconScreen
  useEffect(() => {
    if (route.params?.selectedIcon) {
      setIcon(route.params.selectedIcon);
    }
  }, [route.params?.selectedIcon]);

  const toggleDay = (dayId) => {
    setSelectedDays(prev =>
      prev.includes(dayId)
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const validateInputs = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter habit name');
      return false;
    }
    if (frequency === 'weekly' && selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return false;
    }
    const completions = parseInt(completionsPerDay);
    if (isNaN(completions) || completions < 1) {
      Alert.alert('Error', 'Completions per day must be at least 1');
      return false;
    }
    if (hasTimer) {
      const duration = parseInt(timerDuration);
      if (isNaN(duration) || duration < 1) {
        Alert.alert('Error', 'Timer duration must be at least 1 minute');
        return false;
      }
    }
    return true;
  };

  const handleSave = () => {
    if (!validateInputs()) return;

    const habitData = {
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      frequency: {
        type: frequency,
        days: frequency === 'weekly' ? selectedDays : [],
      },
      completionsPerDay: parseInt(completionsPerDay),
      timer: {
        enabled: hasTimer,
        duration: hasTimer ? parseInt(timerDuration) * 60 : 0,
      },
      notification: {
        enabled: notification,
        time: notification
          ? `${notificationTime.getHours().toString().padStart(2, '0')}:${notificationTime.getMinutes().toString().padStart(2, '0')}`
          : null,
      },
    };

    if (isEditing) {
      updateHabit(editingHabit.id, habitData);
      Alert.alert('Success', 'Habit updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      addHabit(habitData);
      Alert.alert('Success', 'Habit created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {isEditing ? 'Edit Habit' : 'Create Habit'}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveButton, { color: theme.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon & Color */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>

          {/* Icon Selector */}
          <TouchableOpacity
            style={[styles.iconSelector, { borderColor: theme.border }]}
            onPress={() => navigation.navigate('ChooseIcon', { currentIcon: icon })}
          >
            <View style={[styles.iconPreview, { backgroundColor: color }]}>
              <Icon name={icon} size={32} color="#fff" />
            </View>
            <Text style={[styles.iconSelectorText, { color: theme.text }]}>
              Choose Icon
            </Text>
            <Icon name="chevron-right" size={24} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Color Selector */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Color</Text>
          <View style={styles.colorGrid}>
            {COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorOption,
                  { backgroundColor: c },
                  color === c && styles.colorOptionSelected
                ]}
                onPress={() => setColor(c)}
              >
                {color === c && <Icon name="check" size={20} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Name & Description */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Details</Text>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Name *</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border
            }]}
            placeholder="e.g., Drink Water, Exercise"
            placeholderTextColor={theme.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border
            }]}
            placeholder="Optional description"
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Frequency */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Frequency</Text>

          <View style={styles.frequencyButtons}>
            {FREQUENCIES.map(freq => (
              <TouchableOpacity
                key={freq.id}
                style={[
                  styles.frequencyButton,
                  {
                    backgroundColor: frequency === freq.id
                      ? theme.primary + '20'
                      : theme.backgroundSecondary,
                    borderColor: frequency === freq.id
                      ? theme.primary
                      : theme.border
                  }
                ]}
                onPress={() => setFrequency(freq.id)}
              >
                <Icon
                  name={freq.icon}
                  size={24}
                  color={frequency === freq.id ? theme.primary : theme.textMuted}
                />
                <Text style={[
                  styles.frequencyButtonText,
                  { color: frequency === freq.id ? theme.primary : theme.text }
                ]}>
                  {freq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weekly Days Selector */}
          {frequency === 'weekly' && (
            <View style={styles.daysSelector}>
              {WEEK_DAYS.map(day => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayButton,
                    {
                      backgroundColor: selectedDays.includes(day.id)
                        ? theme.primary
                        : theme.backgroundSecondary,
                      borderColor: theme.border
                    }
                  ]}
                  onPress={() => toggleDay(day.id)}
                >
                  <Text style={[
                    styles.dayButtonText,
                    { color: selectedDays.includes(day.id) ? '#fff' : theme.text }
                  ]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Goal Settings */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Goal</Text>

          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Completions per day
          </Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border
            }]}
            placeholder="1"
            placeholderTextColor={theme.textMuted}
            value={completionsPerDay}
            onChangeText={setCompletionsPerDay}
            keyboardType="number-pad"
          />
        </View>

        {/* Timer */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Icon name="timer" size={24} color={theme.primary} />
              <Text style={[styles.switchText, { color: theme.text }]}>Timer</Text>
            </View>
            <Switch
              value={hasTimer}
              onValueChange={setHasTimer}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>

          {hasTimer && (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Duration (minutes)
              </Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border
                }]}
                placeholder="30"
                placeholderTextColor={theme.textMuted}
                value={timerDuration}
                onChangeText={setTimerDuration}
                keyboardType="number-pad"
              />
            </>
          )}
        </View>

        {/* Notification */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Icon name="bell" size={24} color={theme.primary} />
              <Text style={[styles.switchText, { color: theme.text }]}>Reminder</Text>
            </View>
            <Switch
              value={notification}
              onValueChange={setNotification}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>

          {notification && (
            <TouchableOpacity
              style={[styles.timeButton, { borderColor: theme.border }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Icon name="clock-outline" size={24} color={theme.primary} />
              <Text style={[styles.timeButtonText, { color: theme.text }]}>
                {notificationTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Time Picker Modal */}
      <DatePicker
        modal
        open={showTimePicker}
        date={notificationTime}
        mode="time"
        onConfirm={(date) => {
          setShowTimePicker(false);
          setNotificationTime(date);
        }}
        onCancel={() => setShowTimePicker(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  saveButton: { fontSize: 16, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  iconSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  iconPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconSelectorText: { flex: 1, fontSize: 16 },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  frequencyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  daysSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonText: { fontSize: 12, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchText: { fontSize: 16, fontWeight: '600' },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 12,
    gap: 12,
  },
  timeButtonText: { fontSize: 16 },
});

export default CreateHabitScreen;