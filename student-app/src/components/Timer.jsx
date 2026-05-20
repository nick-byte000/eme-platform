'use client';
import { useEffect, useRef, useState } from 'react';

export default function Timer({ running, onTick }) {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    setSeconds(0);
  }, [running]);

  useEffect(() => {
    if (!running) {
      clearInterval(ref.current);
      return;
    }
    ref.current = setInterval(() => {
      setSeconds(s => {
        const next = s + 1;
        onTick?.(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <span className={`timer ${seconds > 120 ? 'warning' : ''}`}>
      {display}
    </span>
  );
}
