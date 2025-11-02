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
    Alert,
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

const CreateHabitScreen = ({ navigation, route }) => {
    const { addHabit, updateHabit, theme } = useContext(HabitContext);
    const isEditing = !!route.params?.habit;

    // Basic Info
    const [name, setName] = useState(route.params?.habit?.name || '');
    const [description, setDescription] = useState(route.params?.habit?.description || '');
    const [selectedIcon, setSelectedIcon] = useState(route.params?.habit?.icon || 'pen');
    const [selectedColor, setSelectedColor] = useState(route.params?.habit?.color || '#54A0FF');
    const [category, setCategory] = useState(route.params?.habit?.category || 'Sức khỏe');

    // Frequency - CHỈ GIỮ DAILY VÀ WEEKLY
    const [frequency, setFrequency] = useState(route.params?.habit?.frequency || 'daily');
    const [selectedDays, setSelectedDays] = useState(route.params?.habit?.selectedDays || []);

    // Thông báo
    const [notificationEnabled, setNotificationEnabled] = useState(route.params?.habit?.notification?.enabled || false);
    const [notificationTime, setNotificationTime] = useState(route.params?.habit?.notification?.time || '09:00');

    // Hẹn giờ
    const [timerEnabled, setTimerEnabled] = useState(route.params?.habit?.completionTime?.enabled || false);
    const [timerHours, setTimerHours] = useState('0');
    const [timerMinutes, setTimerMinutes] = useState('30');
    const [timerSeconds, setTimerSeconds] = useState('0');

    // Số lần hoàn thành trong ngày
    const [completionsPerDay, setCompletionsPerDay] = useState(route.params?.habit?.completionsPerDay || 1);
    const [showCompletionsModal, setShowCompletionsModal] = useState(false);
    const [completionsInputValue, setCompletionsInputValue] = useState((route.params?.habit?.completionsPerDay || 1).toString());

    // Sub-habits (Composite)
    const [subHabits, setSubHabits] = useState(route.params?.habit?.subHabits || []);
    const [showSubHabitModal, setShowSubHabitModal] = useState(false);
    const [newSubHabitName, setNewSubHabitName] = useState('');

    // Modals
    const [showTemplates, setShowTemplates] = useState(!isEditing);
    const [showFrequencyModal, setShowFrequencyModal] = useState(false);

    useEffect(() => {
        if (route.params?.selectedIcon) {
            setSelectedIcon(route.params.selectedIcon);
        }
    }, [route.params]);

    // Parse timer from existing habit
    useEffect(() => {
        if (route.params?.habit?.completionTime?.time) {
            const time = route.params.habit.completionTime.time;
            const parts = time.split(':');
            if (parts.length === 3) {
                setTimerHours(parts[0]);
                setTimerMinutes(parts[1]);
                setTimerSeconds(parts[2]);
            }
        }
        if (route.params?.habit?.completionsPerDay) {
            setCompletionsInputValue(route.params.habit.completionsPerDay.toString());
        }
    }, [route.params?.habit]);

    const applyTemplate = (template) => {
        setName(template.name);
        setDescription(template.description);
        setSelectedIcon(template.icon);
        setSelectedColor(template.color);
        setCategory(template.category);
        setFrequency(template.frequency);
        setCompletionsPerDay(1);
        setShowTemplates(false);
    };

    const toggleDay = (day) => {
        setSelectedDays(prev =>
          prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
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

        // Validate frequency
        if (frequency === 'weekly' && selectedDays.length === 0) {
            alert('Vui lòng chọn ít nhất 1 ngày trong tuần');
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
            notification: {
                enabled: notificationEnabled,
                time: notificationTime,
            },
            completionTime: {
                enabled: timerEnabled,
                time: `${timerHours.padStart(2, '0')}:${timerMinutes.padStart(2, '0')}:${timerSeconds.padStart(2, '0')}`,
            },
            completionsPerDay: parseInt(completionsPerDay) || 1,
            subHabits,
            completions: isEditing ? route.params.habit.completions || [] : [],
            completionCounts: isEditing ? route.params.habit.completionCounts || {} : {},
        };

        if (isEditing) {
            updateHabit(habitData);
        } else {
            addHabit(habitData);
        }
        navigation.goBack();
    };

    const handleUpdateCompletionsPerDay = (newValue) => {
        setCompletionsPerDay(newValue);
        setCompletionsInputValue(newValue.toString());
    };

    const handleSaveCompletions = () => {
        const numValue = parseInt(completionsInputValue, 10);
        if (numValue > 0) {
            handleUpdateCompletionsPerDay(numValue);
            setShowCompletionsModal(false);
        } else {
            Alert.alert('Lỗi', 'Số lần hoàn thành phải lớn hơn 0.');
        }
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

    const getFrequencyText = () => {
        if (frequency === 'daily') return 'Hàng ngày';
        if (frequency === 'weekly') {
            if (selectedDays.length === 0) return 'Chọn ngày trong tuần';
            const dayLabels = selectedDays.map(d => DAYS.find(day => day.id === d)?.label).join(', ');
            return dayLabels;
        }
        return 'Chọn tần suất';
    };

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
                          <Icon name={selectedIcon} size={36} color="#fff" />
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

              {/* Frequency - CHỈ DAILY VÀ WEEKLY */}
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Tần suất</Text>
                  <TouchableOpacity
                    style={[styles.frequencyButton, {
                        backgroundColor: theme.backgroundSecondary,
                        borderColor: theme.border,
                    }]}
                    onPress={() => setShowFrequencyModal(true)}
                  >
                      <Icon name="calendar-clock" size={24} color={theme.primary} />
                      <Text style={[styles.frequencyText, { color: theme.text }]}>
                          {getFrequencyText()}
                      </Text>
                      <Icon name="chevron-right" size={24} color={theme.textMuted} />
                  </TouchableOpacity>

                  {frequency === 'weekly' && selectedDays.length > 0 && (
                    <View style={styles.selectedDaysPreview}>
                        {selectedDays.map(day => {
                            const dayInfo = DAYS.find(d => d.id === day);
                            return (
                              <View key={day} style={[styles.dayBadge, { backgroundColor: selectedColor }]}>
                                  <Text style={styles.dayBadgeText}>{dayInfo?.label}</Text>
                              </View>
                            );
                        })}
                    </View>
                  )}
              </View>

              {/* Thông báo */}
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                  <View style={styles.settingRow}>
                      <View style={styles.settingLeft}>
                          <Icon name="bell-outline" size={24} color={theme.primary} />
                          <View style={styles.settingTextContainer}>
                              <Text style={[styles.settingTitle, { color: theme.text }]}>Thông báo</Text>
                              <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>
                                  Nhắc nhở hàng ngày
                              </Text>
                          </View>
                      </View>
                      <Switch
                        value={notificationEnabled}
                        onValueChange={setNotificationEnabled}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor="#fff"
                      />
                  </View>

                  {notificationEnabled && (
                    <View style={styles.timeInputContainer}>
                        <Text style={[styles.label, { color: theme.text }]}>Thời gian nhắc</Text>
                        <TextInput
                          style={[styles.timeInput, {
                              backgroundColor: theme.backgroundSecondary,
                              color: theme.text,
                              borderColor: theme.border,
                          }]}
                          placeholder="09:00"
                          placeholderTextColor={theme.textMuted}
                          value={notificationTime}
                          onChangeText={setNotificationTime}
                        />
                    </View>
                  )}
              </View>

              {/* Hẹn giờ */}
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                  <View style={styles.settingRow}>
                      <View style={styles.settingLeft}>
                          <Icon name="timer-outline" size={24} color={theme.primary} />
                          <View style={styles.settingTextContainer}>
                              <Text style={[styles.settingTitle, { color: theme.text }]}>Hẹn giờ</Text>
                              <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>
                                  Đếm thời gian hoàn thành
                              </Text>
                          </View>
                      </View>
                      <Switch
                        value={timerEnabled}
                        onValueChange={setTimerEnabled}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor="#fff"
                      />
                  </View>

                  {timerEnabled && (
                    <View style={styles.timerInputsContainer}>
                        <View style={styles.timerInputGroup}>
                            <Text style={[styles.timerLabel, { color: theme.textMuted }]}>Giờ</Text>
                            <TextInput
                              style={[styles.timerInput, {
                                  backgroundColor: theme.backgroundSecondary,
                                  color: theme.text,
                                  borderColor: theme.border,
                              }]}
                              placeholder="0"
                              placeholderTextColor={theme.textMuted}
                              value={timerHours}
                              onChangeText={setTimerHours}
                              keyboardType="numeric"
                              maxLength={2}
                            />
                        </View>
                        <Text style={[styles.timerSeparator, { color: theme.text }]}>:</Text>
                        <View style={styles.timerInputGroup}>
                            <Text style={[styles.timerLabel, { color: theme.textMuted }]}>Phút</Text>
                            <TextInput
                              style={[styles.timerInput, {
                                  backgroundColor: theme.backgroundSecondary,
                                  color: theme.text,
                                  borderColor: theme.border,
                              }]}
                              placeholder="30"
                              placeholderTextColor={theme.textMuted}
                              value={timerMinutes}
                              onChangeText={setTimerMinutes}
                              keyboardType="numeric"
                              maxLength={2}
                            />
                        </View>
                        <Text style={[styles.timerSeparator, { color: theme.text }]}>:</Text>
                        <View style={styles.timerInputGroup}>
                            <Text style={[styles.timerLabel, { color: theme.textMuted }]}>Giây</Text>
                            <TextInput
                              style={[styles.timerInput, {
                                  backgroundColor: theme.backgroundSecondary,
                                  color: theme.text,
                                  borderColor: theme.border,
                              }]}
                              placeholder="0"
                              placeholderTextColor={theme.textMuted}
                              value={timerSeconds}
                              onChangeText={setTimerSeconds}
                              keyboardType="numeric"
                              maxLength={2}
                            />
                        </View>
                    </View>
                  )}
              </View>

              {/* Số lần hoàn thành trong ngày */}
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                  <View style={styles.settingRow}>
                      <View style={styles.settingLeft}>
                          <Icon name="counter" size={24} color={theme.primary} />
                          <View style={styles.settingTextContainer}>
                              <Text style={[styles.settingTitle, { color: theme.text }]}>Số lần hoàn thành</Text>
                              <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>
                                  Mỗi ngày
                              </Text>
                          </View>
                      </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.frequencyButton, {
                        backgroundColor: theme.backgroundSecondary,
                        borderColor: theme.border,
                    }]}
                    onPress={() => setShowCompletionsModal(true)}
                  >
                      <Text style={[styles.frequencyText, { color: theme.text }]}>
                          {completionsPerDay} lần
                      </Text>
                      <Icon name="chevron-right" size={24} color={theme.textMuted} />
                  </TouchableOpacity>
              </View>

              {/* Sub-habits */}
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                  <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>
                          Các bước thực hiện ({subHabits.length})
                      </Text>
                      <TouchableOpacity onPress={() => setShowSubHabitModal(true)}>
                          <Icon name="plus-circle" size={24} color={theme.primary} />
                      </TouchableOpacity>
                  </View>

                  {subHabits.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                        Chưa có bước thực hiện nào
                    </Text>
                  ) : (
                    subHabits.map((subHabit, index) => (
                      <View
                        key={subHabit.id}
                        style={[styles.subHabitItem, {
                            backgroundColor: theme.backgroundSecondary,
                            borderColor: theme.border,
                        }]}
                      >
                          <View style={[styles.subHabitNumber, { backgroundColor: selectedColor }]}>
                              <Text style={styles.subHabitNumberText}>{index + 1}</Text>
                          </View>
                          <Text style={[styles.subHabitName, { color: theme.text }]}>
                              {subHabit.name}
                          </Text>
                          <TouchableOpacity onPress={() => removeSubHabit(subHabit.id)}>
                              <Icon name="close-circle" size={24} color={theme.textMuted} />
                          </TouchableOpacity>
                      </View>
                    ))
                  )}
              </View>

              <View style={{ height: 40 }} />
          </ScrollView>

          {/* Template Modal */}
          <Modal
            visible={showTemplates}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowTemplates(false)}
          >
              <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                      <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                          <Text style={[styles.modalTitle, { color: theme.text }]}>Chọn mẫu</Text>
                          <TouchableOpacity onPress={() => setShowTemplates(false)}>
                              <Icon name="close" size={24} color={theme.text} />
                          </TouchableOpacity>
                      </View>
                      <ScrollView>
                          <TouchableOpacity
                            style={[styles.templateButton, {
                                backgroundColor: theme.backgroundSecondary,
                                borderColor: theme.border,
                            }]}
                            onPress={() => setShowTemplates(false)}
                          >
                              <Icon name="pencil" size={24} color={theme.primary} />
                              <Text style={[styles.templateButtonText, { color: theme.text }]}>
                                  Tạo thói quen tùy chỉnh
                              </Text>
                          </TouchableOpacity>

                          {HABIT_TEMPLATES.map((template) => (
                            <TouchableOpacity
                              key={template.id}
                              style={[styles.templateItem, { borderBottomColor: theme.border }]}
                              onPress={() => applyTemplate(template)}
                            >
                                <View style={[styles.templateIcon, { backgroundColor: template.color }]}>
                                    <Icon name={template.icon} size={24} color="#fff" />
                                </View>
                                <View style={styles.templateInfo}>
                                    <Text style={[styles.templateName, { color: theme.text }]}>
                                        {template.name}
                                    </Text>
                                    <Text style={[styles.templateDesc, { color: theme.textMuted }]}>
                                        {template.description}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                          ))}
                      </ScrollView>
                  </View>
              </View>
          </Modal>

          {/* Frequency Modal - CHỈ DAILY VÀ WEEKLY */}
          <Modal
            visible={showFrequencyModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowFrequencyModal(false)}
          >
              <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                      <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                          <Text style={[styles.modalTitle, { color: theme.text }]}>Chọn tần suất</Text>
                          <TouchableOpacity onPress={() => setShowFrequencyModal(false)}>
                              <Icon name="close" size={24} color={theme.text} />
                          </TouchableOpacity>
                      </View>
                      <ScrollView>
                          {/* Daily */}
                          <TouchableOpacity
                            style={[styles.frequencyOption, {
                                backgroundColor: frequency === 'daily' ? theme.primary : theme.backgroundSecondary,
                                borderColor: frequency === 'daily' ? theme.primary : theme.border,
                            }]}
                            onPress={() => {
                                setFrequency('daily');
                                setShowFrequencyModal(false);
                            }}
                          >
                              <Icon
                                name="calendar-today"
                                size={24}
                                color={frequency === 'daily' ? '#fff' : theme.text}
                              />
                              <Text style={[
                                  styles.frequencyOptionText,
                                  { color: frequency === 'daily' ? '#fff' : theme.text }
                              ]}>
                                  Hàng ngày
                              </Text>
                          </TouchableOpacity>

                          {/* Weekly */}
                          <View style={[styles.frequencyOption, {
                              backgroundColor: frequency === 'weekly' ? theme.primary : theme.backgroundSecondary,
                              borderColor: frequency === 'weekly' ? theme.primary : theme.border,
                          }]}>
                              <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                                onPress={() => setFrequency('weekly')}
                              >
                                  <Icon
                                    name="calendar-week"
                                    size={24}
                                    color={frequency === 'weekly' ? '#fff' : theme.text}
                                  />
                                  <Text style={[
                                      styles.frequencyOptionText,
                                      { color: frequency === 'weekly' ? '#fff' : theme.text }
                                  ]}>
                                      Thứ trong tuần
                                  </Text>
                              </TouchableOpacity>
                          </View>

                          {frequency === 'weekly' && (
                            <View style={[styles.daySelector, { marginHorizontal: 16 }]}>
                                {DAYS.map((day) => (
                                  <TouchableOpacity
                                    key={day.id}
                                    style={[styles.dayButton, {
                                        backgroundColor: selectedDays.includes(day.id) ? selectedColor : theme.backgroundSecondary,
                                        borderColor: theme.border,
                                    }]}
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

                          <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: theme.primary }]}
                            onPress={() => setShowFrequencyModal(false)}
                          >
                              <Text style={styles.addButtonText}>Xong</Text>
                          </TouchableOpacity>
                      </ScrollView>
                  </View>
              </View>
          </Modal>

          {/* Completions Per Day Modal */}
          <Modal
            visible={showCompletionsModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCompletionsModal(false)}
          >
              <View style={styles.modalOverlay}>
                  <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
                      <Text style={[styles.modalTitle, { color: theme.text }]}>Số lần hoàn thành mỗi ngày</Text>
                      <TextInput
                        style={[styles.numberInput, { color: theme.text, borderColor: theme.border }]}
                        value={completionsInputValue}
                        onChangeText={setCompletionsInputValue}
                        keyboardType="numeric"
                        placeholder="Nhập số (ví dụ: 3)"
                        placeholderTextColor={theme.textSecondary}
                      />
                      <View style={styles.modalButtons}>
                          <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton, { borderColor: theme.border }]}
                            onPress={() => setShowCompletionsModal(false)}
                          >
                              <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>Hủy</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: '#2196F3' }]}
                            onPress={handleSaveCompletions}
                          >
                              <Text style={styles.modalButtonText}>Lưu</Text>
                          </TouchableOpacity>
                      </View>
                  </View>
              </View>
          </Modal>

          {/* Sub-habit Modal */}
          <Modal
            visible={showSubHabitModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowSubHabitModal(false)}
          >
              <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, styles.smallModal, { backgroundColor: theme.card }]}>
                      <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                          <Text style={[styles.modalTitle, { color: theme.text }]}>Thêm bước</Text>
                          <TouchableOpacity onPress={() => setShowSubHabitModal(false)}>
                              <Icon name="close" size={24} color={theme.text} />
                          </TouchableOpacity>
                      </View>
                      <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.backgroundSecondary,
                            color: theme.text,
                            borderColor: theme.border,
                            margin: 20,
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
    headerTitle: { fontSize: 18, fontWeight: '700' },
    saveButton: { fontSize: 16, fontWeight: '700' },
    content: { flex: 1 },
    section: {
        margin: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconButton: {
        width: 72,
        height: 72,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    colorPicker: { flex: 1 },
    colorOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
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
    templateButtonText: { flex: 1, fontSize: 16, fontWeight: '600' },
    frequencyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    frequencyText: { flex: 1, fontSize: 16 },
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
    dayBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    settingTextContainer: { flex: 1 },
    settingTitle: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
    settingSubtitle: { fontSize: 14 },
    timeInputContainer: { marginTop: 12 },
    label: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
    timeInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    timerInputsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 12,
    },
    timerInputGroup: {
        alignItems: 'center',
        flex: 1,
    },
    timerLabel: { fontSize: 13, marginBottom: 6 },
    timerInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        textAlign: 'center',
        width: '100%',
    },
    timerSeparator: { fontSize: 24, fontWeight: 'bold', marginTop: 16 },
    subHabitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
        gap: 12,
    },
    subHabitNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subHabitNumberText: { fontSize: 13, fontWeight: 'bold', color: '#fff' },
    subHabitName: { flex: 1, fontSize: 16 },
    emptyText: { fontSize: 15, textAlign: 'center', padding: 20 },
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
    },
    modalTitle: { fontSize: 18, fontWeight: '700' },
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
    templateName: { fontSize: 17, fontWeight: '700' },
    templateDesc: { fontSize: 14, marginTop: 2 },
    frequencyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        margin: 16,
        borderRadius: 12,
        borderWidth: 2,
        gap: 12,
    },
    frequencyOptionText: { fontSize: 17, fontWeight: '600' },
    daySelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    dayButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    dayButtonText: { fontSize: 14, fontWeight: '700' },
    addButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        margin: 20,
    },
    addButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    // Modal for Completions
    modalContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        maxHeight: 300,
    },
    numberInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
        borderWidth: 1,
    },
    cancelButton: { backgroundColor: 'transparent' },
    modalButtonText: { fontSize: 16, fontWeight: '700' },
});

export default CreateHabitScreen;