import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the user has requested reduced motion (OS-level setting on
 * iOS/Android, `prefers-reduced-motion: reduce` on web — react-native-web
 * maps AccessibilityInfo.isReduceMotionEnabled() to that media query).
 *
 * Non-essential entrance/ambient animations (scale-in, pulsing orbs, slide
 * transitions) should check this and skip straight to the end state when
 * true. Functional motion that conveys information (e.g. a loading
 * spinner) does not need to respect this.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => { if (mounted) setReduced(value); })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      value => setReduced(value),
    );

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return reduced;
}
