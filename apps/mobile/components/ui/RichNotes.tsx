import React from 'react';
import { Text, Image, View, Pressable, Linking, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../lib/theme';
import type { TypoVariant } from '../../lib/theme';
import type { TextStyle, ViewStyle } from 'react-native';

const URL_RE = /(https?:\/\/[^\s<>"']+)/g;
const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp)(\?[^\s]*)?$/i;

type Seg =
  | { kind: 'text'; text: string }
  | { kind: 'link'; url: string }
  | { kind: 'image'; url: string };

function parse(raw: string): Seg[] {
  const segs: Seg[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(raw)) !== null) {
    if (m.index > last) segs.push({ kind: 'text', text: raw.slice(last, m.index) });
    const url = m[1];
    segs.push(IMAGE_EXT_RE.test(url.split('?')[0]) ? { kind: 'image', url } : { kind: 'link', url });
    last = m.index + m[0].length;
  }
  if (last < raw.length) segs.push({ kind: 'text', text: raw.slice(last) });
  return segs;
}

interface RichNotesProps {
  text: string;
  variant?: TypoVariant;
  /** Applied to the outer container View (margins, padding). */
  style?: ViewStyle;
  /** Applied to inline text spans (color overrides). */
  textStyle?: TextStyle;
}

/** Renders theme notes with clickable links and inline images.
 *  Image URLs (.jpg/.png/.gif/.webp) display as a tappable inline image.
 *  Other URLs display as amber underlined text that opens in the browser. */
export function RichNotes({ text, variant = 'body', style, textStyle }: RichNotesProps) {
  const segs = parse(text);

  // Group consecutive text/link segs into inline runs; images break out as blocks.
  const blocks: Array<{ type: 'inline'; segs: Seg[] } | { type: 'image'; url: string }> = [];
  let run: Seg[] = [];
  for (const seg of segs) {
    if (seg.kind === 'image') {
      if (run.length) {
        blocks.push({ type: 'inline', segs: run });
        run = [];
      }
      blocks.push({ type: 'image', url: seg.url });
    } else {
      run.push(seg);
    }
  }
  if (run.length) blocks.push({ type: 'inline', segs: run });

  return (
    <View style={style}>
      {blocks.map((block, i) => {
        if (block.type === 'image') {
          return (
            <Pressable key={i} onPress={() => Linking.openURL(block.url).catch(() => {})}>
              <Image source={{ uri: block.url }} style={styles.img} resizeMode="contain" />
            </Pressable>
          );
        }
        return (
          <Text key={i} style={[typography[variant], textStyle]}>
            {block.segs.map((seg, j) =>
              seg.kind === 'link' ? (
                <Text
                  key={j}
                  style={styles.link}
                  onPress={() => Linking.openURL(seg.url).catch(() => {})}
                >
                  {seg.url}
                </Text>
              ) : seg.kind === 'text' ? (
                seg.text
              ) : null
            )}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    color: colors.amber,
    textDecorationLine: 'underline',
  },
  img: {
    width: '100%',
    height: 200,
    marginVertical: spacing.sm,
    backgroundColor: colors.raise,
  },
});
