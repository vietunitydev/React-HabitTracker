import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StyleSheet,
    Alert,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width} = Dimensions.get('window');

const HabitDetailScreen = ({navigation, route}) => {
    const [habit, setHabit] = useState(route.params.habit);
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [totalCompletions, setTotalCompletions] = useState(0);

    useEffect(() => {
        calculateStats();
    }, [habit]);

    const calculateStats = () => {
        const completions = habit.completions || [];
        setTotalCompletions(completions.length);

        // Calculate current streak
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);

        while (true) {
            const dateString = currentDate.toISOString().split('T')[0];
            if (completions.includes(dateString)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        setCurrentStreak(streak);

        // Calculate longest streak
        if (completions.length === 0) {
            setLongestStreak(0);
            return;
        }

        const sortedDates = completions
            .map(date => new Date(date))
            .sort((a, b) => a - b);

        let maxStreak = 1;
        let currentLongestStreak = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = sortedDates[i - 1];
            const currentDate = sortedDates[i];
            const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);

            if (dayDiff === 1) {
                currentLongestStreak++;
            } else {
                maxStreak = Math.max(maxStreak, currentLongestStreak);
                currentLongestStreak = 1;
            }
        }
        maxStreak = Math.max(maxStreak, currentLongestStreak);
        setLongestStreak(maxStreak);
    };

    const toggleDateCompletion = async (dateString) => {
        const completions = habit.completions || [];
        const dateIndex = completions.indexOf(dateString);
        let updatedCompletions;

        if (dateIndex > -1) {
            updatedCompletions = completions.filter(date => date !== dateString);
        } else {
            updatedCompletions = [...completions, dateString];
        }

        const updatedHabit = {...habit, completions: updatedCompletions};
        setHabit(updatedHabit);

        try {
            const habitsData = await AsyncStorage.getItem('habits');
            const habits = habitsData ? JSON.parse(habitsData) : [];
            const updatedHabits = habits.map(h =>
                h.id === habit.id ? updatedHabit : h
            );
            await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
        } catch (error) {
            console.error('Error updating habit:', error);
            Alert.alert('Error', 'Failed to update habit');
        }
    };

    const generateCalendar = () => {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const calendar = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().split('T')[0];
            const isCompleted = habit.completions?.includes(dateString) || false;
            const isToday = dateString === today.toISOString().split('T')[0];
            const isFuture = currentDate > today;

            calendar.push({
                date: new Date(currentDate),
                dateString,
                isCompleted,
                isToday,
                isFuture,
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return calendar;
    };

    const renderCalendar = () => {
        const calendar = generateCalendar();
        const weeks = [];

        // Group days by week
        for (let i = 0; i < calendar.length; i += 7) {
            weeks.push(calendar.slice(i, i + 7));
        }

        return (
            <View style={styles.calendarContainer}>
                <View style={styles.weekDaysHeader}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                        <Text key={index} style={styles.weekDayText}>{day}</Text>
                    ))}
                </View>

                {weeks.map((week, weekIndex) => (
                    <View key={weekIndex} style={styles.weekRow}>
                        {week.map((day, dayIndex) => (
                            <TouchableOpacity
                                key={dayIndex}
                                style={[
                                    styles.dayButton,
                                    day.isCompleted && {backgroundColor: habit.color},
                                    day.isToday && styles.todayButton,
                                    day.isFuture && styles.futureDay,
                                ]}
                                onPress={() => !day.isFuture && toggleDateCompletion(day.dateString)}
                                disabled={day.isFuture}>
                                <Text style={[
                                    styles.dayText,
                                    day.isCompleted && styles.completedDayText,
                                    day.isToday && styles.todayText,
                                    day.isFuture && styles.futureDayText,
                                ]}>
                                    {day.date.getDate()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>
        );
    };

    const deleteHabit = async () => {
        Alert.alert(
            'Delete Habit',
            'Are you sure you want to delete this habit? This action cannot be undone.',
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const habitsData = await AsyncStorage.getItem('habits');
                            const habits = habitsData ? JSON.parse(habitsData) : [];
                            const updatedHabits = habits.filter(h => h.id !== habit.id);
                            await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error deleting habit:', error);
                            Alert.alert('Error', 'Failed to delete habit');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Habit Details</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                        Alert.alert('Coming Soon', 'Edit functionality will be available in the next update');
                    }}>
                    <Icon name="pencil" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Habit Info */}
                <View style={styles.habitInfo}>
                    <View style={[styles.habitIcon, {backgroundColor: habit.color}]}>
                        <Icon name={habit.icon} size={32} color="#fff" />
                    </View>
                    <View style={styles.habitText}>
                        <Text style={styles.habitName}>{habit.name}</Text>
                        {habit.description && (
                            <Text style={styles.habitDescription}>{habit.description}</Text>
                        )}
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{currentStreak}</Text>
                        <Text style={styles.statLabel}>Current Streak</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{longestStreak}</Text>
                        <Text style={styles.statLabel}>Longest Streak</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{totalCompletions}</Text>
                        <Text style={styles.statLabel}>Total Completions</Text>
                    </View>
                </View>

                {/* Calendar */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Calendar</Text>
                    {renderCalendar()}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            const today = new Date().toISOString().split('T')[0];
                            toggleDateCompletion(today);
                        }}>
                        <Icon name="check-circle" size={20} color="#4CAF50" />
                        <Text style={styles.actionButtonText}>Mark Today as Complete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            Alert.alert('Coming Soon', 'Set goal streak functionality will be available in the next update');
                        }}>
                        <Icon name="target" size={20} color="#FF9800" />
                        <Text style={styles.actionButtonText}>Set Goal Streak</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            Alert.alert('Coming Soon', 'View detailed statistics will be available in the next update');
                        }}>
                        <Icon name="chart-line" size={20} color="#2196F3" />
                        <Text style={styles.actionButtonText}>View Statistics</Text>
                    </TouchableOpacity>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Danger Zone</Text>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={deleteHabit}>
                        <Icon name="delete" size={20} color="#F44336" />
                        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                            Delete Habit
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    editButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    habitInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    habitIcon: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    habitText: {
        flex: 1,
    },
    habitName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    habitDescription: {
        fontSize: 16,
        color: '#999',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 16,
    },
    calendarContainer: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
    },
    weekDaysHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    weekDayText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
        width: 32,
        textAlign: 'center',
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    dayButton: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    todayButton: {
        borderWidth: 2,
        borderColor: '#007AFF',
    },
    futureDay: {
        backgroundColor: '#1a1a1a',
    },
    dayText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    completedDayText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    todayText: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    futureDayText: {
        color: '#444',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 12,
    },
    deleteButton: {
        backgroundColor: '#2a1a1a',
    },
    deleteButtonText: {
        color: '#F44336',
    },
});

export default HabitDetailScreen;