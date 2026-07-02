import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import type { FlatList } from 'react-native';

// Module-level (not component state) so the offset survives this screen
// unmounting while another route is pushed on top of it, and is available
// again the moment the screen comes back into focus. Session-only by
// design — there's no need to persist this across app restarts.
const scrollOffsets = new Map<string, number>();

interface ScrollableRef {
  scrollToOffset: (params: { offset: number; animated?: boolean }) => void;
}

/**
 * Lower-level variant for screens that already own a list ref for other
 * purposes (e.g. a FlashList ref also used for scroll-to-top), so they
 * can't use `useScrollRestoration`'s own ref. Wire `saveOffset` into the
 * list's onScroll, then call `restoreOffset(ref)` inside your own
 * `useFocusEffect` — same underlying storage as `useScrollRestoration`.
 */
export function useScrollOffsetTracking(key: string) {
  const saveOffset = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    scrollOffsets.set(key, event.nativeEvent.contentOffset.y);
  }, [key]);

  const restoreOffset = useCallback((ref: React.RefObject<ScrollableRef | null>) => {
    const saved = scrollOffsets.get(key);
    if (saved && saved > 0) {
      const timer = setTimeout(() => {
        ref.current?.scrollToOffset({ offset: saved, animated: false });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [key]);

  return { saveOffset, restoreOffset };
}

/**
 * Restores a FlatList's scroll position when the screen regains focus (e.g.
 * navigating back from a detail page), and remembers the latest position
 * while scrolling so it can be restored next time. `key` should be unique
 * per list whose position matters — e.g. the route name, or route name +
 * active tab if a screen has multiple independently-scrollable lists.
 *
 * Use this when the screen doesn't already own a list ref for other
 * purposes. If it does (e.g. also used for scroll-to-top), use
 * `useScrollOffsetTracking` instead and wire the existing ref manually.
 */
export function useScrollRestoration<T = any>(key: string) {
  const listRef = useRef<FlatList<T>>(null);
  const lastOffset = useRef(0);

  const onScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    lastOffset.current = event.nativeEvent.contentOffset.y;
    scrollOffsets.set(key, lastOffset.current);
  }, [key]);

  useFocusEffect(
    useCallback(() => {
      const saved = scrollOffsets.get(key);
      if (saved && saved > 0) {
        // Defer to the next tick so the list has laid out its content
        // before we try to scroll it (otherwise scrollToOffset is a no-op
        // on first mount).
        const timer = setTimeout(() => {
          listRef.current?.scrollToOffset({ offset: saved, animated: false });
        }, 0);
        return () => clearTimeout(timer);
      }
    }, [key])
  );

  return { listRef, onScroll };
}
