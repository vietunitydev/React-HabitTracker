import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChooseIconImage = ({navigation, route}) => {
  const currentIcon = route.params?.currentIcon || 'pen';
  const [selectedIcon, setSelectedIcon] = useState(currentIcon);
  const [selectedCategory, setSelectedCategory] = useState('General');

  const iconCategories = {
    General: [
      'pen', 'book-open', 'lightbulb', 'star', 'heart', 'check-circle',
      'calendar', 'clock', 'bell', 'flag', 'target', 'trophy'
    ],
    Health: [
      'medical-bag', 'pill', 'water', 'apple', 'carrot', 'leaf',
      'hospital', 'stethoscope', 'thermometer', 'bandage', 'heart-pulse', 'meditation'
    ],
    Fitness: [
      'run-fast', 'dumbbell', 'bike', 'walk', 'yoga', 'swimming',
      'basketball', 'football', 'tennis', 'weightlifter', 'arm-flex', 'shoe-sneaker'
    ],
    Productivity: [
      'laptop', 'desktop-classic', 'file-document', 'folder', 'briefcase', 'chart-line',
      'clipboard-check', 'timer', 'pencil', 'notebook', 'calculator', 'email'
    ],
    Learning: [
      'school', 'book', 'bookmark', 'brain', 'language-python', 'microscope',
      'formula', 'library', 'graduation-cap', 'certificate', 'quiz', 'translate'
    ],
    Mindfulness: [
      'meditation', 'spa', 'candle', 'flower', 'weather-sunny', 'moon-waning-crescent',
      'nature', 'tree', 'butterfly', 'feather', 'zen', 'yin-yang'
    ],
    Social: [
      'account-group', 'phone', 'message', 'email-outline', 'handshake', 'heart-multiple',
      'party-popper', 'gift', 'camera', 'microphone', 'music', 'gamepad-variant'
    ],
    Creativity: [
      'palette', 'brush', 'camera-outline', 'music-note', 'guitar-acoustic', 'piano',
      'draw', 'scissors-cutting', 'image', 'video', 'theater', 'creation'
    ],
    Finance: [
      'currency-usd', 'piggy-bank', 'credit-card', 'bank', 'chart-pie', 'calculator-variant',
      'cash', 'coin', 'trending-up', 'wallet', 'receipt', 'percent'
    ],
    Career: [
      'tie', 'office-building', 'handshake-outline', 'presentation', 'network', 'rocket',
      'medal', 'crown', 'key', 'stairs-up', 'account-tie', 'business-plan'
    ]
  };

  const vietnamese = {
    General: "Chung",
    Health: "Sức khỏe",
    Fitness: "Thể chất",
    Productivity: "Năng suất",
    Learning: "Học tập",
    Mindfulness: "Chánh niệm",
    Social: "Xã hội",
    Creativity: "Sáng tạo",
    Finance: "Tài chính",
    Career: "Công việc"
  };

  const categories = Object.keys(iconCategories);

  const handleIconSelect = (icon) => {
    setSelectedIcon(icon);
    navigation.navigate('CreateHabit', { selectedIcon: icon });
  };

  const renderIcon = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.iconItem,
        selectedIcon === item && styles.selectedIconItem,
      ]}
      onPress={() => handleIconSelect(item)}>
      <Icon name={item} size={24} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Chọn biểu tượng</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.categoryTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                selectedCategory === category && styles.selectedCategoryTab,
              ]}
              onPress={() => setSelectedCategory(category)}>
              <Text style={[
                styles.categoryTabText,
                selectedCategory === category && styles.selectedCategoryTabText,
              ]}>
                {vietnamese[category]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        <FlatList
          data={iconCategories[selectedCategory]}
          renderItem={renderIcon}
          numColumns={4}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.iconGrid}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
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
  categoryTabs: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  selectedCategoryTab: {
    backgroundColor: '#007AFF',
  },
  categoryTabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  iconGrid: {
    paddingVertical: 20,
  },
  iconItem: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
  },
  selectedIconItem: {
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default ChooseIconImage;