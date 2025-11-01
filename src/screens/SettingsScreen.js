import React, { useContext, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitContext } from '../contexts/HabitContext';
import ComingSoonDialog from '../components/ComingSoonDialog';

const SettingsScreen = ({ navigation }) => {
    const { theme, themeMode, toggleTheme, isDarkMode } = useContext(HabitContext);
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Section Header Component
    const SectionHeader = ({ title }) => (
      <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
              {title}
          </Text>
      </View>
    );

    // Setting Item with Arrow
    const SettingItem = ({ icon, title, subtitle, onPress, iconColor, iconBg }) => (
      <TouchableOpacity
        style={[styles.settingItem, { backgroundColor: theme.card }]}
        onPress={onPress}
      >
          <View style={[styles.iconContainer, { backgroundColor: iconBg || iconColor }]}>
              <Icon name={icon} size={22} color="#fff" />
          </View>
          <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                  {title}
              </Text>
              {subtitle && (
                <Text style={[styles.settingSubtitle, { color: theme.textTertiary }]}>
                    {subtitle}
                </Text>
              )}
          </View>
          <Icon name="chevron-right" size={24} color={theme.textMuted} />
      </TouchableOpacity>
    );

    // Setting Item with Switch
    const SettingSwitch = ({ icon, title, subtitle, value, onValueChange, iconColor, iconBg }) => (
      <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: iconBg || iconColor }]}>
              <Icon name={icon} size={22} color="#fff" />
          </View>
          <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                  {title}
              </Text>
              {subtitle && (
                <Text style={[styles.settingSubtitle, { color: theme.textTertiary }]}>
                    {subtitle}
                </Text>
              )}
          </View>
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={value ? '#fff' : '#f4f3f4'}
          />
      </View>
    );

    // Theme Mode Item
    const ThemeModeItem = ({ mode, icon, label }) => {
        const isSelected = themeMode === mode;
        return (
          <TouchableOpacity
            style={[
                styles.themeModeItem,
                {
                    backgroundColor: theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                    borderWidth: isSelected ? 2 : 1,
                }
            ]}
            onPress={() => toggleTheme(mode)}
          >
              <Icon
                name={icon}
                size={28}
                color={isSelected ? theme.primary : theme.textSecondary}
              />
              <Text style={[
                  styles.themeModeLabel,
                  { color: isSelected ? theme.text : theme.textSecondary }
              ]}>
                  {label}
              </Text>
              {isSelected && (
                <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                    <Icon name="check" size={12} color="#fff" />
                </View>
              )}
          </TouchableOpacity>
        );
    };

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
              {/* Account Section */}
              <SectionHeader title="ACCOUNT" />

              <View style={styles.profileCard}>
                  <TouchableOpacity
                    style={[styles.profileItem, { backgroundColor: theme.card }]}
                    onPress={() => setShowComingSoon(true)}
                  >
                      <View style={styles.avatarContainer}>
                          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                              <Text style={styles.avatarText}>V</Text>
                          </View>
                          <View style={[styles.onlineBadge, { backgroundColor: theme.success }]} />
                      </View>
                      <View style={styles.profileInfo}>
                          <Text style={[styles.profileName, { color: theme.text }]}>
                              Viet
                          </Text>
                          <Text style={[styles.profileEmail, { color: theme.textTertiary }]}>
                              viet@example.com
                          </Text>
                      </View>
                      <Icon name="chevron-right" size={24} color={theme.textMuted} />
                  </TouchableOpacity>
              </View>

              <SettingItem
                icon="shield-account"
                title="Privacy & Security"
                subtitle="Manage your data and privacy"
                iconBg="#E91E63"
                onPress={() => setShowComingSoon(true)}
              />

              <SettingItem
                icon="lock-reset"
                title="Change Password"
                iconBg="#9C27B0"
                onPress={() => setShowComingSoon(true)}
              />

              {/* Notifications Section */}
              <SectionHeader title="NOTIFICATIONS" />

              <SettingSwitch
                icon="bell"
                title="Push Notifications"
                subtitle="Get reminders for your habits"
                iconBg="#4CAF50"
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />

              <SettingItem
                icon="bell-ring"
                title="Notification Settings"
                subtitle="Customize your notification preferences"
                iconBg="#00BCD4"
                onPress={() => setShowComingSoon(true)}
              />

              <SettingItem
                icon="clock-outline"
                title="Reminder Time"
                subtitle="Set default reminder time"
                iconBg="#FF9800"
                onPress={() => setShowComingSoon(true)}
              />

              {/* Appearance Section */}
              <SectionHeader title="DARK MODE" />

              <View style={styles.themeModeContainer}>
                  <ThemeModeItem
                    mode="light"
                    icon="white-balance-sunny"
                    label="Light"
                  />
                  <ThemeModeItem
                    mode="dark"
                    icon="moon-waning-crescent"
                    label="Dark"
                  />
                  <ThemeModeItem
                    mode="system"
                    icon="cellphone"
                    label="System"
                  />
              </View>

              <SettingItem
                icon="palette"
                title="Accent Color"
                subtitle="Customize app color theme"
                iconBg="#673AB7"
                onPress={() => setShowComingSoon(true)}
              />

              {/* Help & Support Section */}
              <SectionHeader title="HELP & SUPPORT" />

              <SettingItem
                icon="help-circle"
                title="Help Center"
                subtitle="Get help and support"
                iconBg="#2196F3"
                onPress={() => setShowComingSoon(true)}
              />

              <SettingItem
                icon="book-open-variant"
                title="Tutorial"
                subtitle="Learn how to use the app"
                iconBg="#3F51B5"
                onPress={() => setShowComingSoon(true)}
              />

              <SettingItem
                icon="message-text"
                title="Send Feedback"
                subtitle="Help us improve the app"
                iconBg="#FF5722"
                onPress={() => setShowComingSoon(true)}
              />

              <SettingItem
                icon="star"
                title="Rate App"
                subtitle="Share your experience"
                iconBg="#FFC107"
                onPress={() => setShowComingSoon(true)}
              />

              {/* About Section */}
              <SectionHeader title="ABOUT" />

              <SettingItem
                icon="information"
                title="About HabitHub"
                subtitle="App version 1.0.0"
                iconBg="#607D8B"
                onPress={() => setShowComingSoon(true)}
              />

              <SettingItem
                icon="file-document"
                title="Terms of Service"
                iconBg="#795548"
                onPress={() => setShowComingSoon(true)}
              />

              <SettingItem
                icon="shield-check"
                title="Privacy Policy"
                iconBg="#009688"
                onPress={() => setShowComingSoon(true)}
              />

              {/* Danger Zone */}
              <SectionHeader title="ACCOUNT ACTIONS" />

              <SettingItem
                icon="logout"
                title="Sign Out"
                iconBg="#FF5252"
                onPress={() => setShowComingSoon(true)}
              />

              <SettingItem
                icon="delete-forever"
                title="Delete Account"
                subtitle="Permanently delete your account"
                iconBg="#D32F2F"
                onPress={() => setShowComingSoon(true)}
              />

              {/* Version Info */}
              <View style={styles.versionContainer}>
                  <Text style={[styles.versionText, { color: theme.textMuted }]}>
                      HabitHub
                  </Text>
                  <Text style={[styles.versionNumber, { color: theme.textTertiary }]}>
                      Version 1.0.0 (Build 1)
                  </Text>
                  <Text style={[styles.copyrightText, { color: theme.textTertiary }]}>
                      Made with ❤️ for better habits
                  </Text>
              </View>

              {/* Bottom Spacing */}
              <View style={{ height: 100 }} />
          </ScrollView>

          <ComingSoonDialog
            visible={showComingSoon}
            onClose={() => setShowComingSoon(false)}
            theme={theme}
          />
      </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 8,
        borderBottomWidth: 0,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    profileCard: {
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginHorizontal: 20,
        marginBottom: 2,
        borderRadius: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    themeModeContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 8,
        gap: 12,
    },
    themeModeItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 20,
        borderRadius: 12,
        position: 'relative',
    },
    themeModeLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 8,
    },
    selectedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    versionContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    versionText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    versionNumber: {
        fontSize: 12,
        marginBottom: 8,
    },
    copyrightText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
});

export default SettingsScreen;