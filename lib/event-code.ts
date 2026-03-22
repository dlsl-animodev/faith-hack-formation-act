import { randomBytes } from "crypto";

export function generateEventCode(): string {
  const year = new Date().getFullYear();
  const suffix = randomBytes(3)
    .toString("base64")
    .replace(/[^A-Z0-9]/gi, "")
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, "X");
  return `FH-${year}-${suffix}`;
}
