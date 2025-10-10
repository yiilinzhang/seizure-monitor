import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  style?: ViewStyle;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: checked ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [checked, animatedValue]);

  const handlePress = () => {
    onChange(!checked);
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E0E0E0', '#87AEEE'],
  });

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {label && (
        <Text style={{ fontSize: 14, color: '#3D3D3D', marginRight: 12 }}>
          {label}
        </Text>
      )}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Animated.View
          style={{
            width: 50,
            height: 30,
            borderRadius: 15,
            backgroundColor,
            padding: 2,
          }}
        >
          <Animated.View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
              transform: [{ translateX }],
            }}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};