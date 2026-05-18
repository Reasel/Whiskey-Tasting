import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../lib/theme';
import { AppText } from './AppText';
import { HardShadow } from './HardShadow';

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
  const valueKey = value == null ? null : String(value);
  const selected = options.find((o) => String(o.value) === valueKey);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <AppText variant="fieldLabel" style={styles.label}>{label}</AppText>}
      <HardShadow offset="card">
        <TouchableOpacity
          style={styles.control}
          activeOpacity={0.7}
          onPress={() => setOpen(true)}
        >
          <AppText variant="body" style={selected ? styles.valueText : styles.placeholderText}>
            {selected ? selected.label : placeholder}
          </AppText>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </HardShadow>

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
              {options.length === 0 ? (
                <View style={styles.empty}>
                  <AppText variant="body" style={styles.emptyText}>No options</AppText>
                </View>
              ) : (
                options.map((opt, index) => {
                  const isActive = String(opt.value) === valueKey;
                  const isLast = index === options.length - 1;
                  return (
                    <TouchableOpacity
                      key={String(opt.value)}
                      style={[
                        styles.option,
                        isLast && styles.optionLast,
                        isActive && styles.optionActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                    >
                      <AppText
                        variant="body"
                        style={[
                          styles.optionText,
                          isActive && styles.optionTextActive,
                        ]}
                      >
                        {opt.label}
                      </AppText>
                      {isActive && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.cardWhite}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
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
    marginBottom: spacing.xs,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.inkBlack,
    borderRadius: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  valueText: {
    color: colors.inkBlack,
  },
  placeholderText: {
    color: colors.mutedText,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.cardWhite,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.inkBlack,
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
    borderBottomColor: colors.lightGrey,
    backgroundColor: colors.cardWhite,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionActive: {
    backgroundColor: colors.whiskeyAmber,
  },
  optionText: {
    color: colors.inkBlack,
  },
  optionTextActive: {
    color: colors.cardWhite,
    fontWeight: '700',
  },
  empty: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.mutedText,
  },
});
