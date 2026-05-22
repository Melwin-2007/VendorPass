import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export default function SuccessScreen() {
  const theme = useTheme();

  // Animation values
  const checkScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const gaugeWidth = useSharedValue(0);
  const scoreVal = useSharedValue(300); // starts low

  useEffect(() => {
    // 1. Pop checkmark
    checkScale.value = withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back(1.5)) }, (finished) => {
      if (finished) {
        checkScale.value = withTiming(1.0, { duration: 150 });
      }
    });

    // 2. Fade/slide text
    textOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    textTranslateY.value = withDelay(300, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));

    // 3. Animate gauge progress
    gaugeWidth.value = withDelay(800, withTiming(0.4, { duration: 1500, easing: Easing.out(Easing.cubic) }));
    scoreVal.value = withDelay(800, withTiming(620, { duration: 1500, easing: Easing.out(Easing.cubic) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const animatedGaugeStyle = useAnimatedStyle(() => ({
    width: `${gaugeWidth.value * 100}%`,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background Mandala Vector Lines (Mocked with styled absolute circles) */}
      <View style={[styles.mandalaCircle, { borderColor: theme.primary + '10', width: 300, height: 300 }]} />
      <View style={[styles.mandalaCircle, { borderColor: theme.primary + '05', width: 450, height: 450 }]} />

      <View style={styles.content}>
        {/* Animated Checkmark */}
        <Animated.View style={[styles.checkCircle, { backgroundColor: theme.success }, animatedCheckStyle]}>
          <SymbolView tintColor="#fff" name="checkmark" size={48} />
        </Animated.View>

        {/* Success Text */}
        <Animated.View style={[styles.textBlock, animatedTextStyle]}>
          <Text style={[styles.title, { color: theme.text }]}>You&apos;re in!</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your VendorPASS profile is ready. We are building your TrustScore™ profile.
          </Text>
        </Animated.View>

        {/* Score Meter Gauge Panel */}
        <Animated.View style={[styles.gaugeCard, { backgroundColor: theme.card, borderColor: theme.border }, animatedTextStyle]}>
          <View style={styles.gaugeHeader}>
            <SymbolView tintColor={theme.primary} name="sparkles" size={18} style={styles.sparkleIcon} />
            <Text style={[styles.gaugeTitle, { color: theme.textSecondary }]}>INITIAL TRUSTSCORE</Text>
          </View>

          <View style={styles.gaugeContainer}>
            {/* Background Track */}
            <View style={[styles.gaugeTrack, { backgroundColor: theme.border }]}>
              {/* Animated Saffron Fill */}
              <Animated.View style={[styles.gaugeFill, { backgroundColor: theme.primary }, animatedGaugeStyle]} />
            </View>
          </View>

          <View style={styles.scoreRow}>
            <Text style={[styles.scoreNumber, { color: theme.text }]}>620</Text>
            <View style={[styles.scoreBadge, { backgroundColor: theme.success + '20' }]}>
              <Text style={[styles.scoreBadgeText, { color: theme.success }]}>Good Start</Text>
            </View>
          </View>
          
          <Text style={[styles.gaugeDescription, { color: theme.textSecondary }]}>
            Your score is starting at 620 based on verification. Transact & make payments to grow it to 850+!
          </Text>
        </Animated.View>
      </View>

      {/* Continue Action */}
      <View style={[styles.bottomContainer, { backgroundColor: theme.background }]}>
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.9 : 1.0,
            },
            styles.buttonShadow,
          ]}
          onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.ctaButtonText}>Go to My Dashboard →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mandalaCircle: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 999,
    top: '20%',
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    width: '100%',
    zIndex: 2,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
    ...Platform.select({
      ios: {
        shadowColor: '#2D7D46',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 6px 16px rgba(45,125,70,0.3)',
      },
    }),
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
    marginBottom: Spacing.two,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    paddingHorizontal: Spacing.two,
  },
  gaugeCard: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: Spacing.four,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
      },
    }),
  },
  gaugeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  sparkleIcon: {
    marginRight: 6,
  },
  gaugeTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  gaugeContainer: {
    height: 12,
    width: '100%',
    marginBottom: Spacing.three,
  },
  gaugeTrack: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
    marginRight: Spacing.two,
  },
  scoreBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scoreBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  gaugeDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    zIndex: 3,
  },
  ctaButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#D4820A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 8px 24px rgba(212,130,10,0.35)',
      },
    }),
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
});
