import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  onPress?: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onPress,
  fullWidth = false,
  disabled = false,
  style,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? '#87AEEE80' : '#87AEEE',
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: 'rgba(138, 138, 138, 0.1)',
        };
      case 'destructive':
        return {
          ...baseStyle,
          backgroundColor: disabled ? '#FF838380' : '#FF8383',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 14,
      fontWeight: '600',
    };

    switch (variant) {
      case 'primary':
      case 'destructive':
        return {
          ...baseStyle,
          color: '#FFFFFF',
        };
      case 'secondary':
        return {
          ...baseStyle,
          color: '#3D3D3D',
        };
      default:
        return baseStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={getTextStyle()}>{children}</Text>
    </TouchableOpacity>
  );
};