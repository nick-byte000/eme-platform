'use client';
import { useEffect, useState } from 'react';

export default function PointsBadge({ points, triggerKey }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!points) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1600);
    return () => clearTimeout(t);
  }, [triggerKey]);

  if (!visible || !points) return null;

  return (
    <div className="points-pop">
      +{points} pts
    </div>
  );
}
