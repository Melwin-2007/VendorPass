import React from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { Ionicons, Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { SymbolView as ExpoSymbolView, SymbolViewProps as ExpoSymbolViewProps } from 'expo-symbols';

// Define Props based on expo-symbols to ensure exact match
export interface SymbolViewProps {
  name: string | { ios: string; android?: string; web?: string };
  size?: number;
  tintColor?: string;
  style?: StyleProp<ViewStyle>;
  weight?: ExpoSymbolViewProps['weight'];
  scale?: ExpoSymbolViewProps['scale'];
  resizeMode?: ExpoSymbolViewProps['resizeMode'];
}

const ICON_MAPPING: Record<string, { set: 'Ionicons' | 'Feather' | 'FontAwesome' | 'MaterialCommunityIcons'; name: string }> = {
  // Navigation & Chevron
  'chevron.left': { set: 'Ionicons', name: 'chevron-back' },
  'chevron_left': { set: 'Ionicons', name: 'chevron-back' },
  'chevron.right': { set: 'Ionicons', name: 'chevron-forward' },
  'chevron_right': { set: 'Ionicons', name: 'chevron-forward' },
  'chevron.down': { set: 'Ionicons', name: 'chevron-down' },
  'chevron_down': { set: 'Ionicons', name: 'chevron-down' },
  'xmark': { set: 'Ionicons', name: 'close' },
  'xmark.circle.fill': { set: 'Ionicons', name: 'close-circle' },
  'xmark_circle_fill': { set: 'Ionicons', name: 'close-circle' },

  // Indicators & Checkmarks
  'checkmark': { set: 'Ionicons', name: 'checkmark' },
  'checkmark.circle': { set: 'Ionicons', name: 'checkmark-circle-outline' },
  'checkmark.circle.fill': { set: 'Ionicons', name: 'checkmark-circle' },
  'checkmark_circle_fill': { set: 'Ionicons', name: 'checkmark-circle' },
  'sparkles': { set: 'Ionicons', name: 'sparkles-outline' },

  // Auth & Profile
  'person': { set: 'Ionicons', name: 'person-outline' },
  'envelope': { set: 'Ionicons', name: 'mail-outline' },
  'lock': { set: 'Ionicons', name: 'lock-closed-outline' },
  'eye': { set: 'Ionicons', name: 'eye-outline' },
  'eye.slash': { set: 'Ionicons', name: 'eye-off-outline' },
  'g.circle.fill': { set: 'Ionicons', name: 'logo-google' },

  // App & Finance
  'cpu': { set: 'Feather', name: 'cpu' },
  'plus.circle': { set: 'Ionicons', name: 'add-circle-outline' },
  'plus_circle': { set: 'Ionicons', name: 'add-circle-outline' },
  'banknote': { set: 'Ionicons', name: 'cash-outline' },
  'square.and.arrow.up': { set: 'Ionicons', name: 'share-outline' },
  'graduationcap': { set: 'Ionicons', name: 'school-outline' },
  'pencil': { set: 'Ionicons', name: 'pencil-outline' },
  'camera': { set: 'Ionicons', name: 'camera-outline' },
  'storefront': { set: 'Ionicons', name: 'storefront-outline' },
  'arrow.right.to.line': { set: 'Ionicons', name: 'log-in-outline' },
  'arrow.up.circle.fill': { set: 'Ionicons', name: 'arrow-up-circle' },
  'arrow.up.right.square': { set: 'Ionicons', name: 'open-outline' },
  'link': { set: 'Ionicons', name: 'link-outline' },

  // Roles & Custom UI
  'building.columns': { set: 'Ionicons', name: 'business-outline' },
  'shield.chevron': { set: 'Ionicons', name: 'shield-checkmark-outline' },
  'account_balance_wallet': { set: 'Ionicons', name: 'wallet-outline' },
  'account_balance': { set: 'Ionicons', name: 'business-outline' },
  'arrow_back': { set: 'Ionicons', name: 'arrow-back' },
  'arrow_forward': { set: 'Ionicons', name: 'arrow-forward' },
  'badge': { set: 'Ionicons', name: 'card-outline' },
  'alternate_email': { set: 'Ionicons', name: 'at-outline' },
  'mail': { set: 'Ionicons', name: 'mail-outline' },
  'cloud_upload': { set: 'Ionicons', name: 'cloud-upload-outline' },
  'add_a_photo': { set: 'Ionicons', name: 'camera-outline' },
  'rocket_launch': { set: 'Ionicons', name: 'rocket-outline' },
  'check_circle': { set: 'Ionicons', name: 'checkmark-circle-outline' },
  
  // Redesigned dashboard specific icons
  'notifications': { set: 'Ionicons', name: 'notifications-outline' },
  'payments': { set: 'Ionicons', name: 'cash-outline' },
  'analytics': { set: 'Ionicons', name: 'bar-chart-outline' },
  'folder_open': { set: 'Ionicons', name: 'folder-open-outline' },
  'local_shipping': { set: 'Feather', name: 'truck' },
  'qr_code_2': { set: 'Ionicons', name: 'qr-code-outline' },
  'auto_awesome': { set: 'Ionicons', name: 'sparkles-outline' },
  'home': { set: 'Ionicons', name: 'home-outline' },
  'receipt_long': { set: 'Ionicons', name: 'document-text-outline' },
};

export function SymbolView({
  name,
  size = 24,
  tintColor,
  style,
  weight,
  scale,
  resizeMode,
}: SymbolViewProps) {
  // If we are on iOS, use the native ExpoSymbolView
  if (Platform.OS === 'ios') {
    return (
      <ExpoSymbolView
        name={name as any}
        size={size}
        tintColor={tintColor}
        style={style}
        weight={weight}
        scale={scale}
        resizeMode={resizeMode}
      />
    );
  }

  // Resolve platform-specific name if name is an object
  let resolvedName = '';
  if (typeof name === 'string') {
    resolvedName = name;
  } else if (name && typeof name === 'object') {
    const platform = Platform.OS;
    if (platform === 'web') {
      resolvedName = name.web || name.android || name.ios || '';
    } else if (platform === 'android') {
      resolvedName = name.android || name.ios || '';
    } else {
      resolvedName = (name as any)[platform] || name.ios || '';
    }
  }

  // Look up vector icon mapping
  const mapped = ICON_MAPPING[resolvedName] || {
    set: 'Ionicons' as const,
    name: resolvedName.replace(/\./g, '-').replace(/_/g, '-'),
  };

  const commonProps = {
    name: mapped.name,
    size,
    color: tintColor,
    style: style as any,
  };

  switch (mapped.set) {
    case 'Feather':
      return <Feather {...commonProps} name={mapped.name as any} />;
    case 'FontAwesome':
      return <FontAwesome {...commonProps} name={mapped.name as any} />;
    case 'MaterialCommunityIcons':
      return <MaterialCommunityIcons {...commonProps} name={mapped.name as any} />;
    case 'Ionicons':
    default:
      return <Ionicons {...commonProps} name={mapped.name as any} />;
  }
}

