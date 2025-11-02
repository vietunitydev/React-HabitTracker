import React from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../core/contexts/ThemeContext";

/**
 * Coming Soon Dialog Component
 * Shows when features are under development
 */
const ComingSoonDialog = ({ visible, onClose }) => {
  const { theme } = useTheme();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: theme.card }]}>
          <Icon
            name="construct-outline"
            size={40}
            color={theme.primary}
            style={{ marginBottom: 10 }}
          />
          <Text style={[styles.title, { color: theme.text }]}>
            Thông báo
          </Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            Tính năng này đang được phát triển. Vui lòng quay lại sau!
          </Text>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <Text style={styles.closeText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    padding: 24,
    borderRadius: 16,
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    minWidth: 120,
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default ComingSoonDialog;