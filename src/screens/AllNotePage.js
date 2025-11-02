import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitContext } from '../contexts/HabitContext';

const AllNotePage = ({ navigation }) => {
  const { habits, theme } = useContext(HabitContext);
  const [searchQuery, setSearchQuery] = useState('');

  // Lấy tất cả notes từ tất cả habits
  const getAllNotes = () => {
    const allNotes = [];

    habits.forEach(habit => {
      if (habit.notes && Array.isArray(habit.notes)) {
        habit.notes.forEach(note => {
          allNotes.push({
            ...note,
            habitId: habit.id,
            habitName: habit.name,
            habitColor: habit.color,
            habitIcon: habit.icon,
          });
        });
      }
    });

    // Sắp xếp theo ngày mới nhất
    return allNotes.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const allNotes = getAllNotes();

  // Lọc notes theo search query
  const filteredNotes = allNotes.filter(note => {
    const searchLower = searchQuery.toLowerCase();
    return (
      note.content?.toLowerCase().includes(searchLower) ||
      note.habitName?.toLowerCase().includes(searchLower) ||
      note.date?.includes(searchQuery)
    );
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return 'Hôm nay';
    } else if (compareDate.getTime() === yesterday.getTime()) {
      return 'Hôm qua';
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  const handleNotePress = (note) => {
    // Tìm habit tương ứng
    const habit = habits.find(h => h.id === note.habitId);
    if (habit) {
      navigation.navigate('Note', {
        habitId: habit.id,
        date: note.date,
      });
    }
  };

  const groupNotesByDate = () => {
    const grouped = {};
    filteredNotes.forEach(note => {
      const dateKey = note.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(note);
    });
    return grouped;
  };

  const groupedNotes = groupNotesByDate();
  const dates = Object.keys(groupedNotes).sort((a, b) => new Date(b) - new Date(a));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Tất cả ghi chú</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Icon name="magnify" size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Tìm kiếm ghi chú..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: theme.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>
            {allNotes.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>
            Tổng ghi chú
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>
            {habits.filter(h => h.notes && h.notes.length > 0).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>
            Thói quen
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>
            {filteredNotes.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>
            Kết quả
          </Text>
        </View>
      </View>

      {/* Notes List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="note-text-outline" size={64} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {searchQuery ? 'Không tìm thấy ghi chú' : 'Chưa có ghi chú nào'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              {searchQuery
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Bắt đầu viết ghi chú cho các thói quen của bạn'
              }
            </Text>
          </View>
        ) : (
          dates.map((date) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={[styles.dateHeader, { color: theme.textMuted }]}>
                {formatDate(date)}
              </Text>
              {groupedNotes[date].map((note, index) => (
                <TouchableOpacity
                  key={`${note.habitId}-${note.date}-${index}`}
                  style={[styles.noteCard, {
                    backgroundColor: theme.card,
                    borderLeftColor: note.habitColor,
                  }]}
                  onPress={() => handleNotePress(note)}
                >
                  {/* Habit Info */}
                  <View style={styles.noteHeader}>
                    <View style={[styles.habitIconSmall, { backgroundColor: note.habitColor }]}>
                      <Icon name={note.habitIcon} size={16} color="#fff" />
                    </View>
                    <Text style={[styles.habitNameSmall, { color: theme.text }]}>
                      {note.habitName}
                    </Text>
                  </View>

                  {/* Note Content */}
                  <Text
                    style={[styles.noteContent, { color: theme.text }]}
                    numberOfLines={3}
                  >
                    {note.content}
                  </Text>

                  {/* Note Time */}
                  {note.timestamp && (
                    <Text style={[styles.noteTime, { color: theme.textMuted }]}>
                      {new Date(note.timestamp).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  noteCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  habitIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitNameSmall: {
    fontSize: 13,
    fontWeight: '600',
  },
  noteContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  noteTime: {
    fontSize: 12,
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AllNotePage;