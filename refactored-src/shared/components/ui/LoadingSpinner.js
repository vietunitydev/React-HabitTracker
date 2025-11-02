import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../core/contexts/ThemeContext';

/**
 * Loading Spinner Component
 * Shows loading state
 */
export const LoadingSpinner = ({
                                 size = 'large',
                                 text,
                                 fullScreen = false
                               }) => {
  const { theme } = useTheme();

  const Container = fullScreen ? View : React.Fragment;
  const containerStyle = fullScreen ? [styles.fullScreen, { backgroundColor: theme.background }] : null;

  return (
    <Container style={containerStyle}>
      <View style={styles.container}>
        <ActivityIndicator size={size} color={theme.primary} />
        {text && (
          <Text style={[styles.text, { color: theme.text }]}>
            {text}
          </Text>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
  },
});