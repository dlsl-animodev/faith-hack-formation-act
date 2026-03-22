"use client";

import { create } from "zustand";

export interface GroupState {
  groupId: string | null;
  groupName: string | null;
  groupColor: string | null;
  position: number;
  memberCount: number;
  isLeader: boolean;
  setGroup: (payload: {
    groupId: string;
    groupName: string;
    groupColor: string;
    position: number;
    memberCount: number;
    isLeader: boolean;
  }) => void;
  setMemberCount: (n: number) => void;
  reset: () => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  groupId: null,
  groupName: null,
  groupColor: null,
  position: 1,
  memberCount: 0,
  isLeader: false,
  setGroup: (payload) =>
    set({
      groupId: payload.groupId,
      groupName: payload.groupName,
      groupColor: payload.groupColor,
      position: payload.position,
      memberCount: payload.memberCount,
      isLeader: payload.isLeader,
    }),
  setMemberCount: (memberCount) => set({ memberCount }),
  reset: () =>
    set({
      groupId: null,
      groupName: null,
      groupColor: null,
      position: 1,
      memberCount: 0,
      isLeader: false,
    }),
}));
