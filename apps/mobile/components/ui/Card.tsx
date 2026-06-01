import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from './AppText';
import { HardShadow } from './HardShadow';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, title, onPress, style }: CardProps) {
  const inner = (
    <View style={[styles.card, style]}>
      {title ? (
        <AppText variant="sectionTitle" style={styles.title}>
          {title}
        </AppText>
      ) : null}
      {children}
    </View>
  );

  const content = <HardShadow offset="cardSoft">{inner}</HardShadow>;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderRadius: 0,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: { marginBottom: spacing.md },
});
