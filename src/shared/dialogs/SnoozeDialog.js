import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../core/contexts/ThemeContext';
import { SNOOZE_REASONS } from '../../config/constants';

/**
 * Snooze Dialog Component
 * Allows user to skip a day with a valid reason
 */
const SnoozeDialog = ({ visible, onClose, onSnooze, remainingSnoozes = 3 }) => {
  const { theme } = useTheme();
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState('');

  const handleSnooze = () => {
    if (selectedReason) {
      const reason = selectedReason === 'other'
        ? customReason
        : SNOOZE_REASONS.find(r => r.id === selectedReason)?.label;
      onSnooze(reason);
      setSelectedReason(null);
      setCustomReason('');
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: theme.card }]}>
          <View style={styles.header}>
            <Icon name="calendar-clock" size={32} color={theme.primary} />
            <Text style={[styles.title, { color: theme.text }]}>
              Bù ngày bị bỏ lỡ
            </Text>
          </View>

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Bạn có thể bù {remainingSnoozes} lần trong tháng này
          </Text>

          <View style={styles.reasonGrid}>
            {SNOOZE_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonButton,
                  {
                    backgroundColor: selectedReason === reason.id
                      ? theme.primary + '20'
                      : theme.backgroundSecondary,
                    borderColor: selectedReason === reason.id
                      ? theme.primary
                      : theme.border,
                  }
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <Icon
                  name={reason.icon}
                  size={24}
                  color={selectedReason === reason.id ? theme.primary : theme.textMuted}
                />
                <Text style={[
                  styles.reasonLabel,
                  { color: theme.text }
                ]}>
                  {reason.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === 'other' && (
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              }]}
              placeholder="Nhập lý do của bạn..."
              placeholderTextColor={theme.textMuted}
              value={customReason}
              onChangeText={setCustomReason}
              autoFocus
            />
          )}

          <View style={styles.warning}>
            <Icon name="alert-circle-outline" size={16} color={theme.warning} />
            <Text style={[styles.warningText, { color: theme.textTertiary }]}>
              Chỉ nên sử dụng khi có lý do hợp lý
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: theme.border }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.snoozeButton,
                { backgroundColor: theme.primary },
                !selectedReason && styles.disabledButton,
              ]}
              onPress={handleSnooze}
              disabled={!selectedReason}
            >
              <Text style={styles.snoozeButtonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  reasonButton: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  snoozeButton: {},
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  snoozeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SnoozeDialog;