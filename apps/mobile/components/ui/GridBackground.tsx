import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';

/** Amber-tinted 40px grid, absolutely filling its parent, behind content.
 *  Used on Home only. Parent must be `position: relative`. */
export function GridBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern
          id="wt-grid"
          width={40}
          height={40}
          patternUnits="userSpaceOnUse"
        >
          <Path
            d="M40 0 H0 V40"
            fill="none"
            stroke="rgba(245,158,11,0.12)"
            strokeWidth={1}
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#wt-grid)" />
    </Svg>
  );
}
