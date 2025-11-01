import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitContext } from '../contexts/HabitContext';

const FilterScreen = ({ navigation, route }) => {
  const { theme } = useContext(HabitContext);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const PERIODS = [
    { id: 'today', label: 'Hôm nay', icon: 'calendar-today' },
    { id: 'week', label: 'Tuần này', icon: 'calendar-week' },
    { id: 'month', label: 'Tháng này', icon: 'calendar-month' },
    { id: 'custom', label: 'Tùy chỉnh', icon: 'calendar-range' },
  ];

  const CATEGORIES = [
    { id: 'health', label: 'Sức khỏe', icon: 'heart-pulse', color: '#FF6B6B' },
    { id: 'fitness', label: 'Thể dục', icon: 'dumbbell', color: '#4ECDC4' },
    { id: 'learning', label: 'Học tập', icon: 'book-open', color: '#45B7D1' },
    { id: 'mindfulness', label: 'Chánh niệm', icon: 'meditation', color: '#FFA726' },
    { id: 'productivity', label: 'Năng suất', icon: 'briefcase', color: '#9C27B0' },
  ];

  const handleApply = () => {
    // Apply filters
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Lọc thói quen</Text>
        <TouchableOpacity onPress={handleApply}>
          <Text style={[styles.applyButton, { color: theme.primary }]}>Áp dụng</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Khoảng thời gian
          </Text>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                {
                  backgroundColor: selectedPeriod === period.id
                    ? theme.primary + '20'
                    : theme.backgroundSecondary,
                  borderColor: selectedPeriod === period.id
                    ? theme.primary
                    : theme.border,
                }
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Icon
                name={period.icon}
                size={24}
                color={selectedPeriod === period.id ? theme.primary : theme.textMuted}
              />
              <Text style={[
                styles.periodLabel,
                { color: selectedPeriod === period.id ? theme.primary : theme.text }
              ]}>
                {period.label}
              </Text>
              {selectedPeriod === period.id && (
                <Icon name="check-circle" size={20} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Danh mục
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: selectedCategory === category.id
                      ? category.color + '20'
                      : theme.backgroundSecondary,
                    borderColor: selectedCategory === category.id
                      ? category.color
                      : theme.border,
                  }
                ]}
                onPress={() => setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )}
              >
                <Icon
                  name={category.icon}
                  size={24}
                  color={selectedCategory === category.id ? category.color : theme.textMuted}
                />
                <Text style={[
                  styles.categoryLabel,
                  { color: theme.text }
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  applyButton: { fontSize: 16, fontWeight: '600' },
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
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
    gap: 12,
  },
  periodLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  categoryLabel: { fontSize: 13, fontWeight: '500' },
});

export default FilterScreen;