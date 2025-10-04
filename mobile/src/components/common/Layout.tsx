import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ViewStyle,
} from 'react-native';
import {colors} from '../../utils/colors';

interface LayoutProps {
  title: string;
  children: React.ReactNode;
  rightElement?: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
}

export const Layout: React.FC<LayoutProps> = ({
  title,
  children,
  rightElement,
  scrollable = true,
  style,
}) => {
  const ContentWrapper = scrollable ? ScrollView : View;
  const contentWrapperProps = scrollable
    ? {
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
      }
    : {style: styles.content};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
        </View>

        {/* Content */}
        <ContentWrapper {...contentWrapperProps} style={style}>
          {children}
        </ContentWrapper>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink100,
    flex: 1,
  },
  rightElement: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    padding: 20,
  },
});
