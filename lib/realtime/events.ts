export const SOCKET_EVENTS = {
  // Server → Client (Supabase Realtime Broadcast)
  SESSION_JOINED: "session:joined",
  GROUP_ASSIGNED: "group:assigned",
  PHASE_CHANGED: "phase:changed",
  GROUP_SUBMITTED: "group:submitted",
  ALL_GROUPS_SUBMITTED: "groups:allSubmitted",
  COMPLETION_MESSAGE: "completion:message",
  PUZZLE_PIECE_LOCKED: "puzzle:pieceLocked",
  EVENT_STARTED: "event:started",
  EVENT_ENDED: "event:ended",
  PARTICIPANT_COUNT: "event:participantCount",

  // Legacy names (use HTTP APIs instead)
  JOIN_SESSION: "session:join",
  SUBMIT_DEBUG: "submit:debug",
  ADMIN_ADVANCE_PHASE: "admin:advancePhase",
  ADMIN_END_SHARING: "admin:endSharing",
} as const;

export type SocketEventName =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
