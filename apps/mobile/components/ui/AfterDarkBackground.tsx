import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { colors } from '../../lib/theme';

/**
 * Full-bleed candlelight backdrop for every After Dark screen. A solid
 * near-black fill plus two large amber radial-gradient haze layers
 * (top-center and bottom-right). Absolutely fills its parent (parent must
 * be `position: relative`). Never intercepts touches.
 */
export function AfterDarkBackground() {
  const { width, height } = useWindowDimensions();
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      width={width}
      height={height}
    >
      <Defs>
        <RadialGradient
          id="ad-haze-top"
          cx={width * 0.5}
          cy={height * 0.08}
          rx={width * 0.9}
          ry={height * 0.45}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.amber} stopOpacity={0.14} />
          <Stop offset="1" stopColor={colors.amber} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient
          id="ad-haze-br"
          cx={width * 0.92}
          cy={height * 0.92}
          rx={width * 0.8}
          ry={height * 0.5}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.ember} stopOpacity={0.1} />
          <Stop offset="1" stopColor={colors.ember} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={colors.bg} />
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="url(#ad-haze-top)"
      />
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="url(#ad-haze-br)"
      />
    </Svg>
  );
}
