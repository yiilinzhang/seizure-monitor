import React from 'react';
import { View, ViewStyle } from 'react-native';

type CardVariant = 'default' | 'warning';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      padding: 16,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    };

    switch (variant) {
      case 'default':
        return {
          ...baseStyle,
          backgroundColor: '#FFFFFF',
        };
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 131, 131, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 131, 131, 0.2)',
        };
      default:
        return baseStyle;
    }
  };

  return <View style={[getCardStyle(), style]}>{children}</View>;
};