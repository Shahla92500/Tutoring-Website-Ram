export function stars(n: number): string {
  const safe = Math.max(1, Math.min(5, n));
  return `${"★".repeat(safe)}${"☆".repeat(5 - safe)}`;
}
