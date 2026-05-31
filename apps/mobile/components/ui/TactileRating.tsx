import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fonts } from '../../lib/theme';

interface TactileRatingProps {
  value: number;
  onChange: (n: number) => void;
  max?: number;
}

/** Tap-to-fill pip rating with a fractional last-pip fill plus an exact-decimal
 *  TextInput. Clamp/format/commit logic mirrors the old RatingSlider so saved
 *  scores load and reformat identically. Min is 0 (unscored allowed); the
 *  submit flow clamps to 1..max. */
export function TactileRating({ value, onChange, max = 5 }: TactileRatingProps) {
  const [text, setText] = useState(() => format(value));

  // Sync the field when value changes from outside (pip tap, loading saved
  // scores, theme switch rebuild).
  useEffect(() => {
    setText(format(value));
  }, [value]);

  function clamp(n: number) {
    return Math.min(max, Math.max(0, n));
  }

  // Strip IEEE float noise (e.g. 3.2000000000000002) while keeping real typed
  // precision, then cap at 2 decimal places for display.
  function format(n: number) {
    const cleaned = Math.round(n * 1e6) / 1e6;
    return Number.isInteger(cleaned) ? String(cleaned) : String(Math.round(cleaned * 100) / 100);
  }

  // Accept digits plus a single dot only.
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
    if (Number.isNaN(parsed)) {
      setText(format(value));
      return;
    }
    const next = clamp(parsed);
    onChange(next);
    setText(format(next));
  }

  function tapPip(index: number) {
    Haptics.selectionAsync().catch(() => {});
    const pipValue = index + 1; // pips are 1..max
    // Tapping the current integer value clears to one below.
    const next = Math.ceil(value) === pipValue && value === pipValue ? pipValue - 1 : pipValue;
    onChange(clamp(next));
  }

  return (
    <View style={styles.container}>
      <View style={styles.pips}>
        {Array.from({ length: max }).map((_, i) => {
          const pipNumber = i + 1;
          const filled = value >= pipNumber;
          const frac = value > i && value < pipNumber ? value - i : filled ? 1 : 0;
          return (
            <Pressable
              key={i}
              onPress={() => tapPip(i)}
              style={({ pressed }) => [styles.pip, pressed && styles.pipPressed]}
            >
              {frac > 0 && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.pipFill,
                    { transform: [{ scaleY: frac }] },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>
      <TextInput
        style={styles.valueInput}
        value={text}
        onChangeText={onChangeText}
        onBlur={commitText}
        onSubmitEditing={() => Keyboard.dismiss()}
        keyboardType="decimal-pad"
        selectTextOnFocus
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
  },
  pips: {
    flexDirection: 'row',
    flex: 1,
    gap: spacing.sm,
  },
  pip: {
    flex: 1,
    height: 40,
    backgroundColor: colors.raise,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 0,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  pipPressed: {
    borderColor: colors.amber,
  },
  pipFill: {
    height: '100%',
    backgroundColor: colors.amber,
    transformOrigin: 'bottom',
  },
  valueInput: {
    backgroundColor: colors.raise,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 0,
    fontFamily: fonts.monoBold,
    fontSize: 18,
    color: colors.cream,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 72,
  },
});
