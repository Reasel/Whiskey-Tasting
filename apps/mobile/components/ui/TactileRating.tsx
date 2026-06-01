import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from './AppText';

const PIP_W = 36;
const PIP_H = 40;

interface TactileRatingProps {
  value: number;
  onChange: (n: number) => void;
  max?: number;
}

export function TactileRating({ value, onChange, max = 5 }: TactileRatingProps) {
  const [text, setText] = useState(() => format(value));

  // One Animated.Value per pip for the cascade bounce
  const pipScales = useRef<Animated.Value[]>([]).current;
  if (pipScales.length !== max) {
    pipScales.length = 0;
    for (let i = 0; i < max; i++) pipScales.push(new Animated.Value(1));
  }

  useEffect(() => {
    setText(format(value));
  }, [value]);

  function clamp(n: number) {
    return Math.min(max, Math.max(0, n));
  }

  function format(n: number) {
    const cleaned = Math.round(n * 1e6) / 1e6;
    return Number.isInteger(cleaned) ? String(cleaned) : String(Math.round(cleaned * 100) / 100);
  }

  function onChangeText(raw: string) {
    let cleaned = raw.replace(/[^0-9.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
      cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
    }
    setText(cleaned);
    const parsed = parseFloat(cleaned);
    if (!Number.isNaN(parsed)) {
      const next = clamp(parsed);
      if (next !== value) onChange(next);
    }
  }

  function commitText() {
    const parsed = parseFloat(text);
    if (Number.isNaN(parsed)) { setText(format(value)); return; }
    const next = clamp(parsed);
    onChange(next);
    setText(format(next));
  }

  function triggerCascade(upToIndex: number) {
    for (let i = 0; i <= upToIndex; i++) {
      const anim = pipScales[i];
      Animated.sequence([
        Animated.delay(i * 40),
        Animated.timing(anim, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        Animated.timing(anim, {
          toValue: 1.12,
          duration: 156,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1.0,
          duration: 104,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }

  function tapPip(index: number) {
    Haptics.selectionAsync().catch(() => {});
    const pipValue = index + 1;
    const next = Math.ceil(value) === pipValue && value === pipValue ? pipValue - 1 : pipValue;
    const clamped = clamp(next);
    onChange(clamped);
    if (clamped > 0) triggerCascade(Math.ceil(clamped) - 1);
  }

  return (
    <View style={styles.container}>
      {/* Pips row */}
      <View style={styles.pips}>
        {Array.from({ length: max }).map((_, i) => {
          const pipNumber = i + 1;
          const filled = value >= pipNumber;
          const frac = value > i && value < pipNumber ? value - i : filled ? 1 : 0;
          const isActive = frac > 0;
          return (
            <Animated.View
              key={i}
              style={[styles.pipWrap, { transform: [{ scale: pipScales[i] }] }]}
            >
              <Pressable
                onPress={() => tapPip(i)}
                style={[
                  styles.pip,
                  isActive && styles.pipActive,
                ]}
              >
                {frac > 0 && (
                  <View
                    pointerEvents="none"
                    style={[styles.pipFill, { transform: [{ scaleY: frac }] }]}
                  />
                )}
                <AppText style={[styles.pipNum, isActive && styles.pipNumActive]}>
                  {pipNumber}
                </AppText>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
      {/* Numeric input below pips */}
      <TextInput
        style={styles.valueInput}
        value={text}
        onChangeText={onChangeText}
        onBlur={commitText}
        onSubmitEditing={() => Keyboard.dismiss()}
        keyboardType="decimal-pad"
        selectTextOnFocus
        returnKeyType="done"
        placeholder="·"
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  pips: {
    flexDirection: 'row',
    gap: 6,
  },
  pipWrap: {
    width: PIP_W,
    height: PIP_H,
  },
  pip: {
    width: PIP_W,
    height: PIP_H,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  pipActive: {
    borderColor: 'rgba(244,169,55,0.5)',
    elevation: 4,
  },
  pipFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    backgroundColor: colors.amber,
    transformOrigin: 'bottom',
  },
  pipNum: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    color: colors.muted,
    position: 'relative',
    zIndex: 1,
  },
  pipNumActive: {
    color: colors.bg,
    fontFamily: fonts.monoBold,
  },
  valueInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: colors.line,
    fontFamily: fonts.monoBold,
    fontSize: 16,
    color: colors.cream,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    height: 38,
  },
});
