import React from 'react';
import { type TextProps } from 'react-native';
import { AppText } from './AppText';

/** Mono uppercase caption auto-prefixed with `// `. Idempotent. */
export function Eyebrow({ children, style, ...rest }: TextProps) {
  const raw = String(children ?? '').trim();
  const text = raw.startsWith('//') ? raw : `// ${raw}`;
  return (
    <AppText variant="eyebrow" style={style} {...rest}>
      {text}
    </AppText>
  );
}
