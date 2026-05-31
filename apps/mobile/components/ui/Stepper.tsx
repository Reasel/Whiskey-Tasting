import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from './AppText';

interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
}

/** "- N +" integer control, clamped to min..max. */
export function Stepper({ value, min = 1, max = 99, onChange }: StepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const step = (delta: number) => {
    const next = clamp(value + delta);
    if (next !== value) {
      Haptics.selectionAsync().catch(() => {});
      onChange(next);
    }
  };

  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => step(-1)}
        disabled={atMin}
        style={[styles.btn, atMin && styles.btnDisabled]}
      >
        <AppText style={styles.sign}>−</AppText>
      </Pressable>
      <View style={styles.valueBox}>
        <AppText style={styles.value}>{String(value)}</AppText>
      </View>
      <Pressable
        onPress={() => step(1)}
        disabled={atMax}
        style={[styles.btn, atMax && styles.btnDisabled]}
      >
        <AppText style={styles.sign}>+</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'flex-start',
  },
  btn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.raise,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 0,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  sign: {
    fontFamily: fonts.monoBold,
    fontSize: 22,
    color: colors.amber,
  },
  valueBox: {
    minWidth: 56,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  value: {
    fontFamily: fonts.monoBold,
    fontSize: 18,
    color: colors.cream,
  },
});
