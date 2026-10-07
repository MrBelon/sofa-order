"use client";

import { useCallback, useEffect, useState } from "react";
import { LAST_ORDER_KEY, ORDER_COOLDOWN_SECONDS } from "@/lib/constants";

function readRemaining(): number {
  const last = Number(localStorage.getItem(LAST_ORDER_KEY));
  if (!Number.isFinite(last) || last <= 0) return 0;
  return Math.max(
    0,
    Math.ceil(ORDER_COOLDOWN_SECONDS - (Date.now() - last) / 1000),
  );
}

// Visual-only cooldown; the server enforces the real one.
export function useCooldown() {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    setRemaining(readRemaining());
    const timer = setInterval(() => setRemaining(readRemaining()), 1000);
    return () => clearInterval(timer);
  }, []);

  const start = useCallback((secondsLeft = ORDER_COOLDOWN_SECONDS) => {
    localStorage.setItem(
      LAST_ORDER_KEY,
      String(Date.now() - (ORDER_COOLDOWN_SECONDS - secondsLeft) * 1000),
    );
    setRemaining(readRemaining());
  }, []);

  return { remaining, start };
}
