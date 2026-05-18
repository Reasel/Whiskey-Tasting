import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSize } from '../../lib/theme';

export interface DropdownOption {
  label: string;
  value: number | string;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  value: number | string | null;
  options: DropdownOption[];
  onChange: (value: number | string) => void;
  containerStyle?: ViewStyle;
}

export function Dropdown({
  label,
  placeholder = 'Select...',
  value,
  options,
  onChange,
  containerStyle,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.control}
        activeOpacity={0.7}
        onPress={() => setOpen(true)}
      >
        <Text style={selected ? styles.valueText : styles.placeholderText}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            <ScrollView>
              {options.map((opt) => {
                const isActive = opt.value === value;
                return (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[styles.option, isActive && styles.optionActive]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isActive && styles.optionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isActive && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  valueText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionActive: {
    backgroundColor: colors.surfaceLight,
  },
  optionText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
