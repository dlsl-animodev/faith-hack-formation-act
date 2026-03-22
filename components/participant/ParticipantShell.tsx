"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFaithHackRealtime } from "@/hooks/useFaithHackRealtime";
import { usePhaseStore } from "@/store/usePhaseStore";
import { useGroupStore } from "@/store/useGroupStore";
import { useEventShellStore } from "@/store/useEventShellStore";
import type { PhaseNumber } from "@/types";
import { PhaseGroupFormation } from "@/components/phases/PhaseGroupFormation";
import { PhaseBugChecklist, type BugSelection } from "@/components/phases/PhaseBugChecklist";
import { PhaseGroupSharing } from "@/components/phases/PhaseGroupSharing";
import { PhaseDebugSubmission } from "@/components/phases/PhaseDebugSubmission";
import { PhasePuzzleViewer } from "@/components/phases/PhasePuzzleViewer";
import { PhaseCompletion } from "@/components/phases/PhaseCompletion";
import { BugsDrawer } from "@/components/participant/BugsDrawer";
import { promptForPosition } from "@/lib/sharing-prompts";

interface BootstrapGroup {
  id: string | null;
  name: string | null;
  color: string | null;
  position: number;
  memberCount: number;
  isLeader: boolean;
}

interface BootstrapPayload {
  sessionId: string;
  eventCode: string;
  phase: number;
  totalGroups: number;
  groupsSubmitted: number;
  group: BootstrapGroup;
  bugs: Array<{ id: string; label: string; is_custom: boolean }>;
  sharingPrompt: string | null;
  sharingPosition: number;
}

interface ParticipantShellProps {
  sessionId: string;
}

export function ParticipantShell({ sessionId }: ParticipantShellProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [puzzleLocked, setPuzzleLocked] = useState(false);
  const [groupsSubmitted, setGroupsSubmitted] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);

  const setPhase = usePhaseStore((s) => s.setPhase);
  const setGroup = useGroupStore((s) => s.setGroup);
  const setMemberCount = useGroupStore((s) => s.setMemberCount);
  const eventShell = useEventShellStore();

  const phase = usePhaseStore((s) => s.phase);
  const group = useGroupStore();
  const completionTitle = useEventShellStore((s) => s.completionTitle);
  const completionBody = useEventShellStore((s) => s.completionBody);

  const initialBugs: BugSelection[] = useMemo(() => {
    if (!bootstrap?.bugs) return [];
    return bootstrap.bugs.map((b) => ({
      id: b.id,
      label: b.label,
      is_custom: b.is_custom,
    }));
  }, [bootstrap]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/session/${sessionId}/bootstrap`);
      if (res.status === 410) {
        setError("This session has ended or is no longer active.");
        return;
      }
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data &&
        "success" in data &&
        (data as { success: boolean }).success &&
        "data" in data
      ) {
        const payload = (data as { data: BootstrapPayload }).data;
        setBootstrap(payload);
        setGroupsSubmitted(payload.groupsSubmitted);
        setTotalGroups(payload.totalGroups);
        setPhase((payload.phase as PhaseNumber) ?? 1);
        if (payload.group?.id && payload.group.name && payload.group.color) {
          setGroup({
            groupId: payload.group.id,
            groupName: payload.group.name,
            groupColor: payload.group.color,
            position: payload.group.position,
            memberCount: payload.group.memberCount,
            isLeader: payload.group.isLeader,
          });
        }
        return;
      }
      const err =
        typeof data === "object" &&
        data &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Failed to load";
      setError(err);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [sessionId, setGroup, setPhase]);

  useEffect(() => {
    void load();
  }, [load]);

  useFaithHackRealtime(
    {
      onPhaseChanged: (p) => {
        setPhase((p.phase as PhaseNumber) ?? 1);
      },
      onEventEnded: () => {
        eventShell.setEventEnded(true);
      },
      onParticipantCount: (c) => {
        eventShell.setParticipantCount(c.count);
      },
      onGroupSubmitted: (payload) => {
        if (typeof payload.submittedCount === "number") {
          setGroupsSubmitted(payload.submittedCount);
        }
        if (typeof payload.totalGroups === "number") {
          setTotalGroups(payload.totalGroups);
        }
        if (payload.groupId === group.groupId) {
          setPuzzleLocked(true);
        }
      },
      onGroupAssigned: (p) => {
        if (p.groupId !== group.groupId) return;
        setMemberCount(p.memberCount);
      },
      onCompletionMessage: (m) => {
        if (m.groupId != null && m.groupId !== group.groupId) return;
        eventShell.setCompletion(m.title, m.body);
      },
    },
    Boolean(bootstrap?.eventCode)
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--bg-base)] px-6 text-center font-mono text-sm text-[var(--text-secondary)]">
        <span className="animate-cursor text-[var(--accent-primary)]">loading_session</span>
      </div>
    );
  }

  if (error || !bootstrap) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-base)] px-6 text-center">
        <p className="font-display text-2xl text-[var(--accent-warm)]">Connection issue</p>
        <p className="font-body text-sm text-[var(--text-secondary)]">{error}</p>
      </div>
    );
  }

  if (eventShell.eventEnded) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-base)] px-6 text-center">
        <p className="font-display text-3xl text-[var(--text-primary)]">Session ended</p>
        <p className="font-body text-[var(--text-secondary)]">Thank you for being here.</p>
      </div>
    );
  }

  const sharingText =
    bootstrap.sharingPrompt ?? promptForPosition(bootstrap.group.position);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] px-4 pb-28 pt-10 text-[var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(124,106,247,0.06),transparent)] animate-scan" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg space-y-8">
        <header className="space-y-1">
          <p className="font-mono text-xs text-[var(--text-muted)]">
            session::{bootstrap.eventCode}
          </p>
          <p className="font-mono text-xs text-[var(--accent-primary)]">phase_{phase}</p>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            {phase === 1 && group.groupName && group.groupColor && (
              <PhaseGroupFormation
                groupName={group.groupName}
                groupColor={group.groupColor}
                memberCount={group.memberCount}
              />
            )}
            {phase === 2 && (
              <PhaseBugChecklist sessionId={sessionId} initialSelected={initialBugs} />
            )}
            {phase === 3 && (
              <PhaseGroupSharing position={bootstrap.group.position} prompt={sharingText} />
            )}
            {phase === 4 && group.groupId && (
              <PhaseDebugSubmission
                sessionId={sessionId}
                groupId={group.groupId}
                isLeader={group.isLeader}
              />
            )}
            {phase === 5 && group.groupId && group.groupName && group.groupColor && (
              <PhasePuzzleViewer
                groupName={group.groupName}
                groupColor={group.groupColor}
                groupId={group.groupId}
                submitted={groupsSubmitted}
                total={totalGroups}
                locked={puzzleLocked}
              />
            )}
            {phase === 6 && completionTitle && completionBody && (
              <PhaseCompletion title={completionTitle} body={completionBody} />
            )}
            {phase === 6 && (!completionTitle || !completionBody) && (
              <div className="space-y-4 text-center font-mono text-sm text-[var(--text-secondary)]">
                <p>Waiting for the final broadcast…</p>
                <span className="animate-cursor text-[var(--accent-primary)]">▍</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {phase !== 2 && <BugsDrawer sessionId={sessionId} initialBugs={initialBugs} />}
    </div>
  );
}
