import { getPersistedLanguage, toIntlLocale } from "../i18n";

export function formatRelativeTime(isoDate: string): string {
  const diffInSeconds = Math.max(1, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));

  const value = diffInSeconds < 60
    ? { amount: diffInSeconds, unit: "second" as const }
    : diffInSeconds < 3600
      ? { amount: Math.floor(diffInSeconds / 60), unit: "minute" as const }
      : { amount: Math.floor(diffInSeconds / 3600), unit: "hour" as const };

  try {
    const locale = toIntlLocale(getPersistedLanguage());
    return new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "short" }).format(-value.amount, value.unit);
  } catch {
    if (value.unit === "second") return `${value.amount}s ago`;
    if (value.unit === "minute") return `${value.amount}m ago`;
    return `${value.amount}h ago`;
  }
}
