import { useEffect, useState, type ReactNode } from "react";

interface TypewriterProps {
  text: string;
  speed?: number;
  startDelay?: number;
  caret?: boolean;
  onDone?: () => void;
  className?: string;
  suffix?: ReactNode;
}

export function Typewriter({
  text,
  speed = 32,
  startDelay = 0,
  caret = true,
  onDone,
  className = "",
  suffix,
}: TypewriterProps) {
  const [i, setI] = useState(0);
  const [started, setStarted] = useState(startDelay === 0);

  useEffect(() => {
    if (startDelay === 0) return;
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    if (i >= text.length) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setI((v) => v + 1), speed);
    return () => clearTimeout(t);
  }, [i, started, text, speed, onDone]);

  const done = i >= text.length;
  return (
    <span className={className}>
      {text.slice(0, i)}
      {done && suffix}
      {caret && <span className="numu-caret" aria-hidden />}
    </span>
  );
}

interface CountUpProps {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  startDelay?: number;
}

export function CountUp({
  to,
  duration = 1400,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  startDelay = 0,
}: CountUpProps) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const timer = setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min(1, (ts - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(to * eased);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, startDelay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [to, duration, startDelay]);
  return (
    <span className={className}>
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}