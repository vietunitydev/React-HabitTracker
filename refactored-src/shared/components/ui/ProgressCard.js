import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProgressCircle } from './ProgressCircle';

/**
 * Progress Card Component
 * Shows daily completion progress with celebration
 */
export const ProgressCard = ({ completed, total, percentage }) => {
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressCardContent}>
        <ProgressCircle progress={percentage} size={100} />

        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>
            {completed} of {total} habits
          </Text>
          <Text style={styles.progressSubtitle}>
            completed today!
          </Text>
          <View style={styles.celebrationEmoji}>
            <Text style={styles.emoji}>👏 🎯 📊</Text>
          </View>
        </View>
      </View>

      <View style={styles.illustration}>
        <Icon name="notebook-check" size={80} color="rgba(255,255,255,0.3)" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#667eea',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 180,
  },
  progressCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  progressInfo: {
    marginLeft: 20,
    flex: 1,
  },
  progressTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginTop: 4,
  },
  celebrationEmoji: {
    marginTop: 8,
  },
  emoji: {
    fontSize: 24,
  },
  illustration: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.3,
  },
});