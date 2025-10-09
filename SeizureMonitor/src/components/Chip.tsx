import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';

type ChipVariant = 'connected' | 'disconnected' | 'searching';

interface ChipProps {
  variant: ChipVariant;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({ variant, style }) => {
  const getChipStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
    };

    switch (variant) {
      case 'connected':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(131, 212, 155, 0.1)',
        };
      case 'disconnected':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 131, 131, 0.1)',
        };
      case 'searching':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(135, 174, 238, 0.1)',
        };
      default:
        return baseStyle;
    }
  };

  const getDotStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    };

    switch (variant) {
      case 'connected':
        return {
          ...baseStyle,
          backgroundColor: '#83D49B',
        };
      case 'disconnected':
        return {
          ...baseStyle,
          backgroundColor: '#FF8383',
        };
      case 'searching':
        return {
          ...baseStyle,
          backgroundColor: '#87AEEE',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 14,
      fontWeight: '500',
    };

    switch (variant) {
      case 'connected':
        return {
          ...baseStyle,
          color: '#83D49B',
        };
      case 'disconnected':
        return {
          ...baseStyle,
          color: '#FF8383',
        };
      case 'searching':
        return {
          ...baseStyle,
          color: '#87AEEE',
        };
      default:
        return baseStyle;
    }
  };

  const getText = () => {
    switch (variant) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'searching':
        return 'Searching...';
      default:
        return '';
    }
  };

  return (
    <View style={[getChipStyle(), style]}>
      <View style={getDotStyle()} />
      <Text style={getTextStyle()}>{getText()}</Text>
    </View>
  );
};