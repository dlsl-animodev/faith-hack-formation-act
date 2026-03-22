"use client";

import { useGroupStore } from "@/store/useGroupStore";

export function useGroup() {
  const group = useGroupStore();
  return group;
}
