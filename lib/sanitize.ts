export function sanitizeText(input: string, maxLength = 4000): string {
  return input
    .replace(/\0/g, "")
    .trim()
    .slice(0, maxLength);
}
