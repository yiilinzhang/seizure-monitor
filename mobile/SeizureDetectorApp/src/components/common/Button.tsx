import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {colors, fontSize} from '../../utils/colors';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  loading = false,
  style,
}) => {
  const buttonStyles: ViewStyle[] = [
    styles.button,
    variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles: TextStyle[] = [
    styles.text,
    variant === 'primary' ? styles.primaryText : styles.secondaryText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.surface : colors.brand.primary}
        />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: colors.brand.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.ink[60],
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  primaryText: {
    color: colors.surface,
  },
  secondaryText: {
    color: colors.brand.primary,
  },
});
