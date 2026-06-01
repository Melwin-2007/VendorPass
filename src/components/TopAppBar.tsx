import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { Typography, Spacing } from '@/constants/theme';
import { SymbolView } from './symbol-view';
import { router } from 'expo-router';

export interface TopAppBarProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightActions?: React.ReactNode;
  transparent?: boolean;
}

export function TopAppBar({
  title,
  showBackButton = false,
  onBackPress,
  rightActions,
  transparent = false,
}: TopAppBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, Spacing.two),
          backgroundColor: transparent ? 'transparent' : theme.colorSurface,
          borderBottomColor: theme.colorOutline,
          borderBottomWidth: transparent ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {showBackButton ? (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.navButton,
              { opacity: pressed ? 0.7 : 1.0 }
            ]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <SymbolView name="arrow_back" size={24} tintColor={theme.colorOnSurface} />
          </Pressable>
        ) : (
          // Placeholder spacing if no back button to balance the row layout
          <View style={styles.navButtonPlaceholder} />
        )}

        <Text
          style={[
            styles.titleText,
            {
              color: theme.colorOnSurface,
            }
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        <View style={styles.actionsContainer}>
          {rightActions || <View style={styles.actionPlaceholder} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 100,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        maxWidth: 600,
        alignSelf: 'center',
      }
    }),
  },
  contentRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  navButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  navButtonPlaceholder: {
    width: 48,
  },
  titleText: {
    flex: 1,
    textAlign: 'center',
    ...Typography.titleLarge,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 48,
  },
  actionPlaceholder: {
    width: 48,
  },
});
