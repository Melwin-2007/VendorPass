import React from 'react';
import { StyleSheet, Text, Pressable, View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Typography, Spacing } from '@/constants/theme';
import { SymbolView } from './symbol-view';

interface ButtonProps {
  label: string;
  onPress: () => void;
  iconName?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

export function FilledButton({ label, onPress, iconName, disabled, loading, style }: ButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={!disabled && !loading ? onPress : undefined}
      style={({ pressed }) => [
        styles.baseButton,
        styles.filledButton,
        {
          backgroundColor: disabled ? theme.backgroundElement : theme.colorPrimary,
          opacity: pressed ? 0.9 : 1.0,
        },
        style
      ]}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={theme.colorOnPrimary} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {iconName && <SymbolView name={iconName} size={18} tintColor={disabled ? theme.textMuted : theme.colorOnPrimary} style={styles.icon} />}
          <Text style={[styles.labelText, { color: disabled ? theme.textMuted : theme.colorOnPrimary }]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function OutlinedButton({ label, onPress, iconName, disabled, loading, style }: ButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={!disabled && !loading ? onPress : undefined}
      style={({ pressed }) => [
        styles.baseButton,
        styles.outlinedButton,
        {
          borderColor: disabled ? theme.backgroundElement : theme.colorPrimary,
          backgroundColor: pressed ? 'rgba(0,0,0,0.03)' : 'transparent',
        },
        style
      ]}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={theme.colorPrimary} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {iconName && <SymbolView name={iconName} size={18} tintColor={disabled ? theme.textMuted : theme.colorPrimary} style={styles.icon} />}
          <Text style={[styles.labelText, { color: disabled ? theme.textMuted : theme.colorPrimary }]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function TextButton({ label, onPress, iconName, disabled, loading, style }: ButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={!disabled && !loading ? onPress : undefined}
      style={({ pressed }) => [
        styles.baseButton,
        styles.textButton,
        {
          backgroundColor: pressed ? 'rgba(0,0,0,0.03)' : 'transparent',
        },
        style
      ]}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={theme.colorPrimary} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {iconName && <SymbolView name={iconName} size={18} tintColor={disabled ? theme.textMuted : theme.colorPrimary} style={styles.icon} />}
          <Text style={[styles.labelText, { color: disabled ? theme.textMuted : theme.colorPrimary }]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    minWidth: 80,
  },
  filledButton: {
    // shadow is handled by theme or elevation where needed
  },
  outlinedButton: {
    borderWidth: 1.5,
  },
  textButton: {
    paddingHorizontal: Spacing.two,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: Spacing.one,
  },
  labelText: {
    ...Typography.labelLarge,
    fontWeight: '700',
  },
});
