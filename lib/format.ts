export function generateUuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // crypto.randomUUID is unavailable on non-secure origins (plain http over LAN).
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  bières: "🍺",
  vins: "🍷",
  softs: "🥤",
  alcools: "🥃",
  cocktails: "🍹",
  "sans alcool": "🧃",
};

export function categoryEmoji(name: string | null | undefined): string {
  return (name && CATEGORY_EMOJIS[name.trim().toLowerCase()]) || "🍴";
}

export function formatAlcohol(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return `${Number.isInteger(value) ? value : value.toString().replace(".", ",")} %`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / 86_400_000,
  );
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
