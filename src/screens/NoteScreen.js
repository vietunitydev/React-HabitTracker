import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitContext } from '../contexts/HabitContext';

const NoteScreen = ({ navigation, route }) => {
  const { habitId, date, habitName } = route.params;
  const { saveNote, getNote, deleteNote, theme } = useContext(HabitContext);

  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing note when screen opens
  useEffect(() => {
    const existingNote = getNote(habitId, date);
    if (existingNote) {
      setNoteContent(existingNote.content);
    }
  }, [habitId, date]);

  // Track changes
  useEffect(() => {
    const existingNote = getNote(habitId, date);
    const originalContent = existingNote?.content || '';
    setHasChanges(noteContent !== originalContent);
  }, [noteContent]);

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

  const handleSave = async () => {
    if (!noteContent.trim()) {
      Alert.alert(
        'Ghi chú trống',
        'Bạn có muốn xóa ghi chú này không?',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: handleDelete,
          },
        ]
      );
      return;
    }

    setIsSaving(true);
    try {
      await saveNote(habitId, date, noteContent.trim());
      setHasChanges(false);
      // Show success feedback
      Alert.alert('Thành công', 'Ghi chú đã được lưu', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Lỗi', 'Không thể lưu ghi chú. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNote(habitId, date);
      Alert.alert('Đã xóa', 'Ghi chú đã được xóa', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error deleting note:', error);
      Alert.alert('Lỗi', 'Không thể xóa ghi chú. Vui lòng thử lại.');
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Thay đổi chưa lưu',
        'Bạn có muốn lưu thay đổi không?',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Không lưu',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Lưu',
            onPress: handleSave,
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Xóa ghi chú',
      'Bạn có chắc chắn muốn xóa ghi chú này không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: handleDelete,
        },
      ]
    );
  };

  const wordCount = noteContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = noteContent.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {habitName}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
              {formatDate(date)}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {getNote(habitId, date) && (
              <TouchableOpacity onPress={confirmDelete} style={styles.headerButton}>
                <Icon name="delete-outline" size={24} color={theme.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Text Input */}
        <TextInput
          style={[styles.textInput, {
            backgroundColor: theme.background,
            color: theme.text,
          }]}
          placeholder="Viết ghi chú của bạn ở đây..."
          placeholderTextColor={theme.textMuted}
          value={noteContent}
          onChangeText={setNoteContent}
          multiline
          autoFocus
          textAlignVertical="top"
        />

        {/* Stats & Save Button */}
        <View style={[styles.footer, {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        }]}>
          <View style={styles.statsContainer}>
            <Text style={[styles.statsText, { color: theme.textMuted }]}>
              {wordCount} từ · {charCount} ký tự
            </Text>
            {hasChanges && (
              <View style={styles.unsavedIndicator}>
                <Icon name="circle" size={8} color={theme.warning} />
                <Text style={[styles.unsavedText, { color: theme.warning }]}>
                  Chưa lưu
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, {
              backgroundColor: hasChanges ? theme.primary : theme.border,
            }]}
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Icon
              name={isSaving ? "loading" : "content-save"}
              size={20}
              color="#fff"
            />
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Đang lưu...' : 'Lưu'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    padding: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsText: {
    fontSize: 12,
  },
  unsavedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unsavedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default NoteScreen;