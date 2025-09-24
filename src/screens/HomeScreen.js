import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StyleSheet,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width} = Dimensions.get('window');

const HomeScreen = ({navigation}) => {
    const [habits, setHabits] = useState([]);

    useEffect(() => {
        loadHabits();
    }, []);

    const loadHabits = async () => {
        try {
            const habitsData = await AsyncStorage.getItem('habits');
            if (habitsData) {
                setHabits(JSON.parse(habitsData));
            }
        } catch (error) {
            console.error('Error loading habits:', error);
        }
    };

    const toggleHabitCompletion = async (habitId, date) => {
        const updatedHabits = habits.map(habit => {
            if (habit.id === habitId) {
                const completions = habit.completions || [];
                const dateIndex = completions.indexOf(date);

                if (dateIndex > -1) {
                    completions.splice(dateIndex, 1);
                } else {
                    completions.push(date);
                }

                return {...habit, completions};
            }
            return habit;
        });

        setHabits(updatedHabits);
        await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
    };

    const generateCalendarGrid = (habit) => {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const grid = [];
        const completions = habit.completions || [];

        for (let i = 0; i < 365; i++) {
            const date = new Date(startOfYear);
            date.setDate(startOfYear.getDate() + i);
            const dateString = date.toISOString().split('T')[0];
            const isCompleted = completions.includes(dateString);

            grid.push({
                date: dateString,
                isCompleted,
            });
        }

        return grid;
    };

    const HabitItem = ({habit}) => {
        const grid = generateCalendarGrid(habit);
        const today = new Date().toISOString().split('T')[0];
        const todayCompleted = habit.completions?.includes(today) || false;

        return (
            <TouchableOpacity
                style={styles.habitItem}
                onPress={() => navigation.navigate('HabitDetail', {habit})}>
                <View style={styles.habitHeader}>
                    <View style={styles.habitInfo}>
                        <View style={[styles.habitIcon, {backgroundColor: habit.color}]}>
                            <Icon name={habit.icon} size={24} color="#fff" />
                        </View>
                        <View style={styles.habitText}>
                            <Text style={styles.habitName}>{habit.name}</Text>
                            <Text style={styles.habitDescription}>{habit.description}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.checkButton,
                            todayCompleted && styles.checkButtonCompleted,
                        ]}
                        onPress={() => toggleHabitCompletion(habit.id, today)}>
                        <Icon
                            name={todayCompleted ? 'check' : 'check'}
                            size={20}
                            color={todayCompleted ? '#fff' : '#666'}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.calendarGrid}>
                    {grid.slice(-84).map((day, index) => (
                        <View
                            key={index}
                            style={[
                                styles.calendarDay,
                                day.isCompleted && {backgroundColor: habit.color},
                            ]}
                        />
                    ))}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => navigation.navigate('Settings')}>
                    <Icon name="cog" size={24} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.appTitle}>Habit Tracker</Text>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.proButton}>
                        <Text style={styles.proButtonText}>PRO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.analyticsButton}>
                        <Icon name="chart-line" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('CreateHabit')}>
                        <Icon name="plus" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.habitsList}>
                {habits.map(habit => (
                    <HabitItem key={habit.id} habit={habit} />
                ))}

                {habits.length === 0 && (
                    <View style={styles.emptyState}>
                        <Icon name="format-list-checks" size={48} color="#444" />
                        <Text style={styles.emptyText}>No habits yet</Text>
                        <Text style={styles.emptySubtext}>
                            Tap the + button to create your first habit
                        </Text>
                    </View>
                )}
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
    settingsButton: {
        padding: 8,
    },
    appTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    proButton: {
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    proButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    analyticsButton: {
        padding: 8,
    },
    addButton: {
        backgroundColor: '#007AFF',
        padding: 8,
        borderRadius: 16,
    },
    habitsList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    habitItem: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    habitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    habitInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    habitIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    habitText: {
        flex: 1,
    },
    habitName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    habitDescription: {
        color: '#999',
        fontSize: 14,
        marginTop: 2,
    },
    checkButton: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkButtonCompleted: {
        backgroundColor: '#34C759',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
    },
    calendarDay: {
        width: 8,
        height: 8,
        backgroundColor: '#333',
        borderRadius: 2,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: '#666',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#555',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});

export default HomeScreen;