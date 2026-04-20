import { useEffect, useRef, useState } from "react";

/** Smoothly animates from the previous value to `target` on every change. */
export function useAnimatedValue(target: number, duration = 650) {
  const [value, setValue] = useState(target);
  const prev = useRef(target);
  const raf  = useRef<number>();

  useEffect(() => {
    const from = prev.current;
    if (from === target) return;

    const t0   = performance.now();
    const tick = (now: number) => {
      const p    = Math.min((now - t0) / duration, 1);
      const ease = 1 - (1 - p) ** 3;          // cubic ease-out
      setValue(from + (target - from) * ease);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else        prev.current = target;
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current!);
  }, [target, duration]);

  return value;
}

/**
 * Renders a number that smoothly counts to its new value whenever it changes.
 * Pass a `format` function to control how the number is displayed.
 */
export function AnimatedNumber({
  value,
  format,
  duration,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const n = useAnimatedValue(value, duration);
  return <>{format(n)}</>;
}
