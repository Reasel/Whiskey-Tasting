import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from './AppText';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <AppText variant="fieldLabel" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.mutedText}
        {...props}
      />
      {error ? (
        <AppText variant="fieldLabel" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, marginBottom: spacing.md },
  label: {},
  input: {
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.inkBlack,
    borderRadius: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smd,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.inkBlack,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.alertRed,
  },
  errorText: {
    color: colors.alertRed,
  },
});
