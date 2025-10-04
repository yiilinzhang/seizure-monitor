import React from 'react';
import {View, Text, Switch, StyleSheet, ViewStyle} from 'react-native';
import {colors, fontSize, spacing} from '../../utils/colors';

interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  value,
  onValueChange,
  disabled = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, disabled && styles.disabledText]}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: colors.ink[60],
          true: colors.brand.primary,
        }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.ink[60]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.grid,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: '500',
    color: colors.ink[100],
    flex: 1,
  },
  disabledText: {
    color: colors.ink[60],
    opacity: 0.5,
  },
});
