export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400_000);
}
