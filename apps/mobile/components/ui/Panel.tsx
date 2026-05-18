import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from './AppText';
import { Eyebrow } from './Eyebrow';
import { HardShadow } from './HardShadow';

interface PanelProps {
  children: React.ReactNode;
  title?: string;
  eyebrow?: string;
  style?: StyleProp<ViewStyle>;
}

/** A bordered section block (cream fill, hard panel shadow). Full width
 *  on phone — NOT a centered max-width box. Optional header sub-block. */
export function Panel({ children, title, eyebrow, style }: PanelProps) {
  return (
    <HardShadow offset="panel" style={style}>
      <View style={styles.panel}>
        {(title || eyebrow) && (
          <View style={styles.header}>
            {title ? (
              <AppText variant="sectionTitle">{title}</AppText>
            ) : null}
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          </View>
        )}
        <View style={styles.body}>{children}</View>
      </View>
    </HardShadow>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.canvasCream,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.inkBlack,
  },
  header: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkBlack,
    gap: spacing.xs,
  },
  body: { padding: spacing.xl },
});
