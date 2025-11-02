import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Refactored imports
import { useTheme } from '../../../core/contexts/ThemeContext';
import { HabitContext } from '../../../core/contexts/HabitContext';
import HabitCard from '../components/HabitCard';
import { formatDateLocal } from '../../../utils/dateHelpers';

const AllHabitsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { habits, archiveHabit } = useContext(HabitContext);
  const [longPressedId, setLongPressedId] = useState(null);

  const handleArchive = (habitId) => {
    archiveHabit(habitId);
    setLongPressedId(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>All Habits</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateHabit')}
        >
          <Icon name="plus" size={28} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {habits.length > 0 ? (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onPress={() => navigation.navigate('HabitDetail', { habit })}
              onLongPress={() => setLongPressedId(habit.id)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="inbox" size={64} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              No habits yet
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('CreateHabit')}
            >
              <Text style={styles.createButtonText}>Create your first habit</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Long Press Menu */}
      {longPressedId && (
        <View style={[styles.longPressMenu, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              setLongPressedId(null);
              const habit = habits.find(h => h.id === longPressedId);
              navigation.navigate('CreateHabit', { habit });
            }}
          >
            <Icon name="pencil" size={24} color={theme.primary} />
            <Text style={[styles.menuButtonText, { color: theme.text }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => handleArchive(longPressedId)}
          >
            <Icon name="delete" size={24} color={theme.error} />
            <Text style={[styles.menuButtonText, { color: theme.error }]}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setLongPressedId(null)}
          >
            <Icon name="close" size={24} color={theme.textMuted} />
            <Text style={[styles.menuButtonText, { color: theme.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  longPressMenu: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 16,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuButton: {
    alignItems: 'center',
    padding: 12,
    flex: 1,
  },
  menuButtonText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default AllHabitsScreen;