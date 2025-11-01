import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitContext } from '../contexts/HabitContext';

const MOOD_EMOJIS = [
  { emoji: '😊', label: 'Vui', color: '#4CAF50' },
  { emoji: '😐', label: 'Bình thường', color: '#FFA726' },
  { emoji: '😔', label: 'Khó khăn', color: '#EF5350' },
  { emoji: '💪', label: 'Mạnh mẽ', color: '#2196F3' },
  { emoji: '😴', label: 'Mệt', color: '#9E9E9E' },
];

const NoteScreen = ({ navigation, route }) => {
  const { theme } = useContext(HabitContext);
  const { date, habitId, habitName } = route.params;

  const [note, setNote] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);

  const handleSave = () => {
    // Save note logic here
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Ghi chú</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {habitName} • {date}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveButton, { color: theme.primary }]}>Lưu</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Tâm trạng hôm nay
          </Text>
          <View style={styles.moodGrid}>
            {MOOD_EMOJIS.map((mood, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.moodButton,
                  {
                    backgroundColor: selectedMood === index
                      ? mood.color + '20'
                      : theme.backgroundSecondary,
                    borderColor: selectedMood === index
                      ? mood.color
                      : theme.border,
                  }
                ]}
                onPress={() => setSelectedMood(index)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodLabel, { color: theme.text }]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Ghi chú của bạn
          </Text>
          <TextInput
            style={[styles.noteInput, {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
            }]}
            placeholder="Hôm nay thế nào? Chia sẻ cảm nhận của bạn..."
            placeholderTextColor={theme.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.suggestionBox, { backgroundColor: theme.card }]}>
          <Icon name="lightbulb-on" size={20} color={theme.primary} />
          <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>
            Gợi ý: Ghi lại những gì bạn đã làm, cảm nhận, hoặc lý do khó thực hiện
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerCenter: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  saveButton: { fontSize: 16, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodButton: {
    width: '30%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  moodEmoji: { fontSize: 32, marginBottom: 8 },
  moodLabel: { fontSize: 13, fontWeight: '500' },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 200,
  },
  suggestionBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  suggestionText: { flex: 1, fontSize: 13, lineHeight: 20 },
});

export default NoteScreen;