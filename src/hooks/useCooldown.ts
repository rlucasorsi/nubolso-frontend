import { useEffect, useState } from 'react';

export function useCooldown(seconds: number) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining]);

  return {
    remaining,
    isActive: remaining > 0,
    start: () => setRemaining(seconds),
  };
}
