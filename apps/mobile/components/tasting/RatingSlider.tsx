import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, borderRadius, spacing, fontSize } from '../../lib/theme';

interface RatingSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  integer?: boolean;
}

export function RatingSlider({
  label,
  value,
  onValueChange,
  minimumValue = 1,
  maximumValue = 5,
  integer = false,
}: RatingSliderProps) {
  const [text, setText] = useState(String(value));

  // Keep the field in sync when the value changes from outside (e.g. slider,
  // loading another user's saved scores).
  useEffect(() => {
    setText(String(value));
  }, [value]);

  const clamp = (n: number) =>
    Math.min(maximumValue, Math.max(minimumValue, n));

  const commitText = () => {
    const parsed = integer ? parseInt(text, 10) : parseFloat(text);
    if (Number.isNaN(parsed)) {
      setText(String(value));
      return;
    }
    const next = clamp(parsed);
    onValueChange(next);
    setText(String(next));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.valueInput}
          value={text}
          onChangeText={setText}
          onBlur={commitText}
          onSubmitEditing={commitText}
          keyboardType={integer ? 'number-pad' : 'decimal-pad'}
          selectTextOnFocus
          returnKeyType="done"
        />
      </View>
      <Slider
        style={styles.slider}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={integer ? 1 : 0.1}
        value={value}
        onValueChange={(v) => onValueChange(integer ? Math.round(v) : v)}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.surfaceLight}
        thumbTintColor={colors.primary}
      />
      <View style={styles.labels}>
        <Text style={styles.rangeLabel}>{minimumValue}</Text>
        <Text style={styles.rangeLabel}>{maximumValue}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  valueInput: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 72,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
