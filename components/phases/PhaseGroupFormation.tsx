"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";

interface PhaseGroupFormationProps {
  groupName: string;
  groupColor: string;
  memberCount: number;
}

export function PhaseGroupFormation({
  groupName,
  groupColor,
  memberCount,
}: PhaseGroupFormationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      <header className="space-y-2">
        <p className="font-mono text-xs text-[var(--text-muted)]">phase_01 // formation</p>
        <h1 className="font-display text-3xl tracking-tight text-[var(--text-primary)]">
          You&apos;re assigned
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Find your teammates — look for badges in{" "}
          <span className="text-[var(--accent-warm)]" style={{ color: groupColor }}>
            this color
          </span>
          .
        </p>
      </header>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 24 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Tag label={groupName} color={groupColor} />
              <span className="font-mono text-xs text-[var(--text-muted)]">
                members_online: {memberCount}
              </span>
            </div>
            <div
              className="h-2 w-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${groupColor}55, ${groupColor})`,
              }}
            />
            <p className="font-body text-sm text-[var(--text-secondary)]">
              When the facilitator advances the room, you&apos;ll move into private reflection.
            </p>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
