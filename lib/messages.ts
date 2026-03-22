export interface CompletionMessage {
  title: string;
  body: string;
}

export const COMPLETION_MESSAGES: CompletionMessage[] = [
  {
    title: "All systems restored.",
    body: "Your bugs have been acknowledged, your debug submitted. The system doesn't just run — it runs with purpose now.",
  },
  {
    title: "Deploy successful.",
    body: "What you surrendered in the debug is now live in grace. The build passed; walk in that peace.",
  },
  {
    title: "Merge to main.",
    body: "Fragmented pieces came together. Your story isn't a side branch — it's integrated into something larger.",
  },
  {
    title: "Hotfix applied.",
    body: "The weight you named found a patch. Mercy is the changelog entry that never gets reverted.",
  },
  {
    title: "Zero critical issues.",
    body: "Not because life is flawless, but because hope is the monitor that stays on through the night.",
  },
  {
    title: "Runtime stable.",
    body: "You showed up honest. That honesty is the environment where faith actually executes.",
  },
  {
    title: "Logs cleared.",
    body: "Old errors don't have to define the next sprint. You're shipping a gentler version of yourself.",
  },
  {
    title: "Integration tests: green.",
    body: "Community and courage passed the suite. Keep testing truth in small, daily commits.",
  },
  {
    title: "Release notes: renewal.",
    body: "Today's deployment included humility, listening, and light. Version you is worth tagging.",
  },
  {
    title: "End of run — beginning of rest.",
    body: "The session closes; the Spirit keeps compiling peace in the background. Well done.",
  },
];

export function completionMessageForGroupIndex(groupIndex: number): CompletionMessage {
  const i = ((groupIndex % COMPLETION_MESSAGES.length) + COMPLETION_MESSAGES.length) % COMPLETION_MESSAGES.length;
  const msg = COMPLETION_MESSAGES[i];
  if (!msg) {
    return COMPLETION_MESSAGES[0]!;
  }
  return msg;
}
