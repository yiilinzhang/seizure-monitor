import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface LayoutProps {
  title: string;
  children: React.ReactNode;
  rightElement?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  scrollable?: boolean;
  style?: ViewStyle;
}

export const Layout: React.FC<LayoutProps> = ({
  title,
  children,
  rightElement,
  showBack = false,
  onBack,
  scrollable = true,
  style,
}) => {
  const content = (
    <View style={{ flex: 1, backgroundColor: '#F5F2EE' }}>
      <SafeAreaView style={{ backgroundColor: '#F5F2EE' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showBack && (
              <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
                <Icon name="chevron-left" size={24} color="#3D3D3D" />
              </TouchableOpacity>
            )}
            <Text
              style={{
                fontSize: 24,
                fontWeight: '600',
                color: '#3D3D3D',
              }}
            >
              {title}
            </Text>
          </View>
          {rightElement && <View>{rightElement}</View>}
        </View>
      </SafeAreaView>

      {scrollable ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100,
            ...style,
          }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={{
            flex: 1,
            paddingHorizontal: 16,
            ...style,
          }}
        >
          {children}
        </View>
      )}
    </View>
  );

  return content;
};