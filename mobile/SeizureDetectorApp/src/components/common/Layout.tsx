import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ViewStyle,
} from 'react-native';
import {colors, fontSize, spacing} from '../../utils/colors';

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
          {rightElement && (
            <View style={styles.rightElement}>{rightElement}</View>
          )}
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
    paddingHorizontal: spacing.margin + 4,
    paddingVertical: spacing.margin,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[60] + '40',
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.ink[100],
    flex: 1,
  },
  rightElement: {
    marginLeft: spacing.margin,
  },
  content: {
    flex: 1,
    padding: spacing.margin + 4,
  },
  scrollContent: {
    padding: spacing.margin + 4,
  },
});
