import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HABIT_ICONS = [
    'run-fast',
    'dumbbell',
    'book-open',
    'water',
    'meditation',
    'sleep',
    'food-apple',
    'music',
    'camera',
    'palette',
    'code-braces',
    'language-javascript',
];

const HABIT_COLORS = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FECA57',
    '#FF9FF3',
    '#54A0FF',
    '#5F27CD',
    '#00D2D3',
    '#FF9F43',
    '#10AC84',
    '#EE5A6F',
];

const CreateHabitScreen = ({navigation}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('run-fast');
    const [selectedColor, setSelectedColor] = useState('#FF6B6B');

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a habit name');
            return;
        }

        try {
            const existingHabits = await AsyncStorage.getItem('habits');
            const habits = existingHabits ? JSON.parse(existingHabits) : [];

            const newHabit = {
                id: Date.now().toString(),
                name: name.trim(),
                description: description.trim(),
                icon: selectedIcon,
                color: selectedColor,
                completions: [],
                createdAt: new Date().toISOString(),
            };

            habits.push(newHabit);
            await AsyncStorage.setItem('habits', JSON.stringify(habits));

            navigation.goBack();
        } catch (error) {
            console.error('Error saving habit:', error);
            Alert.alert('Error', 'Failed to save habit');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => navigation.goBack()}>
                    <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>New Habit</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.iconPreview}>
                    <View style={[styles.previewIcon, {backgroundColor: selectedColor}]}>
                        <Icon name={selectedIcon} size={32} color="#fff" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter habit name"
                        placeholderTextColor="#666"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Enter description (optional)"
                        placeholderTextColor="#666"
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Icon</Text>
                    <View style={styles.iconGrid}>
                        {HABIT_ICONS.map(icon => (
                            <TouchableOpacity
                                key={icon}
                                style={[
                                    styles.iconOption,
                                    selectedIcon === icon && styles.selectedIconOption,
                                ]}
                                onPress={() => setSelectedIcon(icon)}>
                                <Icon name={icon} size={24} color="#fff" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Color</Text>
                    <View style={styles.colorGrid}>
                        {HABIT_COLORS.map(color => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.colorOption,
                                    {backgroundColor: color},
                                    selectedColor === color && styles.selectedColorOption,
                                ]}
                                onPress={() => setSelectedColor(color)}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
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
    section: {
        marginBottom: 30,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    input: {
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        color: '#fff',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    iconOption: {
        width: 48,
        height: 48,
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedIconOption: {
        backgroundColor: '#007AFF',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorOption: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    selectedColorOption: {
        borderWidth: 3,
        borderColor: '#fff',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CreateHabitScreen;
