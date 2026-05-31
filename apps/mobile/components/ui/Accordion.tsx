import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AccessibilityInfo,
  View,
  Pressable,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../lib/theme';

interface AccordionProps {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/** Header row + rotating chevron + animated-height body. Body height is
 *  measured via onLayout. Reduce-motion toggles instantly. */
export function Accordion({ header, children, defaultOpen = false }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const anim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current; // 0 closed, 1 open

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((rm) => {
      if (mounted) setReduceMotion(rm);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (reduceMotion) {
      anim.setValue(next ? 1 : 0);
      return;
    }
    Animated.timing(anim, {
      toValue: next ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== contentHeight) setContentHeight(h);
  };

  const bodyHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.wrap}>
      <Pressable onPress={toggle} style={styles.header}>
        <View style={styles.headerContent}>{header}</View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={18} color={colors.amber} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.bodyClip, { height: bodyHeight }]}>
        {/* Absolutely positioned measurer so the clipped wrapper can size to it */}
        <View style={styles.measurer} onLayout={onContentLayout}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.smd,
    gap: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  bodyClip: {
    overflow: 'hidden',
  },
  measurer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
});
