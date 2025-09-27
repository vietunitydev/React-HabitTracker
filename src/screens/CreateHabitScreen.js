// src/screens/CreateHabitScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Switch,
    Modal,
    Animated,
    PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { HabitColor } from '../constants/HabitColor';
import { HabitContext } from '../contexts/HabitContext';

const CreateHabitScreen = ({ navigation, route }) => {
    const { addHabit, updateHabit } = useContext(HabitContext);
    const isEditing = !!route.params?.habit;
    const [name, setName] = useState(route.params?.habit?.name || '');
    const [description, setDescription] = useState(route.params?.habit?.description || '');
    const [selectedIcon, setSelectedIcon] = useState(route.params?.habit?.icon || 'pen');
    const [selectedColor, setSelectedColor] = useState(route.params?.habit?.color || '#54A0FF');
    const [goalStreak, setGoalStreak] = useState(
      route.params?.habit?.goalStreak?.toString() || '7'
    );
    const [notificationEnabled, setNotificationEnabled] = useState(
      route.params?.habit?.notification?.enabled || false
    );
    const [notificationTime, setNotificationTime] = useState(
      route.params?.habit?.notification?.time
        ? new Date(`2023-01-01T${route.params.habit.notification.time}:00`)
        : new Date()
    );
    const [showNotificationTimeModal, setShowNotificationTimeModal] = useState(false);
    const [category, setCategory] = useState(route.params?.habit?.category || 'Health');
    const [completionsPerDay, setCompletionsPerDay] = useState(
      route.params?.habit?.completionsPerDay?.toString() || '1'
    );

    const [timeCompletionsEnable, setTimeCompletionsEnable] = useState(
      route.params?.habit?.completionTime?.enabled || false
    );
    const [completionTime, setCompletionTime] = useState(
      route.params?.habit?.completionTime?.time
        ? new Date(`2023-01-01T${route.params.habit.completionTime.time}`)
        : new Date(new Date().setHours(0, 5, 0, 0))
    );
    const [showCompletionTimeModal, setShowCompletionTimeModal] = useState(false);

    const categories = [
        'Sức khỏe',
        'Thể dục',
        'Năng suất',
        'Học tập',
        'Chánh niệm',
        'Xã hội',
        'Sáng tạo',
        'Tài chính',
        'Sự nghiệp',
        'Cá nhân',
    ];

    useEffect(() => {
        if (route.params?.selectedIcon) {
            setSelectedIcon(route.params.selectedIcon);
        }
    }, [route.params]);

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên thói quen');
            return;
        }

        const habitData = {
            id: isEditing ? route.params.habit.id : Date.now().toString(),
            name: name.trim(),
            description: description.trim(),
            icon: selectedIcon,
            color: selectedColor,
            goalStreak: parseInt(goalStreak) || 7,
            notification: {
                enabled: notificationEnabled,
                time: notificationTime.toTimeString().slice(0, 5),
            },
            completionTime: {
                enabled: timeCompletionsEnable,
                time: completionTime.getHours().toString().padStart(2, '0') + ':' +
                  completionTime.getMinutes().toString().padStart(2, '0') + ':' +
                  completionTime.getSeconds().toString().padStart(2, '0'),
            },
            category,
            completionsPerDay: parseInt(completionsPerDay) || 1,
            completions: isEditing ? route.params.habit.completions || [] : [],
            completionCounts: isEditing ? route.params.habit.completionCounts || {} : {},
            createdAt: isEditing ? route.params.habit.createdAt : new Date().toISOString(),
        };

        if (isEditing) {
            updateHabit(habitData);
        } else {
            addHabit(habitData);
        }

        navigation.popToTop();
    };

    const handleNotificationTimeConfirm = (hour, minute) => {
        const newTime = new Date(notificationTime);
        newTime.setHours(hour);
        newTime.setMinutes(minute);
        newTime.setSeconds(0);
        setNotificationTime(newTime);
        setShowNotificationTimeModal(false);
    };

    const handleCompletionTimeConfirm = (minute, second) => {
        const newTime = new Date(completionTime);
        newTime.setHours(0);
        newTime.setMinutes(minute);
        newTime.setSeconds(second);
        setCompletionTime(newTime);
        setShowCompletionTimeModal(false);
    };

    // Mở màn hình chọn biểu tượng
    const openIconSelector = () => {
        navigation.navigate('ChooseIconImage', {
            currentIcon: selectedIcon,
        });
    };

    // Tạo ma trận màu
    const colorMatrix = [];
    for (let i = 0; i < HabitColor.length; i += 8) {
        colorMatrix.push(HabitColor.slice(i, i + 8));
    }

    const isNameFilled = name.trim().length > 0;

    // Modern Time Picker Modal
    const TimePickerModal = ({ visible, onClose, onConfirm, initialTime, title, accentColor, includeSeconds = false }) => {
        const [selectedHour, setSelectedHour] = useState(initialTime.getHours());
        const [selectedMinute, setSelectedMinute] = useState(initialTime.getMinutes());
        const [selectedSecond, setSelectedSecond] = useState(initialTime.getSeconds());
        const slideAnim = new Animated.Value(300);

        useEffect(() => {
            if (visible) {
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                }).start();
            }
        }, [visible]);

        const formatTime = (hour, minute, second = 0) => {
            if (includeSeconds) {
                return `${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
            }
            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        };

        return (
          <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
          >
              <View style={styles.modalOverlay}>
                  <Animated.View
                    style={[
                        styles.modernModalContent,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                  >
                      {/* Header */}
                      <View style={styles.modernModalHeader}>
                          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                              <Icon name="close" size={24} color="#666" />
                          </TouchableOpacity>
                          <Text style={styles.modernModalTitle}>{title}</Text>
                          <View style={styles.headerSpacer} />
                      </View>

                      {/* Time Display */}
                      <View style={styles.timeDisplayContainer}>
                          <View style={[styles.timeCircle, { borderColor: accentColor }]}>
                              <Text style={[styles.timeDisplayText, { color: accentColor }]}>
                                  {formatTime(selectedHour, selectedMinute, selectedSecond)}
                              </Text>
                          </View>
                      </View>

                      {/* Time Controls with Scroll Pickers */}
                      <View style={styles.timeControlsContainer}>
                          {includeSeconds ? (
                            <>
                                {/* Minute Picker for Completion */}
                                <View style={styles.timeControlGroup}>
                                    <Text style={styles.timeControlLabel}>Phút</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                          selectedValue={selectedMinute}
                                          onValueChange={(itemValue) => setSelectedMinute(itemValue)}
                                          style={styles.timePicker}
                                          itemStyle={styles.timePickerItem}
                                        >
                                            {Array.from({ length: 60 }, (_, i) => (
                                              <Picker.Item
                                                key={i}
                                                label={i.toString().padStart(2, '0')}
                                                value={i}
                                              />
                                            ))}
                                        </Picker>
                                    </View>
                                </View>

                                {/* Separator */}
                                <View style={styles.timeSeparator}>
                                    <Text style={styles.colonText}>:</Text>
                                </View>

                                {/* Second Picker */}
                                <View style={styles.timeControlGroup}>
                                    <Text style={styles.timeControlLabel}>Giây</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                          selectedValue={selectedSecond}
                                          onValueChange={(itemValue) => setSelectedSecond(itemValue)}
                                          style={styles.timePicker}
                                          itemStyle={styles.timePickerItem}
                                        >
                                            {Array.from({ length: 12 }, (_, i) => i * 5).map((val) => (
                                              <Picker.Item
                                                key={val}
                                                label={val.toString().padStart(2, '0')}
                                                value={val}
                                              />
                                            ))}
                                        </Picker>
                                    </View>
                                </View>
                            </>
                          ) : (
                            <>
                                {/* Hour Picker for Notification */}
                                <View style={styles.timeControlGroup}>
                                    <Text style={styles.timeControlLabel}>Giờ</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                          selectedValue={selectedHour}
                                          onValueChange={(itemValue) => setSelectedHour(itemValue)}
                                          style={styles.timePicker}
                                          itemStyle={styles.timePickerItem}
                                        >
                                            {Array.from({ length: 24 }, (_, i) => (
                                              <Picker.Item
                                                key={i}
                                                label={i.toString().padStart(2, '0')}
                                                value={i}
                                              />
                                            ))}
                                        </Picker>
                                    </View>
                                </View>

                                {/* Separator */}
                                <View style={styles.timeSeparator}>
                                    <Text style={styles.colonText}>:</Text>
                                </View>

                                {/* Minute Picker */}
                                <View style={styles.timeControlGroup}>
                                    <Text style={styles.timeControlLabel}>Phút</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                          selectedValue={selectedMinute}
                                          onValueChange={(itemValue) => setSelectedMinute(itemValue)}
                                          style={styles.timePicker}
                                          itemStyle={styles.timePickerItem}
                                        >
                                            {Array.from({ length: 60 }, (_, i) => (
                                              <Picker.Item
                                                key={i}
                                                label={i.toString().padStart(2, '0')}
                                                value={i}
                                              />
                                            ))}
                                        </Picker>
                                    </View>
                                </View>
                            </>
                          )}
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.modernModalButtons}>
                          <TouchableOpacity
                            style={styles.modernModalButton}
                            onPress={onClose}
                          >
                              <Text style={styles.modernModalButtonText}>Hủy</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.modernModalButton, styles.modernConfirmButton, { backgroundColor: accentColor }]}
                            onPress={() => {
                                if (includeSeconds) {
                                    onConfirm(selectedMinute, selectedSecond);
                                } else {
                                    onConfirm(selectedHour, selectedMinute);
                                }
                            }}
                          >
                              <Text style={[styles.modernModalButtonText, styles.modernConfirmButtonText]}>
                                  Xác nhận
                              </Text>
                          </TouchableOpacity>
                      </View>
                  </Animated.View>
              </View>
          </Modal>
        );
    };

    return (
      <SafeAreaView style={styles.container}>
          <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => navigation.goBack()}
              >
                  <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.title}>{isEditing ? 'Chỉnh sửa thói quen' : 'Tạo thói quen mới'}</Text>
              <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.content}>
              <TouchableOpacity style={styles.iconPreview} onPress={openIconSelector}>
                  <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
                      <Icon name={selectedIcon} size={32} color="#fff" />
                  </View>
                  <Text style={styles.iconHint}>Chạm để thay đổi biểu tượng</Text>
              </TouchableOpacity>

              <View style={styles.section}>
                  <Text style={styles.label}>Tên</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Nhập tên thói quen"
                    placeholderTextColor="#666"
                  />
              </View>

              <View style={styles.section}>
                  <Text style={styles.label}>Mô tả</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Nhập mô tả (không bắt buộc)"
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                  />
              </View>

              <View style={styles.section}>
                  <Text style={styles.label}>Danh mục</Text>
                  <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={category}
                        onValueChange={setCategory}
                        style={styles.picker}
                        dropdownIconColor="#fff"
                      >
                          {categories.map((cat) => (
                            <Picker.Item key={cat} label={cat} value={cat} color="#fff" />
                          ))}
                      </Picker>
                  </View>
              </View>

              <View style={styles.section}>
                  <Text style={styles.label}>Số lần hoàn thành mỗi ngày</Text>
                  <TextInput
                    style={styles.input}
                    value={completionsPerDay}
                    onChangeText={setCompletionsPerDay}
                    placeholder="1"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
              </View>

              <View style={styles.section}>
                  <View style={styles.notificationHeader}>
                      <Text style={styles.label}>Thời gian thực hiện</Text>
                      <Switch
                        value={timeCompletionsEnable}
                        onValueChange={setTimeCompletionsEnable}
                        trackColor={{ false: '#2a2a2a', true: '#007AFF' }}
                        thumbColor={timeCompletionsEnable ? '#fff' : '#666'}
                      />
                  </View>
                  {timeCompletionsEnable && (
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowCompletionTimeModal(true)}
                    >
                        <View style={styles.timeButtonContent}>
                            <Icon name="clock-outline" size={24} color="#007AFF" />
                            <Text style={styles.timeButtonText}>
                                {completionTime.getMinutes().toString().padStart(2, '0')}:
                                {completionTime.getSeconds().toString().padStart(2, '0')}
                            </Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
              </View>

              <View style={styles.section}>
                  <View style={styles.notificationHeader}>
                      <Text style={styles.label}>Thông báo</Text>
                      <Switch
                        value={notificationEnabled}
                        onValueChange={setNotificationEnabled}
                        trackColor={{ false: '#2a2a2a', true: '#007AFF' }}
                        thumbColor={notificationEnabled ? '#fff' : '#666'}
                      />
                  </View>
                  {notificationEnabled && (
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowNotificationTimeModal(true)}
                    >
                        <View style={styles.timeButtonContent}>
                            <Icon name="bell-outline" size={24} color="#FFA726" />
                            <Text style={styles.timeButtonText}>
                                {notificationTime.toTimeString().slice(0, 5)}
                            </Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
              </View>

              <View style={styles.section}>
                  <Text style={styles.label}>Màu sắc</Text>
                  <View style={styles.colorMatrix}>
                      {colorMatrix.map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.colorRow}>
                            {row.map((color) => (
                              <TouchableOpacity
                                key={color}
                                style={[
                                    styles.colorOption,
                                    { backgroundColor: color },
                                    selectedColor === color && styles.selectedColorOption,
                                ]}
                                onPress={() => setSelectedColor(color)}
                              />
                            ))}
                        </View>
                      ))}
                  </View>
              </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveButton, !isNameFilled && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!isNameFilled}
          >
              <Text
                style={[
                    styles.saveButtonText,
                    !isNameFilled && styles.saveButtonTextDisabled,
                ]}
              >
                  Lưu
              </Text>
          </TouchableOpacity>

          <TimePickerModal
            visible={showCompletionTimeModal}
            onClose={() => setShowCompletionTimeModal(false)}
            onConfirm={handleCompletionTimeConfirm}
            initialTime={completionTime}
            title="Chọn thời gian hoàn thành"
            accentColor="#007AFF"
            includeSeconds={true}
          />

          <TimePickerModal
            visible={showNotificationTimeModal}
            onClose={() => setShowNotificationTimeModal(false)}
            onConfirm={handleNotificationTimeConfirm}
            initialTime={notificationTime}
            title="Chọn thời gian thông báo"
            accentColor="#FFA726"
            includeSeconds={false}
          />
      </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    closeButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    iconPreview: {
        alignItems: 'center',
        marginVertical: 30,
    },
    previewIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconHint: {
        color: '#888',
        fontSize: 14,
        marginTop: 8,
    },
    section: {
        marginBottom: 30,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: '#fff',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#fff',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        color: '#fff',
        backgroundColor: '#1E1E1E',
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    timeButton: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    timeButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    timeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    colorMatrix: {
        gap: 12,
    },
    colorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
    },
    colorOption: {
        width: 30,
        height: 30,
        borderRadius: 4,
    },
    selectedColorOption: {
        borderWidth: 2,
        borderColor: '#fff',
    },
    saveButton: {
        backgroundColor: '#0288D1',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#424242',
        opacity: 0.5,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonTextDisabled: {
        color: '#888',
    },
    // Modern Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modernModalContent: {
        backgroundColor: '#1E1E1E',
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        overflow: 'hidden',
    },
    modernModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    modalCloseButton: {
        padding: 8,
    },
    modernModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    timeDisplayContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    timeCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
    },
    timeDisplayText: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    timeControlsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    timeControlGroup: {
        alignItems: 'center',
        flex: 1,
    },
    timeControlLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 10,
    },
    timeSeparator: {
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingBottom: 50, // Align colon with picker text
    },
    colonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    timePicker: {
        height: 150,
        width: 100,
        color: '#fff',
        backgroundColor: 'transparent',
    },
    timePickerItem: {
        color: '#fff',
        fontSize: 20,
    },
    modernModalButtons: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#2a2a2a',
    },
    modernModalButton: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modernConfirmButton: {
        borderLeftWidth: 1,
        borderLeftColor: '#2a2a2a',
    },
    modernModalButtonText: {
        fontSize: 16,
        color: '#888',
        fontWeight: '500',
    },
    modernConfirmButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default CreateHabitScreen;