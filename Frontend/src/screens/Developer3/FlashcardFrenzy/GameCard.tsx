import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  title: string;
  subtitle?: string;
  emoji: string;
  colors?: [string, string];
  onPress: () => void;
  accessibilityLabel?: string;
};

const DEFAULT_COLORS: [string, string] = ['#007AFF', '#005BB5'];

/**
 * Reusable home-screen feature tile — matches the gradient card style used on HomeScreen.
 */
export default function GameCard({
  title,
  subtitle,
  emoji,
  colors = DEFAULT_COLORS,
  onPress,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={({pressed}) => [
        styles.wrapper,
        pressed && styles.wrapperPressed,
      ]}>
      <LinearGradient
        colors={colors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.card}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '48%',
    marginBottom: 8,
  },
  wrapperPressed: {
    opacity: 0.88,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 15,
  },
});
