import React, { useContext, useState, useCallback } from 'react';
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
import { HabitContext } from '../contexts/HabitContext';

const formatDateLocal = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HabitItem = ({ habit, theme, navigation, onArchive }) => {
  const { toggleHabitCompletion } = useContext(HabitContext);
  const [isLongPressed, setIsLongPressed] = useState(false);
  const [overlayOpacity] = useState(new Animated.Value(0));

  const today = formatDateLocal(new Date());
  const completionsPerDay = habit.completionsPerDay || 1;
  const currentCount = habit.completionCounts?.[today] || 0;
  const isCompleted = currentCount >= completionsPerDay;
  const progress = (currentCount / completionsPerDay) * 100;

  const handleLongPress = () => {
    setIsLongPressed(true);
    Animated.timing(overlayOpacity, {
      toValue: 0.5,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleLongPressEnd = () => {
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      setIsLongPressed(false);
    });
  };

  const handleArchive = () => {
    onArchive(habit.id);
    handleLongPressEnd();
  };

  const handleToggle = () => {
    if (!isLongPressed) {
      toggleHabitCompletion(habit.id, today);
    }
  };

  return (
    <>
      {isLongPressed && (
        <Animated.View
          style={[
            styles.overlay,
            { opacity: overlayOpacity }
          ]}
        />
      )}

      <TouchableOpacity
        style={[
          styles.habitItem,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }
        ]}
        onPress={() => !isLongPressed && navigation.navigate('HabitDetail', { habit })}
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <TouchableOpacity
          style={[styles.checkBox, { borderColor: theme.border }]}
          onPress={handleToggle}
        >
          {isCompleted && (
            <Icon name="check" size={20} color={habit.color} />
          )}
        </TouchableOpacity>

        <View style={[styles.iconContainer, { backgroundColor: habit.color }]}>
          <Icon name={habit.icon} size={18} color="#fff" />
        </View>

        <View style={styles.habitContent}>
          <Text style={[styles.habitName, { color: theme.text }]}>
            {habit.name}
          </Text>
          {habit.description && (
            <Text style={[styles.habitDescription, { color: theme.textSecondary }]}>
              {habit.description}
            </Text>
          )}
          {completionsPerDay > 1 && (
            <Text style={[styles.progressText, { color: theme.textTertiary }]}>
              {currentCount}/{completionsPerDay} completed
            </Text>
          )}
        </View>

        <View style={styles.habitMeta}>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: habit.color,
                  width: `${progress}%`,
                }
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>

      {isLongPressed && (
        <View style={[styles.longPressMenu, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              handleLongPressEnd();
              navigation.navigate('CreateHabit', { habit });
            }}
          >
            <Icon name="pencil" size={24} color={theme.primary} />
            <Text style={[styles.menuButtonText, { color: theme.text }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleArchive}
          >
            <Icon name="delete" size={24} color={theme.error} />
            <Text style={[styles.menuButtonText, { color: theme.error }]}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleLongPressEnd}
          >
            <Icon name="close" size={24} color={theme.textMuted} />
            <Text style={[styles.menuButtonText, { color: theme.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

const AllHabitsScreen = ({ navigation }) => {
  const { habits, theme, archiveHabit } = useContext(HabitContext);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        {/*<TouchableOpacity*/}
        {/*  style={styles.backButton}*/}
        {/*  onPress={() => navigation.goBack()}*/}
        {/*>*/}
        {/*  <Icon name="arrow-left" size={24} color={theme.text} />*/}
        {/*</TouchableOpacity>*/}
        <Text style={[styles.title, { color: theme.text }]}>All Habits</Text>
        {/*<TouchableOpacity*/}
        {/*  onPress={() => navigation.navigate('CreateHabit')}*/}
        {/*>*/}
        {/*  <Icon name="plus" size={28} color={theme.primary} />*/}
        {/*</TouchableOpacity>*/}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {habits.length > 0 ? (
          habits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              theme={theme}
              navigation={navigation}
              onArchive={archiveHabit}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 999,
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
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitContent: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  habitDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
  },
  habitMeta: {
    marginLeft: 8,
  },
  progressBar: {
    width: 60,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
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
    zIndex: 1000,
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