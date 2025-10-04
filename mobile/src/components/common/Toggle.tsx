import React from 'react';
import {View, Text, Switch, StyleSheet, ViewStyle} from 'react-native';
import {colors} from '../../utils/colors';

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
          false: colors.disconnected,
          true: colors.brandPrimary,
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={colors.disconnected}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.ink100,
    flex: 1,
  },
  disabledText: {
    color: colors.ink60,
    opacity: 0.5,
  },
});
