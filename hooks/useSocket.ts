"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket/client";

export function useSocketConnected(onConnect?: () => void): void {
  const done = useRef(false);
  useEffect(() => {
    const s = getSocket();
    const fn = () => {
      if (!done.current) {
        done.current = true;
        onConnect?.();
      }
    };
    s.on("connect", fn);
    if (s.connected) fn();
    return () => {
      s.off("connect", fn);
    };
  }, [onConnect]);
}
