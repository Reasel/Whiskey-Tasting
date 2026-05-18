import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, spacing } from '../../lib/theme';
import { AppText } from '../ui/AppText';

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
    setText(format(value));
  }, [value]);

  const clamp = (n: number) =>
    Math.min(maximumValue, Math.max(minimumValue, n));

  // Display formatting: strip IEEE float noise from slider drag (e.g.
  // 3.2000000000000002) while preserving real user-typed precision.
  const format = (n: number) =>
    integer ? String(n) : String(Math.round(n * 1e6) / 1e6);

  const commitText = () => {
    const parsed = integer ? parseInt(text, 10) : parseFloat(text);
    if (Number.isNaN(parsed)) {
      setText(format(value));
      return;
    }
    const next = clamp(parsed);
    onValueChange(next);
    setText(format(next));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="fieldLabel">{label}</AppText>
        <TextInput
          style={styles.valueInput}
          value={text}
          onChangeText={setText}
          onBlur={commitText}
          onSubmitEditing={() => Keyboard.dismiss()}
          keyboardType={integer ? 'number-pad' : 'decimal-pad'}
          selectTextOnFocus
          returnKeyType="done"
        />
      </View>
      <Slider
        style={styles.slider}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={integer ? 1 : 0.5}
        value={value}
        onValueChange={(v) => onValueChange(integer ? Math.round(v) : v)}
        minimumTrackTintColor={colors.whiskeyAmber}
        maximumTrackTintColor={colors.lightGrey}
        thumbTintColor={colors.whiskeyAmber}
      />
      <View style={styles.labels}>
        <AppText variant="tableCell">{minimumValue}</AppText>
        <AppText variant="tableCell">{maximumValue}</AppText>
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
  valueInput: {
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.inkBlack,
    borderRadius: 0,
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 18,
    color: colors.inkBlack,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 72,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
