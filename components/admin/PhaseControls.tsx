"use client";

import { useCallback } from "react";
import { getSocket } from "@/lib/socket/client";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import { Button } from "@/components/ui/Button";

interface PhaseControlsProps {
  adminSecret: string;
}

export function PhaseControls({ adminSecret }: PhaseControlsProps) {
  const emit = useCallback(
    (event: string) => {
      const socket = getSocket({ adminSecret });
      socket.emit(event);
    },
    [adminSecret]
  );

  return (
    <div className="flex flex-wrap gap-3">
      <Button type="button" variant="ghost" onClick={() => emit(SOCKET_EVENTS.ADMIN_ADVANCE_PHASE)}>
        Advance phase
      </Button>
      <Button type="button" variant="warm" onClick={() => emit(SOCKET_EVENTS.ADMIN_END_SHARING)}>
        End sharing → Phase 4
      </Button>
    </div>
  );
}
