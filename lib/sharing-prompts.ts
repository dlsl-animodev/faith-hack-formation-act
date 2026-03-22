export const SHARING_PROMPTS = [
  "Looking at your checklist, which 'bug' seems to be draining your spiritual battery the most lately?",
  "What is the most common 'Syntax Error' in your daily routine? When does it usually trigger?",
  "If your faith life were a codebase, what would the most critical unresolved issue be right now?",
  "Which 'bug' on your list has been in production the longest — something you've been carrying for a while?",
  "If a teammate reviewed your week like a pull request, what feedback comment would they leave?",
  "Where do you feel the 'latency' between what you believe and how you live — and what would reduce it?",
  "What would a compassionate 'code review' of your inner dialogue say about the comments you leave on yourself?",
  "If rest were a required dependency, what would you need to import into this week?",
] as const;

export function promptForPosition(position: number): string {
  const idx = (position - 1 + SHARING_PROMPTS.length) % SHARING_PROMPTS.length;
  return SHARING_PROMPTS[idx] ?? SHARING_PROMPTS[0]!;
}
