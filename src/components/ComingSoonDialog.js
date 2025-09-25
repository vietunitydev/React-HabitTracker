import React from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const ComingSoonDialog = ({ visible, onClose }) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Icon
            name="construct-outline"
            size={40}
            color="#007AFF"
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.title}>Notification</Text>
          <Text style={styles.message}>
            This feature is not yet available. Please check back later!
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
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
    backgroundColor: "#e0e0e0", // đổi sang xám nhạt
    padding: 20,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#222",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  closeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default ComingSoonDialog;
