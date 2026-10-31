"use client";

import { useEffect, useState } from "react";

type Recharts = typeof import("recharts");

let loaded: Recharts | null = null;

export function useRecharts(): Recharts | null {
  const [recharts, setRecharts] = useState<Recharts | null>(loaded);

  useEffect(() => {
    if (loaded) return;
    let active = true;

    async function load() {
      try {
        loaded = await import("recharts");
        if (active) setRecharts(loaded);
      } catch {
        // Chart stays on its skeleton if the chunk fails to load.
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return recharts;
}
