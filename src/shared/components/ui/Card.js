import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../core/contexts/ThemeContext';

export const Card = ({
                       children,
                       onPress,
                       style,
                       elevated = true,
                       variant = 'default',
                       ...props
                     }) => {
  const { theme } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'outlined':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border };
      case 'filled':
        return { backgroundColor: theme.backgroundSecondary, borderWidth: 0 };
      default:
        return { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border };
    }
  };

  const variantStyle = getVariantStyle();
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.card,
        variantStyle,
        elevated && styles.elevated,
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      {...props}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});