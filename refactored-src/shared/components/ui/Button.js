import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../core/contexts/ThemeContext';

export const Button = ({
                         title,
                         onPress,
                         variant = 'primary',
                         size = 'medium',
                         disabled = false,
                         loading = false,
                         icon,
                         iconPosition = 'left',
                         style,
                         textStyle,
                         ...props
                       }) => {
  const { theme } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: theme.primary, borderColor: theme.primary, textColor: '#FFFFFF' };
      case 'secondary':
        return { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, textColor: theme.text };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: theme.primary, textColor: theme.primary };
      case 'text':
        return { backgroundColor: 'transparent', borderColor: 'transparent', textColor: theme.primary };
      case 'danger':
        return { backgroundColor: theme.error, borderColor: theme.error, textColor: '#FFFFFF' };
      default:
        return { backgroundColor: theme.primary, borderColor: theme.primary, textColor: '#FFFFFF' };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14, iconSize: 16 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18, iconSize: 24 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16, iconSize: 20 };
    }
  };

  const variantStyle = getVariantStyle();
  const sizeStyle = getSizeStyle();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
        },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.textColor} />
      ) : (
        <>
          {iconPosition === 'left' && icon && (
            <Icon name={icon} size={sizeStyle.iconSize} color={variantStyle.textColor} style={styles.iconLeft} />
          )}
          {title && (
            <Text style={[styles.text, { color: variantStyle.textColor, fontSize: sizeStyle.fontSize }, textStyle]}>
              {title}
            </Text>
          )}
          {iconPosition === 'right' && icon && (
            <Icon name={icon} size={sizeStyle.iconSize} color={variantStyle.textColor} style={styles.iconRight} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  text: { fontWeight: '600' },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  disabled: { opacity: 0.5 },
});