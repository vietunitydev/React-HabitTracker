import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from '../../../shared/components/ui/Card';
import { useTheme } from '../../../core/contexts/ThemeContext';

const StatCard = ({ icon, title, value, color }) => {
  const { theme } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Icon name={icon} size={28} color="#fff" />
      </View>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 20,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    textAlign: 'center',
  },
});

export default StatCard;