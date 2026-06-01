import React from 'react';
import {
  View,
  Pressable,
  Switch,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from './AppText';

interface TabsProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

/** Square segmented control. Active = amber fill + dark mono label;
 *  inactive = raise fill + dim label. Instant swap, no animation.
 *  4+ options automatically wrap into a 2-column grid. */
export function Tabs({ options, value, onChange, style }: TabsProps) {
  const wrap = options.length >= 4;
  const cols = wrap ? 2 : options.length;
  return (
    <View style={[styles.tabs, wrap && styles.tabsWrap, style]}>
      {options.map((opt, i) => {
        const active = String(opt.value) === String(value);
        const col = i % cols;
        const row = Math.floor(i / cols);
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            style={[
              styles.tab,
              wrap ? { width: `${100 / cols}%` as unknown as number } : { flex: 1 },
              col > 0 && styles.tabBorderLeft,
              row > 0 && styles.tabBorderTop,
              { backgroundColor: active ? colors.amber : colors.raise },
            ]}
          >
            <AppText
              variant="buttonLabel"
              style={{ color: active ? colors.bg : colors.dim }}
            >
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

export function ToggleRow({ label, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <AppText variant="fieldLabel">{label}</AppText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.amber, false: colors.line }}
        thumbColor={colors.cream}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabsWrap: { flexWrap: 'wrap' },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  tabBorderLeft: { borderLeftWidth: 1, borderLeftColor: colors.line },
  tabBorderTop: { borderTopWidth: 1, borderTopColor: colors.line },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
});
