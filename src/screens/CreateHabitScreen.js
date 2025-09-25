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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { HabitColor } from '../constants/HabitColor';
import { HabitContext } from '../contexts/HabitContext';

const CreateHabitScreen = ({ navigation, route }) => {
    const { addHabit, updateHabit } = useContext(HabitContext);
    const isEditing = !!route.params?.habit;
    const [name, setName] = useState(route.params?.habit?.name || '');
    const [description, setDescription] = useState(route.params?.habit?.description || '');
    const [selectedIcon, setSelectedIcon] = useState(route.params?.habit?.icon || 'pen');
    const [selectedColor, setSelectedColor] = useState(route.params?.habit?.color || '#FF6B6B');
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
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [category, setCategory] = useState(route.params?.habit?.category || 'Health');
    const [completionsPerDay, setCompletionsPerDay] = useState(
      route.params?.habit?.completionsPerDay?.toString() || '1'
    );

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
            id: isEditing ? route.params.habit.id : Date.now().toString(), // ID cho thói quen mới
            name: name.trim(),
            description: description.trim(),
            icon: selectedIcon,
            color: selectedColor,
            goalStreak: parseInt(goalStreak) || 7,
            notification: {
                enabled: notificationEnabled,
                time: notificationTime.toTimeString().slice(0, 5), // Lưu thời gian dạng HH:mm
            },
            category,
            completionsPerDay: parseInt(completionsPerDay) || 1,
            completions: isEditing ? route.params.habit.completions || [] : [],
            completionCounts: isEditing ? route.params.habit.completionCounts || {} : {},
            createdAt: isEditing ? route.params.habit.createdAt : new Date().toISOString(),
        };

        if (isEditing) {
            updateHabit(habitData); // Cập nhật thói quen
        } else {
            addHabit(habitData); // Thêm thói quen mới
        }

        navigation.popToTop();
    };

    const handleTimeChange = (event, selectedTime) => {
        setShowTimePicker(false);
        if (selectedTime) {
            setNotificationTime(selectedTime);
        }
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
                  <Text style={styles.label}>Chuỗi mục tiêu (ngày)</Text>
                  <TextInput
                    style={styles.input}
                    value={goalStreak}
                    onChangeText={setGoalStreak}
                    placeholder="7"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
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
                      onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={styles.timeButtonText}>
                            {notificationTime.toTimeString().slice(0, 5)}
                        </Text>
                        <Icon name="clock-outline" size={20} color="#666" />
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

          {showTimePicker && (
            <DateTimePicker
              value={notificationTime}
              mode="time"
              is24Hour={true}
              onChange={handleTimeChange}
            />
          )}
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
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeButtonText: {
        color: '#fff',
        fontSize: 16,
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
});

export default CreateHabitScreen;