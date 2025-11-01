import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Switch,
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitColor } from '../constants/HabitColor';
import { HabitContext } from '../contexts/HabitContext';

const HABIT_TEMPLATES = [
    {
        id: 'reading',
        name: 'Đọc sách',
        icon: 'book-open',
        color: '#54A0FF',
        category: 'Học tập',
        description: 'Đọc 20 trang mỗi ngày',
        frequency: 'daily',
    },
    {
        id: 'exercise',
        name: 'Tập thể dục',
        icon: 'dumbbell',
        color: '#FF6B6B',
        category: 'Thể dục',
        description: 'Tập 30 phút mỗi ngày',
        frequency: 'daily',
    },
    {
        id: 'meditation',
        name: 'Thiền',
        icon: 'meditation',
        color: '#4ECDC4',
        category: 'Chánh niệm',
        description: 'Thiền 10 phút mỗi sáng',
        frequency: 'daily',
    },
    {
        id: 'water',
        name: 'Uống nước',
        icon: 'water',
        color: '#45B7D1',
        category: 'Sức khỏe',
        description: 'Uống 8 ly nước',
        frequency: 'daily',
    },
    {
        id: 'journal',
        name: 'Viết nhật ký',
        icon: 'notebook',
        color: '#FFA726',
        category: 'Cá nhân',
        description: 'Ghi lại suy nghĩ',
        frequency: 'daily',
    },
    {
        id: 'learning',
        name: 'Học ngôn ngữ',
        icon: 'translate',
        color: '#9C27B0',
        category: 'Học tập',
        description: 'Luyện tập 15 phút',
        frequency: 'daily',
    },
];

const TIME_PRESETS = [
    { id: 'morning', label: 'Sáng', icon: 'weather-sunny', time: '07:00' },
    { id: 'noon', label: 'Trưa', icon: 'white-balance-sunny', time: '12:00' },
    { id: 'afternoon', label: 'Chiều', icon: 'weather-sunset', time: '17:00' },
    { id: 'evening', label: 'Tối', icon: 'weather-night', time: '20:00' },
];

