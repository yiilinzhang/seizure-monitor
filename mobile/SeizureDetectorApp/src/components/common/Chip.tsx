import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, fontSize} from '../../utils/colors';

interface ChipProps {
  status: 'connected' | 'disconnected';
}

export const Chip: React.FC<ChipProps> = ({status}) => {
  const isConnected = status === 'connected';
  const chipColor = isConnected ? colors.semantic.ok : colors.semantic.alert;
  const label = isConnected ? 'Connected' : 'Disconnected';

  return (
    <View style={[styles.chip, {backgroundColor: `${chipColor}15`}]}>
      <View style={[styles.dot, {backgroundColor: chipColor}]} />
      <Text style={[styles.text, {color: chipColor}]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    fontSize: fontSize.bodySmall,
    fontWeight: '600',
  },
});
