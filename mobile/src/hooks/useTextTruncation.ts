import { useLayoutEffect, useRef, useState } from 'react';
import { Platform, type NativeSyntheticEvent, type Text, type TextLayoutEventData } from 'react-native';

const isWeb = Platform.OS === 'web';

/**
 * Facebook-style "See more" truncation, shared between post and comment text.
 *
 * react-native-web's `Text` never fires `onTextLayout`, so on web we detect
 * clamping the DOM way instead: compare `scrollHeight` (full content) against
 * `clientHeight` (visible, clamped via `numberOfLines`'s CSS `-webkit-line-clamp`).
 * On native, `onTextLayout` gives the true line count directly.
 */
export function useTextTruncation(text: string, maxLines: number) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [measured, setMeasured] = useState(false);
  const textRef = useRef<Text | null>(null);

  useLayoutEffect(() => {
    if (!isWeb || measured) return;
    const node = textRef.current as unknown as HTMLElement | null;
    if (node && typeof node.scrollHeight === 'number') {
      setCanExpand(node.scrollHeight - node.clientHeight > 1);
      setMeasured(true);
    }
  }, [measured, text]);

  function handleNativeLayout(e: NativeSyntheticEvent<TextLayoutEventData>) {
    setCanExpand(e.nativeEvent.lines.length > maxLines);
    setMeasured(true);
  }

  return {
    expanded,
    setExpanded,
    canExpand,
    measured,
    textRef,
    handleNativeLayout,
    isWeb,
    numberOfLines: expanded ? undefined : maxLines,
  };
}
