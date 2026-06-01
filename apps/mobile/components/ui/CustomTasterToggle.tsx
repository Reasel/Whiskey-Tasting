import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from './AppText';

interface CustomTasterToggleProps {
  custom: boolean;
  onToggle: () => void;
}

/** Mono toggle: label is the mode you switch INTO. List mode shows "CUSTOM",
 *  custom mode shows "LIST". Parent swaps Dropdown <-> name Input. */
export function CustomTasterToggle({ custom, onToggle }: CustomTasterToggleProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onToggle();
      }}
      style={[styles.btn, custom && styles.btnActive]}
    >
      <AppText style={[styles.label, { color: custom ? colors.amber : colors.dim }]}>
        {custom ? 'LIST' : 'CUSTOM'}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.raise,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 0,
  },
  btnActive: {
    borderColor: colors.amber,
  },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
