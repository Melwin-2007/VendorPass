import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Typography, Spacing } from '@/constants/theme';
import { SymbolView } from './symbol-view';

export interface EmptyStateProps {
  iconName: string;
  title: string;
  description: string;
  ctaText?: string;
  onCtaPress?: () => void;
}

export function EmptyState({
  iconName,
  title,
  description,
  ctaText,
  onCtaPress,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: theme.backgroundElement,
          },
        ]}
      >
        <SymbolView name={iconName} size={48} tintColor={theme.colorPrimary} />
      </View>

      <Text
        style={[
          styles.titleText,
          {
            color: theme.colorOnSurface,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.descriptionText,
          {
            color: theme.textSecondary,
          },
        ]}
      >
        {description}
      </Text>

      {ctaText && onCtaPress && (
        <Pressable
          onPress={onCtaPress}
          style={({ pressed }) => [
            styles.ctaButton,
            {
              backgroundColor: theme.colorPrimary,
              opacity: pressed ? 0.9 : 1.0,
            },
          ]}
        >
          <Text style={[styles.ctaText, { color: theme.colorOnPrimary }]}>
            {ctaText}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: Spacing.four,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  titleText: {
    textAlign: 'center',
    marginBottom: Spacing.two,
    ...Typography.titleMedium,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  descriptionText: {
    textAlign: 'center',
    marginBottom: Spacing.four,
    paddingHorizontal: Spacing.three,
    ...Typography.bodyMedium,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  ctaButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 100,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    ...Typography.labelLarge,
    fontWeight: 'bold',
  },
});
