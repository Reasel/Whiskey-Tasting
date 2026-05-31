import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AccessibilityInfo,
  Modal,
  View,
  StyleSheet,
} from 'react-native';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from './AppText';
import { Eyebrow } from './Eyebrow';
import { Button } from './Button';
import { PodiumGlass } from './PodiumGlass';

interface CelebrateOverlayProps {
  visible: boolean;
  userName: string;
  themeName: string;
  onSeeResults: () => void;
  onHome: () => void;
}

/** Post-submit celebration. Modal scrim + slide/fade card + filling glass,
 *  lifecycle modeled on Toast. Reduce-motion snaps the card in. */
export function CelebrateOverlay({
  visible,
  userName,
  themeName,
  onSeeResults,
  onHome,
}: CelebrateOverlayProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  // Keep the Modal mounted through the exit; gate render on internal state.
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((rm) => {
      if (active) setReduceMotion(rm);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (reduceMotion) {
        fade.setValue(1);
        slide.setValue(0);
        return;
      }
      fade.setValue(0);
      slide.setValue(40);
      Animated.sequence([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      if (reduceMotion) {
        setMounted(false);
        return;
      }
      Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }).start(
        () => setMounted(false),
      );
    }
  }, [visible, reduceMotion, fade, slide, mounted]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onHome}>
      <Animated.View style={[styles.scrim, { opacity: fade }]}>
        <Animated.View
          style={[
            styles.card,
            { opacity: fade, transform: [{ translateY: slide }] },
          ]}
        >
          <View style={styles.glass}>
            <PodiumGlass place={1} fillPct={82} animate={!reduceMotion} />
          </View>
          <Eyebrow>LOGGED</Eyebrow>
          <AppText variant="sectionTitle" style={styles.headline} numberOfLines={2}>
            Cheers, {userName}.
          </AppText>
          <AppText style={styles.sub}>
            Your scores for {themeName} are in.
          </AppText>
          <View style={styles.actions}>
            <Button title="SEE THE RESULTS" onPress={onSeeResults} block />
            <Button title="← HOME" onPress={onHome} variant="ghost" block />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(10,8,5,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 0,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.smd,
  },
  glass: {
    marginBottom: spacing.sm,
  },
  headline: {
    textAlign: 'center',
  },
  sub: {
    fontFamily: fonts.monoRegular,
    fontSize: 13,
    color: colors.dim,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.smd,
  },
});
