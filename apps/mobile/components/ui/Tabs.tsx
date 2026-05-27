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

/** Square segmented control. Active = amber fill + white mono label;
 *  inactive = panel-grey + steel-grey. Instant swap, no animation. */
export function Tabs({ options, value, onChange, style }: TabsProps) {
  return (
    <View style={[styles.tabs, style]}>
      {options.map((opt, i) => {
        const active = String(opt.value) === String(value);
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            style={[
              styles.tab,
              i > 0 && styles.tabDivider,
              { backgroundColor: active ? colors.whiskeyAmber : colors.panelGrey },
            ]}
          >
            <AppText
              variant="buttonLabel"
              style={{ color: active ? colors.cardWhite : colors.steelGrey }}
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
        trackColor={{ true: colors.whiskeyAmber, false: colors.lightGrey }}
        thumbColor={colors.cardWhite}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.inkBlack,
    borderRadius: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.smd,
  },
  tabDivider: { borderLeftWidth: 1, borderLeftColor: colors.inkBlack },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.inkBlack,
    padding: spacing.md,
  },
});
