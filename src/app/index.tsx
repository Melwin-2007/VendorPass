import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

function SparklesCanvas() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      opacity: number;
      reset: () => void;
      update: () => void;
      draw: () => void;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      x!: number;
      y!: number;
      size!: number;
      speedY!: number;
      opacity!: number;
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedY = Math.random() * -0.5 - 0.2;
        this.opacity = Math.random() * 0.5;
      }
      update() {
        this.y += this.speedY;
        if (this.y < 0) this.reset();
      }
      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(212, 130, 10, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    resize();
    for (let i = 0; i < 40; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (Platform.OS !== 'web') return null;

  return (
    // @ts-ignore
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

export default function EntryScreen() {
  const { isAuthenticated, loading } = useAuth();
  const theme = useTheme();

  // Animations
  const logoScale = useSharedValue(0.95);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const progressWidth = useSharedValue(66);

  useEffect(() => {
    // 1. Initial logo fade + scale in
    logoScale.value = withTiming(1.0, { duration: 800, easing: Easing.out(Easing.back(1.5)) });
    logoOpacity.value = withTiming(1, { duration: 800 });

    // 2. Continuous floating animation
    logoTranslateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    logoRotate.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 3. Progress bar animation
    progressWidth.value = withTiming(100, { duration: 2000, easing: Easing.out(Easing.quad) });

    // 4. Routing check timer (2.5s delay)
    const routeTimer = setTimeout(() => {
      if (!loading) {
        if (isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      }
    }, 2500);

    return () => {
      clearTimeout(routeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loading]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { translateY: logoTranslateY.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Sora:wght@100..800&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
          .grain-overlay {
            background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuDDY4u0Z2lIU0RYVNtbRdcxunDiV7m9gn7JLi010qrQsvkk3slVX323Delnhjrcbew_wtCzHvgAmDgho5Fkn1VJM8tewhW36xUiAUpQ7F8Oysntdn2_7zyJIfZzCUBXTRSUDRojtecAo0oJHabRNnlBzjIsMa5pbAHKji4mDgLcnI4Ij2Nfis-CBMaH4OR9KfnYYQEtP_Gy-KY4dzmxXrJ05A4TSIdW05BSg97jQH91qDdDawSz2TatyA_uuyjOMJxbbNdBUHfvdb0g");
            opacity: 0.15;
            pointer-events: none;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1;
          }
          .geometric-lines {
            background-image: radial-gradient(circle at 2px 2px, rgba(212, 130, 10, 0.1) 1px, transparent 0);
            background-size: 40px 40px;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            opacity: 0.4;
            z-index: 1;
          }
        `}} />
      )}

      {/* Diagonal background gradient */}
      <LinearGradient
        colors={['#1A3A4A', '#0F2430', '#D4820A']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Grain overlay for native and web */}
      <Image
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDY4u0Z2lIU0RYVNtbRdcxunDiV7m9gn7JLi010qrQsvkk3slVX323Delnhjrcbew_wtCzHvgAmDgho5Fkn1VJM8tewhW36xUiAUpQ7F8Oysntdn2_7zyJIfZzCUBXTRSUDRojtecAo0oJHabRNnlBzjIsMa5pbAHKji4mDgLcnI4Ij2Nfis-CBMaH4OR9KfnYYQEtP_Gy-KY4dzmxXrJ05A4TSIdW05BSg97jQH91qDdDawSz2TatyA_uuyjOMJxbbNdBUHfvdb0g' }}
        style={[StyleSheet.absoluteFill, { opacity: 0.05, zIndex: 1 }]}
        resizeMode="repeat"
      />

      {/* Geometric Lines overlay on Web */}
      {Platform.OS === 'web' && <View style={StyleSheet.absoluteFill} className="geometric-lines" />}

      {/* Interactive Sparkles Canvas */}
      <SparklesCanvas />

      {/* Faint Background Mandala SVG line art */}
      <View style={styles.mandalaContainer}>
        <Svg
          viewBox="0 0 1000 1000"
          width="120%"
          height="120%"
          style={{ opacity: 0.1 }}
        >
          <Circle cx="500" cy="500" r="450" stroke="#D4820A" strokeWidth="0.5" fill="none" />
          <Circle cx="500" cy="500" r="350" stroke="#D4820A" strokeWidth="0.5" fill="none" />
          <Path d="M500 50L500 950M50 500L950 500" stroke="#D4820A" strokeWidth="0.5" />
          <Rect
            x="200"
            y="200"
            width="600"
            height="600"
            stroke="#D4820A"
            strokeWidth="0.5"
            fill="none"
            transform="rotate(45 500 500)"
          />
          <Path d="M500 500L900 100M500 500L100 900M500 500L100 100M500 500L900 900" stroke="#D4820A" strokeWidth="0.5" />
        </Svg>
      </View>

      {/* Central Branding Area */}
      <View style={styles.centerContainer}>
        <Animated.View style={[styles.brandingWrapper, animatedLogoStyle]}>
          {/* Custom SVG Shield Logo Container */}
          <View style={styles.logoCard}>
            <Svg viewBox="0 0 64 64" width="80" height="80">
              {/* Shield Outline */}
              <Path
                d="M32 4L54 14V30C54 42.15 44.6 53.42 32 58C19.4 53.42 10 42.15 10 30V14L32 4Z"
                fill="rgba(255, 255, 255, 0.1)"
                stroke="#D4820A"
                strokeWidth="2.5"
              />
              {/* V Checkmark */}
              <Path
                d="M22 28L30 42L42 22"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Smile / Wave */}
              <Path
                d="M18 48C22 45 28 45 32 48C36 51 42 51 46 48"
                stroke="#D4820A"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Spark Dot */}
              <Circle cx="42" cy="22" r="3" fill="#D4820A" />
            </Svg>
          </View>

          {/* Wordmark and Tagline */}
          <View style={styles.textContainer}>
            <Text style={styles.wordmark}>
              Vendor<Text style={{ color: '#D4820A' }}>PASS</Text>
            </Text>
            <Text style={styles.tagline}>
              AI-POWERED CREDIT FOR EVERY VENDOR
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Loading Progress Bar at Bottom-ish */}
      <View style={styles.loadingContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
        </View>
        <Text style={styles.syncText}>
          SYNCHRONIZING DIGITAL LEDGER...
        </Text>
      </View>

      {/* Bottom Security Badges / Visual Flair */}
      <View style={styles.bottomFlair}>
        <View style={styles.flairItem}>
          <MaterialIcons name="verified-user" size={16} color="rgba(255, 255, 255, 0.5)" />
          <Text style={styles.flairText}>Secure Vault</Text>
        </View>
        <View style={styles.flairItem}>
          <MaterialIcons name="insights" size={16} color="rgba(255, 255, 255, 0.5)" />
          <Text style={styles.flairText}>Smart Scoring</Text>
        </View>
        <View style={styles.flairItem}>
          <MaterialIcons name="account-balance" size={16} color="rgba(255, 255, 255, 0.5)" />
          <Text style={styles.flairText}>Trusted Growth</Text>
        </View>
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
  mandalaContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    pointerEvents: 'none',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: Spacing.four,
    marginBottom: 60,
  },
  brandingWrapper: {
    alignItems: 'center',
  },
  logoCard: {
    width: 128,
    height: 128,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4820A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: Spacing.four,
  },
  textContainer: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  wordmark: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: Spacing.one,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 120,
    width: '100%',
    alignItems: 'center',
    gap: Spacing.two,
    zIndex: 10,
  },
  progressTrack: {
    width: 192,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4820A',
    borderRadius: 2,
  },
  syncText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  bottomFlair: {
    position: 'absolute',
    bottom: Spacing.four,
    left: Spacing.four,
    right: Spacing.four,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: Spacing.three,
    zIndex: 10,
    display: Platform.OS === 'web' ? 'flex' : 'none', // Hidden on native by default like Tailwind md:flex
  },
  flairItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  flairText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    textTransform: 'uppercase',
  },
});
