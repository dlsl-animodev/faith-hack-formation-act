export type PhaseNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface EventRow {
  id: string;
  event_code: string;
  is_active: boolean;
  ended_at: string | null;
  summary: EventSummary | null;
  created_at: string;
  updated_at: string;
}

export interface EventSummaryGroup {
  name: string;
  color: string;
  memberCount: number;
  debugSummary: string;
  completionMessage: string;
}

export interface EventSummary {
  totalParticipants: number;
  totalGroups: number;
  groups: EventSummaryGroup[];
}

export interface GroupRow {
  id: string;
  event_id: string;
  name: string;
  color: string;
  submitted: boolean;
  debug_summary: string | null;
  completion_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  id: string;
  event_id: string;
  display_name: string | null;
  group_id: string | null;
  is_leader: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface BugRow {
  id: string;
  session_id: string;
  label: string;
  is_custom: boolean;
  created_at: string;
}

export interface AppStateRow {
  id: number;
  current_phase: number;
  total_groups: number;
  groups_submitted: number;
  active_event_code: string | null;
  updated_at: string;
}

export interface SharingPromptRow {
  id: string;
  session_id: string;
  group_id: string;
  position: number;
  prompt_text: string;
  created_at: string;
}

export interface PuzzlePiece {
  id: string;
  groupIndex: number;
  groupId: string | null;
  groupName: string | null;
  groupColor: string | null;
  col: number;
  row: number;
  locked: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface JoinSessionResult {
  sessionId: string;
  groupId: string;
  groupName: string;
  groupColor: string;
  position: number;
  memberCount: number;
}

export interface CreateEventResult {
  eventId: string;
  eventCode: string;
  joinUrl: string;
}

export interface ValidateEventResult {
  valid: boolean;
  eventId?: string;
}

export interface SocketSessionPayload {
  sessionId: string;
  eventCode: string;
}

export interface SocketGroupAssignedPayload {
  groupId: string;
  groupName: string;
  groupColor: string;
  position: number;
  memberCount: number;
}

export interface SocketPhaseChangedPayload {
  phase: PhaseNumber;
}

export interface SocketGroupSubmittedPayload {
  groupId: string;
  groupName: string;
  groupColor: string;
  groupIndex: number;
  cols: number;
  rows: number;
  completionMessage: string;
}

export interface SocketEventStartedPayload {
  eventId: string;
  eventCode: string;
  joinUrl: string;
}

export interface SocketCompletionMessagePayload {
  groupId: string;
  title: string;
  body: string;
}

export interface SocketPuzzlePieceLockedPayload {
  groupId: string;
  groupIndex: number;
  cols: number;
  rows: number;
}
