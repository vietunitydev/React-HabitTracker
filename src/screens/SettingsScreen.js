import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettingsScreen = ({navigation}) => {
    const SettingItem = ({icon, title, subtitle, onPress, iconColor = '#007AFF'}) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress}>
            <View style={[styles.settingIcon, {backgroundColor: iconColor}]}>
                <Icon name={icon} size={20} color="#fff" />
            </View>
            <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            <Icon name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}>
                    <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Cài đặt</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content}>
                {/*<View style={styles.section}>*/}
                {/*    <View style={styles.proSection}>*/}
                {/*        <View style={styles.proIcon}>*/}
                {/*            <Icon name="crown" size={24} color="#FFD700" />*/}
                {/*        </View>*/}
                {/*        <View style={styles.proText}>*/}
                {/*            <Text style={styles.proTitle}>Đăng ký HabitHub Pro</Text>*/}
                {/*            <Text style={styles.proSubtitle}>*/}
                {/*                Không giới hạn thói quen, thông báo, ...*/}
                {/*            </Text>*/}
                {/*        </View>*/}
                {/*        <Icon name="chevron-right" size={24} color="#666" />*/}
                {/*    </View>*/}
                {/*</View>*/}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>App</Text>
                </View>

                <SettingItem
                    icon="cog"
                    title="Cài đặt chung"
                    iconColor="#FF6B6B"
                />

                <SettingItem
                    icon="bell"
                    title="Nhắc nhở hàng ngày"
                    iconColor="#4ECDC4"
                />

                <SettingItem
                    icon="palette"
                    title="Chủ đề"
                    iconColor="#FFA726"
                />

                <SettingItem
                    icon="archive"
                    title="Lưu trữ"
                    iconColor="#66BB6A"
                />

                <SettingItem
                    icon="reorder-horizontal"
                    title="Sắp xếp thói quen"
                    iconColor="#EF5350"
                />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Help</Text>
                </View>

                <SettingItem
                    icon="help-circle"
                    title="Hướng dẫn"
                    iconColor="#FF7043"
                />

                <SettingItem
                    icon="message"
                    title="Gửi phản hồi"
                    iconColor="#78909C"
                />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>About</Text>
                </View>

                <SettingItem
                    icon="web"
                    title="Website"
                    iconColor="#26A69A"
                />

                <SettingItem
                    icon="shield-check"
                    title="Chính sách bảo mật"
                    iconColor="#E91E63"
                />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
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
    content: {
        flex: 1,
    },
    section: {
        marginBottom: 20,
    },
    proSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
    },
    proIcon: {
        width: 40,
        height: 40,
        backgroundColor: '#333',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    proText: {
        flex: 1,
    },
    proTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    proSubtitle: {
        color: '#999',
        fontSize: 14,
        marginTop: 2,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    sectionTitle: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        marginHorizontal: 20,
        marginBottom: 2,
        padding: 16,
        borderRadius: 8,
    },
    settingIcon: {
        width: 32,
        height: 32,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingText: {
        flex: 1,
    },
    settingTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    settingSubtitle: {
        color: '#999',
        fontSize: 14,
        marginTop: 2,
    },
});

export default SettingsScreen;