const CreateHabitScreen = ({ navigation, route }) => {
    const { addHabit, updateHabit, theme } = useContext(HabitContext);
    const isEditing = !!route.params?.habit;

    // Basic Info
    const [name, setName] = useState(route.params?.habit?.name || '');
    const [description, setDescription] = useState(route.params?.habit?.description || '');
    const [selectedIcon, setSelectedIcon] = useState(route.params?.habit?.icon || 'pen');
    const [selectedColor, setSelectedColor] = useState(route.params?.habit?.color || '#54A0FF');
    const [category, setCategory] = useState(route.params?.habit?.category || 'Sức khỏe');

    // Frequency
    const [frequency, setFrequency] = useState(route.params?.habit?.frequency || 'daily');
    const [selectedDays, setSelectedDays] = useState(route.params?.habit?.selectedDays || []);
    const [timesPerWeek, setTimesPerWeek] = useState(route.params?.habit?.timesPerWeek || 3);
    const [monthlyDates, setMonthlyDates] = useState(route.params?.habit?.monthlyDates || []);

    // Time
    const [timePreset, setTimePreset] = useState('morning');
    const [customTime, setCustomTime] = useState('07:00');
    const [timeWindow, setTimeWindow] = useState({ start: '07:00', end: '09:00' });
    const [useTimeWindow, setUseTimeWindow] = useState(false);

    // Sub-habits (Composite)
    const [subHabits, setSubHabits] = useState(route.params?.habit?.subHabits || []);
    const [showSubHabitModal, setShowSubHabitModal] = useState(false);
    const [newSubHabitName, setNewSubHabitName] = useState('');

    // Modals
    const [showTemplates, setShowTemplates] = useState(!isEditing);
    const [showFrequencyModal, setShowFrequencyModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);

    useEffect(() => {
        if (route.params?.selectedIcon) {
            setSelectedIcon(route.params.selectedIcon);
        }
    }, [route.params]);

    const applyTemplate = (template) => {
        setName(template.name);
        setDescription(template.description);
        setSelectedIcon(template.icon);
        setSelectedColor(template.color);
        setCategory(template.category);
        setFrequency(template.frequency);
        setShowTemplates(false);
    };

    const toggleDay = (day) => {
        setSelectedDays(prev =>
          prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const toggleMonthlyDate = (date) => {
        setMonthlyDates(prev =>
          prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
        );
    };

    const addSubHabit = () => {
        if (newSubHabitName.trim()) {
            setSubHabits([...subHabits, {
                id: Date.now().toString(),
                name: newSubHabitName.trim(),
                completed: false,
            }]);
            setNewSubHabitName('');
        }
    };

    const removeSubHabit = (id) => {
        setSubHabits(subHabits.filter(h => h.id !== id));
    };

    const handleSave = () => {
        if (!name.trim()) {
            alert('Vui lòng nhập tên thói quen');
            return;
        }

        const habitData = {
            id: isEditing ? route.params.habit.id : Date.now().toString(),
            name: name.trim(),
            description: description.trim(),
            icon: selectedIcon,
            color: selectedColor,
            category,
            frequency,
            selectedDays,
            timesPerWeek,
            monthlyDates,
            timePreset,
            customTime,
            timeWindow,
            useTimeWindow,
            subHabits,
            completions: isEditing ? route.params.habit.completions || [] : [],
            completionCounts: isEditing ? route.params.habit.completionCounts || {} : {},
            completionsPerDay: 1,
        };

        if (isEditing) {
            updateHabit(habitData);
        } else {
            addHabit(habitData);
        }
        navigation.goBack();
    };

    const DAYS = [
        { id: 1, label: 'T2', full: 'Thứ 2' },
        { id: 2, label: 'T3', full: 'Thứ 3' },
        { id: 3, label: 'T4', full: 'Thứ 4' },
        { id: 4, label: 'T5', full: 'Thứ 5' },
        { id: 5, label: 'T6', full: 'Thứ 6' },
        { id: 6, label: 'T7', full: 'Thứ 7' },
        { id: 0, label: 'CN', full: 'Chủ nhật' },
    ];

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                  {isEditing ? 'Chỉnh sửa thói quen' : 'Tạo thói quen mới'}
              </Text>
              <TouchableOpacity onPress={handleSave}>
                  <Text style={[styles.saveButton, { color: theme.primary }]}>Lưu</Text>
              </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Basic Info */}
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Thông tin cơ bản</Text>

                  <TextInput
                    style={[styles.input, {
                        backgroundColor: theme.backgroundSecondary,
                        color: theme.text,
                        borderColor: theme.border,
                    }]}
                    placeholder="Tên thói quen"
                    placeholderTextColor={theme.textMuted}
                    value={name}
                    onChangeText={setName}
                  />

                  <TextInput
                    style={[styles.input, styles.textArea, {
                        backgroundColor: theme.backgroundSecondary,
                        color: theme.text,
                        borderColor: theme.border,
                    }]}
                    placeholder="Mô tả (tùy chọn)"
                    placeholderTextColor={theme.textMuted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                  />

                  {/* Icon & Color */}
                  <View style={styles.row}>
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: selectedColor }]}
                        onPress={() => navigation.navigate('ChooseIconImage', { currentIcon: selectedIcon })}
                      >
                          <Icon name={selectedIcon} size={32} color="#fff" />
                      </TouchableOpacity>

                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
                          {HabitColor.map((color) => (
                            <TouchableOpacity
                              key={color}
                              style={[
                                  styles.colorOption,
                                  { backgroundColor: color },
                                  selectedColor === color && styles.selectedColor,
                              ]}
                              onPress={() => setSelectedColor(color)}
                            />
                          ))}
                      </ScrollView>
                  </View>
              </View>

              {/* Templates */}
              {!isEditing && (
                <TouchableOpacity
                  style={[styles.templateButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => setShowTemplates(true)}
                >
                    <Icon name="lightning-bolt" size={20} color={theme.primary} />
                    <Text style={[styles.templateButtonText, { color: theme.text }]}>
                        Chọn từ mẫu có sẵn
                    </Text>
                    <Icon name="chevron-right" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              )}

              {/* Frequency */}
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Tần suất</Text>

                  <TouchableOpacity
                    style={[styles.frequencyButton, {
                        backgroundColor: theme.backgroundSecondary,
                        borderColor: theme.border,
                    }]}
                    onPress={() => setShowFrequencyModal(true)}
                  >
                      <Icon name="calendar-repeat" size={20} color={theme.primary} />
                      <Text style={[styles.frequencyText, { color: theme.text }]}>
                          {frequency === 'daily' && 'Hằng ngày'}
                          {frequency === 'weekly' && `Theo thứ: ${selectedDays.length} ngày`}
                          {frequency === 'times_per_week' && `${timesPerWeek} lần/tuần`}
                          {frequency === 'monthly' && `Ngày: ${monthlyDates.join(', ')}`}
                      </Text>
                      <Icon name="chevron-right" size={20} color={theme.textMuted} />
                  </TouchableOpacity>

                  {frequency === 'weekly' && selectedDays.length > 0 && (
                    <View style={styles.selectedDaysPreview}>
                        {DAYS.filter(d => selectedDays.includes(d.id)).map(day => (
                          <View key={day.id} style={[styles.dayBadge, { backgroundColor: theme.primary }]}>
                              <Text style={styles.dayBadgeText}>{day.label}</Text>
                          </View>
                        ))}
                    </View>
                  )}
              </View>

              {/* Time */}
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Thời gian thực hiện</Text>

                  <View style={styles.timePresets}>
                      {TIME_PRESETS.map((preset) => (
                        <TouchableOpacity
                          key={preset.id}
                          style={[
                              styles.timePresetButton,
                              {
                                  backgroundColor: theme.backgroundSecondary,
                                  borderColor: timePreset === preset.id ? theme.primary : theme.border,
                                  borderWidth: timePreset === preset.id ? 2 : 1,
                              }
                          ]}
                          onPress={() => {
                              setTimePreset(preset.id);
                              setCustomTime(preset.time);
                          }}
                        >
                            <Icon name={preset.icon} size={24} color={timePreset === preset.id ? theme.primary : theme.textMuted} />
                            <Text style={[styles.timePresetLabel, { color: theme.text }]}>
                                {preset.label}
                            </Text>
                        </TouchableOpacity>
                      ))}
                  </View>

                  <View style={styles.timeWindowToggle}>
                      <Text style={[styles.label, { color: theme.text }]}>Khung giờ linh hoạt</Text>
                      <Switch
                        value={useTimeWindow}
                        onValueChange={setUseTimeWindow}
                        trackColor={{ false: theme.border, true: theme.primary }}
                      />
                  </View>

                  {useTimeWindow && (
                    <View style={styles.timeWindowInputs}>
                        <View style={styles.timeInput}>
                            <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Từ</Text>
                            <TextInput
                              style={[styles.timeField, {
                                  backgroundColor: theme.backgroundSecondary,
                                  color: theme.text,
                                  borderColor: theme.border,
                              }]}
                              value={timeWindow.start}
                              onChangeText={(text) => setTimeWindow({...timeWindow, start: text})}
                              placeholder="07:00"
                              placeholderTextColor={theme.textMuted}
                            />
                        </View>
                        <Text style={[styles.timeSeparator, { color: theme.textMuted }]}>—</Text>
                        <View style={styles.timeInput}>
                            <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Đến</Text>
                            <TextInput
                              style={[styles.timeField, {
                                  backgroundColor: theme.backgroundSecondary,
                                  color: theme.text,
                                  borderColor: theme.border,
                              }]}
                              value={timeWindow.end}
                              onChangeText={(text) => setTimeWindow({...timeWindow, end: text})}
                              placeholder="09:00"
                              placeholderTextColor={theme.textMuted}
                            />
                        </View>
                    </View>
                  )}
              </View>

              {/* Sub-habits */}
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                  <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>Các bước thực hiện</Text>
                      <TouchableOpacity onPress={() => setShowSubHabitModal(true)}>
                          <Icon name="plus-circle" size={24} color={theme.primary} />
                      </TouchableOpacity>
                  </View>

                  {subHabits.length > 0 ? (
                    subHabits.map((subHabit, index) => (
                      <View key={subHabit.id} style={[styles.subHabitItem, { borderColor: theme.border }]}>
                          <View style={styles.subHabitNumber}>
                              <Text style={[styles.subHabitNumberText, { color: theme.primary }]}>
                                  {index + 1}
                              </Text>
                          </View>
                          <Text style={[styles.subHabitName, { color: theme.text }]}>
                              {subHabit.name}
                          </Text>
                          <TouchableOpacity onPress={() => removeSubHabit(subHabit.id)}>
                              <Icon name="close-circle" size={20} color={theme.error} />
                          </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                        Chia nhỏ thói quen thành các bước cụ thể
                    </Text>
                  )}
              </View>

              <View style={{ height: 100 }} />
          </ScrollView>

          {/* Templates Modal */}
          <Modal visible={showTemplates} animationType="slide" transparent>
              <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                      <View style={styles.modalHeader}>
                          <Text style={[styles.modalTitle, { color: theme.text }]}>Chọn mẫu</Text>
                          <TouchableOpacity onPress={() => setShowTemplates(false)}>
                              <Icon name="close" size={24} color={theme.text} />
                          </TouchableOpacity>
                      </View>
                      <ScrollView>
                          {HABIT_TEMPLATES.map((template) => (
                            <TouchableOpacity
                              key={template.id}
                              style={[styles.templateItem, { borderColor: theme.border }]}
                              onPress={() => applyTemplate(template)}
                            >
                                <View style={[styles.templateIcon, { backgroundColor: template.color }]}>
                                    <Icon name={template.icon} size={24} color="#fff" />
                                </View>
                                <View style={styles.templateInfo}>
                                    <Text style={[styles.templateName, { color: theme.text }]}>
                                        {template.name}
                                    </Text>
                                    <Text style={[styles.templateDesc, { color: theme.textSecondary }]}>
                                        {template.description}
                                    </Text>
                                </View>
                                <Icon name="chevron-right" size={20} color={theme.textMuted} />
                            </TouchableOpacity>
                          ))}
                      </ScrollView>
                  </View>
              </View>
          </Modal>

          {/* Frequency Modal */}
          <Modal visible={showFrequencyModal} animationType="slide" transparent>
              <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                      <View style={styles.modalHeader}>
                          <Text style={[styles.modalTitle, { color: theme.text }]}>Chọn tần suất</Text>
                          <TouchableOpacity onPress={() => setShowFrequencyModal(false)}>
                              <Icon name="close" size={24} color={theme.text} />
                          </TouchableOpacity>
                      </View>
                      <ScrollView>
                          {/* Daily */}
                          <TouchableOpacity
                            style={[
                                styles.frequencyOption,
                                { borderColor: frequency === 'daily' ? theme.primary : theme.border }
                            ]}
                            onPress={() => setFrequency('daily')}
                          >
                              <Icon name="calendar-today" size={24} color={theme.primary} />
                              <Text style={[styles.frequencyOptionText, { color: theme.text }]}>
                                  Hằng ngày
                              </Text>
                              {frequency === 'daily' && (
                                <Icon name="check-circle" size={20} color={theme.primary} />
                              )}
                          </TouchableOpacity>

                          {/* Weekly */}
                          <TouchableOpacity
                            style={[
                                styles.frequencyOption,
                                { borderColor: frequency === 'weekly' ? theme.primary : theme.border }
                            ]}
                            onPress={() => setFrequency('weekly')}
                          >
                              <Icon name="calendar-week" size={24} color={theme.primary} />
                              <View style={{ flex: 1 }}>
                                  <Text style={[styles.frequencyOptionText, { color: theme.text }]}>
                                      Theo thứ trong tuần
                                  </Text>
                                  {frequency === 'weekly' && (
                                    <View style={styles.daySelector}>
                                        {DAYS.map((day) => (
                                          <TouchableOpacity
                                            key={day.id}
                                            style={[
                                                styles.dayButton,
                                                {
                                                    backgroundColor: selectedDays.includes(day.id)
                                                      ? theme.primary
                                                      : theme.backgroundSecondary,
                                                    borderColor: theme.border,
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
                          </TouchableOpacity>

                          {/* Times per week */}
                          <TouchableOpacity
                            style={[
                                styles.frequencyOption,
                                { borderColor: frequency === 'times_per_week' ? theme.primary : theme.border }
                            ]}
                            onPress={() => setFrequency('times_per_week')}
                          >
                              <Icon name="numeric" size={24} color={theme.primary} />
                              <View style={{ flex: 1 }}>
                                  <Text style={[styles.frequencyOptionText, { color: theme.text }]}>
                                      Số lần mỗi tuần
                                  </Text>
                                  {frequency === 'times_per_week' && (
                                    <View style={styles.timesSelector}>
                                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                          <TouchableOpacity
                                            key={num}
                                            style={[
                                                styles.timesButton,
                                                {
                                                    backgroundColor: timesPerWeek === num
                                                      ? theme.primary
                                                      : theme.backgroundSecondary,
                                                    borderColor: theme.border,
                                                }
                                            ]}
                                            onPress={() => setTimesPerWeek(num)}
                                          >
                                              <Text style={[
                                                  styles.timesButtonText,
                                                  { color: timesPerWeek === num ? '#fff' : theme.text }
                                              ]}>
                                                  {num}
                                              </Text>
                                          </TouchableOpacity>
                                        ))}
                                    </View>
                                  )}
                              </View>
                          </TouchableOpacity>

                          {/* Monthly */}
                          <TouchableOpacity
                            style={[
                                styles.frequencyOption,
                                { borderColor: frequency === 'monthly' ? theme.primary : theme.border }
                            ]}
                            onPress={() => setFrequency('monthly')}
                          >
                              <Icon name="calendar-month" size={24} color={theme.primary} />
                              <View style={{ flex: 1 }}>
                                  <Text style={[styles.frequencyOptionText, { color: theme.text }]}>
                                      Ngày cụ thể trong tháng
                                  </Text>
                                  {frequency === 'monthly' && (
                                    <View style={styles.dateGrid}>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                                          <TouchableOpacity
                                            key={date}
                                            style={[
                                                styles.dateButton,
                                                {
                                                    backgroundColor: monthlyDates.includes(date)
                                                      ? theme.primary
                                                      : theme.backgroundSecondary,
                                                    borderColor: theme.border,
                                                }
                                            ]}
                                            onPress={() => toggleMonthlyDate(date)}
                                          >
                                              <Text style={[
                                                  styles.dateButtonText,
                                                  { color: monthlyDates.includes(date) ? '#fff' : theme.text }
                                              ]}>
                                                  {date}
                                              </Text>
                                          </TouchableOpacity>
                                        ))}
                                    </View>
                                  )}
                              </View>
                          </TouchableOpacity>
                      </ScrollView>
                  </View>
              </View>
          </Modal>

          {/* Sub-habit Modal */}
          <Modal visible={showSubHabitModal} animationType="slide" transparent>
              <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, styles.smallModal, { backgroundColor: theme.card }]}>
                      <View style={styles.modalHeader}>
                          <Text style={[styles.modalTitle, { color: theme.text }]}>Thêm bước</Text>
                          <TouchableOpacity onPress={() => {
                              setShowSubHabitModal(false);
                              setNewSubHabitName('');
                          }}>
                              <Icon name="close" size={24} color={theme.text} />
                          </TouchableOpacity>
                      </View>
                      <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.backgroundSecondary,
                            color: theme.text,
                            borderColor: theme.border,
                        }]}
                        placeholder="Tên bước thực hiện"
                        placeholderTextColor={theme.textMuted}
                        value={newSubHabitName}
                        onChangeText={setNewSubHabitName}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: theme.primary }]}
                        onPress={() => {
                            addSubHabit();
                            setShowSubHabitModal(false);
                        }}
                      >
                          <Text style={styles.addButtonText}>Thêm</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </Modal>
      </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    saveButton: { fontSize: 16, fontWeight: '600' },
    content: { flex: 1 },
    section: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        marginBottom: 12,
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconButton: {
        width: 64,
        height: 64,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorPicker: { flex: 1 },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8,
    },
    selectedColor: { borderWidth: 3, borderColor: '#fff' },
    templateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    templateButtonText: { flex: 1, fontSize: 15, fontWeight: '500' },
    frequencyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        gap: 12,
    },
    frequencyText: { flex: 1, fontSize: 15 },
    selectedDaysPreview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    dayBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    dayBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    timePresets: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    timePresetButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        gap: 4,
    },
    timePresetLabel: { fontSize: 12, fontWeight: '500' },
    timeWindowToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    label: { fontSize: 15 },
    timeWindowInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
    },
    timeInput: { flex: 1 },
    timeLabel: { fontSize: 12, marginBottom: 4 },
    timeField: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
    },
    timeSeparator: { fontSize: 20, marginTop: 16 },
    subHabitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 8,
        gap: 12,
    },
    subHabitNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subHabitNumberText: { fontSize: 12, fontWeight: 'bold' },
    subHabitName: { flex: 1, fontSize: 15 },
    emptyText: { fontSize: 14, textAlign: 'center', padding: 20 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    smallModal: { maxHeight: 300 },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    templateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        gap: 12,
    },
    templateIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    templateInfo: { flex: 1 },
    templateName: { fontSize: 16, fontWeight: '600' },
    templateDesc: { fontSize: 13, marginTop: 2 },
    frequencyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        margin: 16,
        borderRadius: 12,
        borderWidth: 2,
        gap: 12,
    },
    frequencyOptionText: { fontSize: 16, fontWeight: '500' },
    daySelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    dayButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    dayButtonText: { fontSize: 13, fontWeight: '600' },
    timesSelector: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    timesButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    timesButtonText: { fontSize: 15, fontWeight: '600' },
    dateGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    dateButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    dateButtonText: { fontSize: 13, fontWeight: '600' },
    addButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        margin: 20,
    },
    addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default CreateHabitScreen;