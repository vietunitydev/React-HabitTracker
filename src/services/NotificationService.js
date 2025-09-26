// src/services/NotificationService.js
import notifee, {
  TriggerType,
  AndroidImportance,
  AndroidStyle,
  EventType
} from '@notifee/react-native';
import { Platform } from 'react-native';

class NotificationService {
  constructor() {
    this.channelId = 'habit-tracker-channel';
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      // Tạo notification channel cho Android
      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: this.channelId,
          name: 'HabitHub Reminders',
          description: 'Thông báo nhắc nhở thói quen',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
          lights: true,
          lightColor: '#4CAF50',
          badge: true,
        });
      }

      // Request permission
      await this.requestPermission();
      this.initialized = true;
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('Error initializing NotificationService:', error);
    }
  }

  async requestPermission() {
    try {
      const settings = await notifee.requestPermission();

      if (settings.authorizationStatus >= 1) {
        console.log('Notification permission granted');
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  // Tạo notification giống tin nhắn với style messaging
  async showMessageStyleNotification(habitName, message, habitColor = '#4CAF50', habitIcon = 'target') {
    try {
      await notifee.displayNotification({
        title: `🎯 ${habitName}`,
        body: message,
        data: {
          type: 'habit-reminder',
          habitName,
        },
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          style: {
            type: AndroidStyle.MESSAGING,
            person: {
              name: 'HabitHub',
              icon: 'https://via.placeholder.com/50/4CAF50/FFFFFF?text=H',
            },
            messages: [
              {
                text: message,
                timestamp: Date.now(),
                person: {
                  name: 'HabitHub',
                  icon: 'https://via.placeholder.com/50/4CAF50/FFFFFF?text=H',
                },
              },
            ],
          },
          color: habitColor,
          // Action buttons giống tin nhắn
          actions: [
            {
              title: '✅ Hoàn thành',
              pressAction: {
                id: 'complete',
                launchActivity: 'default',
              },
            },
            {
              title: '⏰ Nhắc lại 15 phút',
              pressAction: {
                id: 'snooze',
                launchActivity: 'default',
              },
            },
            {
              title: '👀 Xem chi tiết',
              pressAction: {
                id: 'view',
                launchActivity: 'default',
              },
            },
          ],
        },
        ios: {
          categoryId: 'habit-reminder',
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('Error showing message style notification:', error);
    }
  }

  // Tạo notification đơn giản
  async showSimpleNotification(title, body, data = {}) {
    try {
      await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          style: {
            type: AndroidStyle.BIGTEXT,
            text: body,
          },
          color: '#4CAF50',
          smallIcon: 'ic_stat_notification',
        },
        ios: {
          categoryId: 'habit-reminder',
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('Error showing simple notification:', error);
    }
  }

  // Schedule notification hàng ngày cho habit
  async scheduleHabitReminder(habit) {
    if (!habit.notification?.enabled || !habit.notification?.time) {
      console.log('Notification not enabled for habit:', habit.name);
      return;
    }

    try {
      // Hủy notification cũ
      await this.cancelHabitNotifications(habit.id);

      const [hours, minutes] = habit.notification.time.split(':').map(Number);

      // Tạo notification cho mỗi ngày
      const today = new Date();
      for (let i = 0; i < 30; i++) { // Schedule cho 30 ngày tới
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        targetDate.setHours(hours, minutes, 0, 0);

        // Chỉ schedule nếu thời gian chưa qua
        if (targetDate > new Date()) {
          await notifee.createTriggerNotification(
            {
              id: `${habit.id}_day_${i}`,
              title: `🎯 ${habit.name}`,
              body: habit.description || `Đã đến lúc thực hiện "${habit.name}"!`,
              data: {
                habitId: habit.id,
                habitName: habit.name,
                type: 'habit-reminder',
                day: i,
              },
              android: {
                channelId: this.channelId,
                importance: AndroidImportance.HIGH,
                pressAction: {
                  id: 'default',
                },
                style: {
                  type: AndroidStyle.MESSAGING,
                  person: {
                    name: 'HabitHub',
                    icon: 'https://via.placeholder.com/50/4CAF50/FFFFFF?text=H',
                  },
                  messages: [
                    {
                      text: habit.description || `Đã đến lúc thực hiện "${habit.name}"!`,
                      timestamp: Date.now(),
                      person: {
                        name: 'HabitHub',
                        icon: 'https://via.placeholder.com/50/4CAF50/FFFFFF?text=H',
                      },
                    },
                  ],
                },
                color: habit.color || '#4CAF50',
                actions: [
                  {
                    title: '✅ Hoàn thành',
                    pressAction: {
                      id: 'complete',
                    },
                  },
                  {
                    title: '⏰ Nhắc lại',
                    pressAction: {
                      id: 'snooze',
                    },
                  },
                ],
              },
              ios: {
                categoryId: 'habit-reminder',
                sound: 'default',
              },
            },
            {
              type: TriggerType.TIMESTAMP,
              timestamp: targetDate.getTime(),
            }
          );
        }
      }

      console.log(`Scheduled notifications for habit: ${habit.name}`);
    } catch (error) {
      console.error('Error scheduling habit reminder:', error);
    }
  }

  // Hủy tất cả notifications của một habit
  async cancelHabitNotifications(habitId) {
    try {
      // Hủy notifications cho 30 ngày
      for (let i = 0; i < 30; i++) {
        await notifee.cancelNotification(`${habitId}_day_${i}`);
      }
      // Hủy snooze notifications
      await notifee.cancelNotification(`${habitId}_snooze`);
    } catch (error) {
      console.error('Error canceling habit notifications:', error);
    }
  }

  // Snooze notification (nhắc lại sau x phút)
  async snoozeNotification(habitId, habitName, message, minutes = 15) {
    try {
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);

      await notifee.createTriggerNotification(
        {
          id: `${habitId}_snooze`,
          title: `🔔 Nhắc lại: ${habitName}`,
          body: message || `Đã đến lúc thực hiện "${habitName}"!`,
          data: {
            habitId,
            habitName,
            type: 'habit-reminder-snooze',
          },
          android: {
            channelId: this.channelId,
            importance: AndroidImportance.HIGH,
            color: '#FF9800',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: snoozeTime.getTime(),
        }
      );

      console.log(`Snoozed notification for ${habitName} for ${minutes} minutes`);
    } catch (error) {
      console.error('Error snoozing notification:', error);
    }
  }

  // Hiển thị notification chúc mừng khi hoàn thành habit
  async showCompletionNotification(habitName, streak = 1, habitColor = '#4CAF50') {
    try {
      let message = '';
      let emoji = '🎉';

      if (streak === 1) {
        message = `Tuyệt vời! Bạn đã hoàn thành "${habitName}" hôm nay!`;
      } else if (streak < 7) {
        message = `Xuất sắc! Streak ${streak} ngày với "${habitName}"! 🔥`;
        emoji = '🔥';
      } else if (streak < 30) {
        message = `Tuyệt vời! ${streak} ngày liên tiếp với "${habitName}"! 💪`;
        emoji = '💪';
      } else {
        message = `Phi thường! ${streak} ngày streak với "${habitName}"! Bạn là siêu sao! 🌟`;
        emoji = '🌟';
      }

      await notifee.displayNotification({
        title: `${emoji} Chúc mừng!`,
        body: message,
        data: {
          type: 'completion',
          habitName,
          streak,
        },
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.DEFAULT,
          color: habitColor,
          style: {
            type: AndroidStyle.BIGTEXT,
            text: message,
          },
        },
        ios: {
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('Error showing completion notification:', error);
    }
  }

  // Setup các handler cho notification events
  setupNotificationHandlers() {
    // Xử lý khi app đang mở (foreground)
    notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          console.log('User dismissed notification', detail.notification);
          break;
        case EventType.PRESS:
          console.log('User pressed notification', detail.notification);
          this.handleNotificationPress(detail.notification);
          break;
        case EventType.ACTION_PRESS:
          console.log('User pressed an action', detail.pressAction.id);
          this.handleActionPress(detail.pressAction.id, detail.notification);
          break;
      }
    });

    // Xử lý khi app ở background
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      const { notification, pressAction } = detail;

      if (type === EventType.ACTION_PRESS) {
        await this.handleActionPress(pressAction.id, notification);
      }
    });
  }

  handleNotificationPress(notification) {
    // Có thể implement navigation tới habit detail
    const { habitId, habitName } = notification.data || {};
    console.log('Notification pressed for habit:', habitName);

    // TODO: Implement navigation
    // NavigationService.navigate('HabitDetail', { habitId });
  }

  async handleActionPress(actionId, notification) {
    const { habitId, habitName } = notification.data || {};

    switch (actionId) {
      case 'complete':
        console.log('Marking habit as complete:', habitName);
        // TODO: Implement habit completion logic
        // Có thể emit event hoặc call callback function
        this.onHabitCompleted?.(habitId);
        break;

      case 'snooze':
        console.log('Snoozing habit:', habitName);
        await this.snoozeNotification(habitId, habitName, notification.body);
        break;

      case 'view':
        console.log('Viewing habit details:', habitName);
        // TODO: Navigate to habit detail
        break;
    }

    // Remove the current notification
    await notifee.cancelNotification(notification.id);
  }

  // Set callback function để xử lý khi user complete habit từ notification
  setHabitCompletedCallback(callback) {
    this.onHabitCompleted = callback;
  }

  // Test notifications
  async testMessageNotification() {
    await this.showMessageStyleNotification(
      'Uống nước',
      'Đã đến lúc uống nước rồi! Hãy uống ít nhất 250ml nước nhé 💧',
      '#2196F3',
      'water'
    );
  }

  async testScheduledNotification() {
    const testTime = new Date();
    testTime.setSeconds(testTime.getSeconds() + 10);

    await notifee.createTriggerNotification(
      {
        id: 'test_notification',
        title: '🧪 Test Notification',
        body: 'Đây là test notification sau 10 giây!',
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: testTime.getTime(),
      }
    );

    console.log('Test notification scheduled for 10 seconds');
  }

  // Utility methods
  async getScheduledNotifications() {
    try {
      const notifications = await notifee.getTriggerNotifications();
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async cancelAllNotifications() {
    try {
      await notifee.cancelAllNotifications();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }
}

export default new NotificationService();