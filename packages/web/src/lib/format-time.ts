export function formatElapsedTime(since: string | number): string {
  const start = typeof since === "string" ? new Date(since).getTime() : since;
  const diffMs = Date.now() - start;
  if (diffMs < 0) return "0m";

  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
