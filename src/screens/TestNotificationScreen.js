// src/screens/TestNotificationScreen.js
import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitContext } from '../contexts/HabitContext';
import NotificationService from '../services/NotificationService';

const TestNotificationScreen = ({ navigation }) => {
  const { testNotification, testScheduledNotification } = useContext(HabitContext);

  const testMessageStyle = async () => {
    await NotificationService.showMessageStyleNotification(
      'Uống nước 💧',
      'Đã đến lúc uống nước rồi! Hãy uống ít nhất 250ml nước nhé 🥤',
      '#2196F3'
    );
  };

  const testSimpleNotification = async () => {
    await NotificationService.showSimpleNotification(
      '🏃‍♂️ Tập thể dục',
      'Đã đến lúc tập thể dục! Hãy dành 30 phút để chăm sóc sức khỏe của bạn.',
      { habitId: 'test-habit-1' }
    );
  };

  const testCompletionNotification = async () => {
    await NotificationService.showCompletionNotification(
      'Đọc sách',
      7, // 7 day streak
      '#FF6B6B'
    );
  };

  const showScheduledNotifications = async () => {
    const notifications = await NotificationService.getScheduledNotifications();
    Alert.alert(
      'Scheduled Notifications',
      `Có ${notifications.length} thông báo đã lên lịch\n\n` +
      notifications.slice(0, 3).map(n => `• ${n.notification.title}`).join('\n')
    );
  };

  const cancelAllNotifications = async () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn hủy tất cả thông báo?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          style: 'destructive',
          onPress: async () => {
            await NotificationService.cancelAllNotifications();
            Alert.alert('Thành công', 'Đã hủy tất cả thông báo!');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Test Different Styles</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={testMessageStyle}
          >
            <View style={styles.buttonContent}>
              <Icon name="message-text" size={24} color="#4CAF50" />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>Message Style Notification</Text>
                <Text style={styles.buttonSubText}>Giống tin nhắn với action buttons</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={testSimpleNotification}
          >
            <View style={styles.buttonContent}>
              <Icon name="bell" size={24} color="#2196F3" />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>Simple Notification</Text>
                <Text style={styles.buttonSubText}>Thông báo đơn giản với big text</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={testCompletionNotification}
          >
            <View style={styles.buttonContent}>
              <Icon name="trophy" size={24} color="#FF9800" />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>Completion Notification</Text>
                <Text style={styles.buttonSubText}>Thông báo chúc mừng hoàn thành</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={testScheduledNotification}
          >
            <View style={styles.buttonContent}>
              <Icon name="clock-outline" size={24} color="#9C27B0" />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>Scheduled Notification</Text>
                <Text style={styles.buttonSubText}>Thông báo sau 10 giây</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={testNotification}
          >
            <View style={styles.buttonContent}>
              <Icon name="target" size={24} color="#E91E63" />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>Context Test</Text>
                <Text style={styles.buttonSubText}>Test từ HabitContext</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠 Management</Text>

          <TouchableOpacity
            style={[styles.testButton, styles.infoButton]}
            onPress={showScheduledNotifications}
          >
            <View style={styles.buttonContent}>
              <Icon name="format-list-bulleted" size={24} color="#00BCD4" />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>Show Scheduled</Text>
                <Text style={styles.buttonSubText}>Xem thông báo đã lên lịch</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.dangerButton]}
            onPress={cancelAllNotifications}
          >
            <View style={styles.buttonContent}>
              <Icon name="delete-sweep" size={24} color="#f44336" />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>Cancel All</Text>
                <Text style={styles.buttonSubText}>Hủy tất cả thông báo</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Hướng dẫn</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              • <Text style={styles.infoBold}>Message Style:</Text> Giống tin nhắn với avatar và action buttons{'\n'}
              • <Text style={styles.infoBold}>Simple:</Text> Thông báo thông thường với big text{'\n'}
              • <Text style={styles.infoBold}>Completion:</Text> Chúc mừng khi hoàn thành habit{'\n'}
              • <Text style={styles.infoBold}>Scheduled:</Text> Lên lịch thông báo tự động{'\n'}
              • Nhấn vào thông báo để mở app{'\n'}
              • Sử dụng action buttons để tương tác nhanh
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Features</Text>
          <View style={styles.featureContainer}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Message style notifications</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Action buttons (Complete, Snooze)</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Auto-schedule daily reminders</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Completion congratulations</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Snooze functionality</Text>
            </View>
          </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  infoButton: {
    borderColor: '#00BCD4',
  },
  dangerButton: {
    borderColor: '#f44336',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  buttonSubText: {
    color: '#aaa',
    fontSize: 14,
  },
  infoContainer: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  infoBold: {
    color: '#fff',
    fontWeight: '600',
  },
  featureContainer: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default TestNotificationScreen;