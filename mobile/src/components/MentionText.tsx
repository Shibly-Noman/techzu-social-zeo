import React, { forwardRef } from 'react';
import { Text, type NativeSyntheticEvent, type StyleProp, type TextLayoutEventData, type TextStyle } from 'react-native';
import { useTheme } from '../theme';

const MENTION_TOKEN = /^@[a-zA-Z0-9_]{3,20}$/;
const MENTION_SPLIT = /(@[a-zA-Z0-9_]{3,20})/g;

interface Props {
  text: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  onTextLayout?: (e: NativeSyntheticEvent<TextLayoutEventData>) => void;
}

/** Renders text with `@username` tokens highlighted. Non-interactive — no profile screen to link to. */
export const MentionText = forwardRef<Text, Props>(function MentionText(
  { text, style, numberOfLines, onTextLayout },
  ref
) {
  const { colors } = useTheme();
  const parts = text.split(MENTION_SPLIT);

  return (
    <Text ref={ref} style={style} numberOfLines={numberOfLines} onTextLayout={onTextLayout}>
      {parts.map((part, i) =>
        MENTION_TOKEN.test(part) ? (
          <Text key={i} style={{ color: colors.primary, fontWeight: '700' }}>
            {part}
          </Text>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </Text>
  );
});
