"use client";

import { useEffect, useState } from "react";

export default function FooterYear() {
  const [year, setYear] = useState<number | null>(null);

  // The year is a client-only value (new Date() inside a prerendered render
  // would break the static shell), so it is read after mount — via the timer
  // callback, matching React's "sync from the external system in a callback"
  // pattern rather than setting state synchronously in the effect body.
  useEffect(() => {
    const timer = window.setTimeout(
      () => setYear(new Date().getFullYear()),
      0
    );

    return () => window.clearTimeout(timer);
  }, []);

  if (year === null) {
    return null;
  }

  return <>{year}</>;
}
