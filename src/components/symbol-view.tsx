import React from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
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

type IconSet = 'MaterialIcons' | 'MaterialCommunityIcons';

const ICON_MAPPING: Record<string, { set: IconSet; name: string }> = {
  // Navigation & Chevron
  'chevron.left': { set: 'MaterialIcons', name: 'chevron-left' },
  'chevron_left': { set: 'MaterialIcons', name: 'chevron-left' },
  'arrow.left': { set: 'MaterialIcons', name: 'arrow-back' },
  'arrow-backward': { set: 'MaterialIcons', name: 'arrow-back' },
  'arrow_backward': { set: 'MaterialIcons', name: 'arrow-back' },
  'chevron.right': { set: 'MaterialIcons', name: 'chevron-right' },
  'chevron_right': { set: 'MaterialIcons', name: 'chevron-right' },
  'chevron.down': { set: 'MaterialIcons', name: 'keyboard-arrow-down' },
  'chevron_down': { set: 'MaterialIcons', name: 'keyboard-arrow-down' },
  'xmark': { set: 'MaterialIcons', name: 'close' },
  'xmark.circle.fill': { set: 'MaterialIcons', name: 'cancel' },
  'xmark_circle_fill': { set: 'MaterialIcons', name: 'cancel' },
  'xmark.seal.fill': { set: 'MaterialIcons', name: 'cancel' },
  'trash': { set: 'MaterialIcons', name: 'delete' },
  'checkmark-shield-fill': { set: 'MaterialIcons', name: 'verified' },
  'checkmark.shield.fill': { set: 'MaterialIcons', name: 'verified' },

  // Indicators & Checkmarks
  'checkmark': { set: 'MaterialIcons', name: 'check' },
  'checkmark.circle': { set: 'MaterialIcons', name: 'check-circle-outline' },
  'checkmark.circle.fill': { set: 'MaterialIcons', name: 'check-circle' },
  'checkmark_circle_fill': { set: 'MaterialIcons', name: 'check-circle' },
  'checkmark.seal.fill': { set: 'MaterialIcons', name: 'verified' },
  'sparkles': { set: 'MaterialIcons', name: 'auto-awesome' },

  // Auth & Profile
  'person': { set: 'MaterialIcons', name: 'person-outline' },
  'envelope': { set: 'MaterialIcons', name: 'mail-outline' },
  'lock': { set: 'MaterialIcons', name: 'lock-outline' },
  'eye': { set: 'MaterialIcons', name: 'visibility' },
  'eye.slash': { set: 'MaterialIcons', name: 'visibility-off' },
  'g.circle.fill': { set: 'MaterialCommunityIcons', name: 'google' },

  // App & Finance
  'cpu': { set: 'MaterialIcons', name: 'memory' },
  'plus.circle': { set: 'MaterialIcons', name: 'add-circle-outline' },
  'plus_circle': { set: 'MaterialIcons', name: 'add-circle-outline' },
  'banknote': { set: 'MaterialIcons', name: 'payments' },
  'square.and.arrow.up': { set: 'MaterialIcons', name: 'share' },
  'graduationcap': { set: 'MaterialIcons', name: 'school' },
  'pencil': { set: 'MaterialIcons', name: 'edit' },
  'camera': { set: 'MaterialIcons', name: 'photo-camera' },
  'storefront': { set: 'MaterialIcons', name: 'storefront' },
  'arrow.right.to.line': { set: 'MaterialIcons', name: 'login' },
  'arrow.up.circle.fill': { set: 'MaterialIcons', name: 'arrow-upward' },
  'arrow.up.right.square': { set: 'MaterialIcons', name: 'open-in-new' },
  'link': { set: 'MaterialIcons', name: 'link' },
  'bookmark': { set: 'MaterialIcons', name: 'bookmark-border' },
  'bookmark.fill': { set: 'MaterialIcons', name: 'bookmark' },

  // Roles & Custom UI
  'arrow.up': { set: 'MaterialIcons', name: 'arrow-upward' },
  'arrow.down': { set: 'MaterialIcons', name: 'arrow-downward' },
  'building.columns': { set: 'MaterialIcons', name: 'account-balance' },
  'shield.chevron': { set: 'MaterialIcons', name: 'shield' },
  'account_balance_wallet': { set: 'MaterialIcons', name: 'account-balance-wallet' },
  'account_balance': { set: 'MaterialIcons', name: 'account-balance' },
  'arrow_back': { set: 'MaterialIcons', name: 'arrow-back' },
  'arrow_forward': { set: 'MaterialIcons', name: 'arrow-forward' },
  'badge': { set: 'MaterialIcons', name: 'badge' },
  'alternate_email': { set: 'MaterialIcons', name: 'alternate-email' },
  'mail': { set: 'MaterialIcons', name: 'mail-outline' },
  'cloud_upload': { set: 'MaterialIcons', name: 'cloud-upload' },
  'add_a_photo': { set: 'MaterialIcons', name: 'photo-camera' },
  'rocket_launch': { set: 'MaterialIcons', name: 'launch' },
  'check_circle': { set: 'MaterialIcons', name: 'check-circle' },
  
  // Redesigned dashboard specific icons
  'notifications': { set: 'MaterialIcons', name: 'notifications-none' },
  'bell.fill': { set: 'MaterialIcons', name: 'notifications' },
  'bell.slash': { set: 'MaterialIcons', name: 'notifications-off' },
  'payments': { set: 'MaterialIcons', name: 'payments' },
  'analytics': { set: 'MaterialIcons', name: 'bar-chart' },
  'folder_open': { set: 'MaterialIcons', name: 'folder-open' },
  'local_shipping': { set: 'MaterialIcons', name: 'local-shipping' },
  'qr_code_2': { set: 'MaterialIcons', name: 'qr-code' },
  'auto_awesome': { set: 'MaterialIcons', name: 'auto-awesome' },
  'home': { set: 'MaterialIcons', name: 'home' },
  'receipt_long': { set: 'MaterialIcons', name: 'receipt' },
  'settings': { set: 'MaterialIcons', name: 'settings' },
  'search': { set: 'MaterialIcons', name: 'search' },
  'add': { set: 'MaterialIcons', name: 'add' },
  'pie_chart': { set: 'MaterialIcons', name: 'pie-chart' },
  'warning': { set: 'MaterialIcons', name: 'warning' },
  'verified_user': { set: 'MaterialIcons', name: 'verified-user' },
  'filter_list': { set: 'MaterialIcons', name: 'filter-list' },
  'home_app_logo': { set: 'MaterialIcons', name: 'home' },
  'calendar_today': { set: 'MaterialIcons', name: 'calendar-today' },
  'chat_bubble': { set: 'MaterialIcons', name: 'chat-bubble-outline' },
  'info.circle': { set: 'MaterialIcons', name: 'info-outline' },
  'chart.bar': { set: 'MaterialIcons', name: 'bar-chart' },
  'exclamationmark.triangle': { set: 'MaterialIcons', name: 'warning' },
  'exclamationmark.triangle.fill': { set: 'MaterialIcons', name: 'report-problem' },
  'clock': { set: 'MaterialIcons', name: 'access-time' },
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
    set: 'MaterialIcons' as const,
    name: resolvedName.replace(/\./g, '-').replace(/_/g, '-'),
  };

  const commonProps = {
    name: mapped.name,
    size,
    color: tintColor,
    style: style as any,
  };

  switch (mapped.set) {
    case 'MaterialCommunityIcons':
      return <MaterialCommunityIcons {...commonProps} name={mapped.name as any} />;
    case 'MaterialIcons':
    default:
      return <MaterialIcons {...commonProps} name={mapped.name as any} />;
  }
}
