import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from './AppText';
import { HardShadow } from './HardShadow';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = 'info',
  visible,
  onHide,
  duration = 3000,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }
  }, [visible, duration, onHide, opacity]);

  if (!visible) return null;

  // type is kept in the interface for API compatibility but visual style is
  // now uniform (white box, black border) per design system.
  void type;

  return (
    <Animated.View style={[styles.positioner, { opacity }]}>
      <HardShadow offset="card">
        <View style={styles.container}>
          <AppText variant="tableCell" style={{ color: colors.inkBlack }}>
            {message}
          </AppText>
        </View>
      </HardShadow>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.xl,
    zIndex: 1000,
  },
  container: {
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.inkBlack,
    borderRadius: 0,
    padding: spacing.md,
  },
});
