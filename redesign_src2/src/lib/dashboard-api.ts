export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-US").format(Number(value ?? 0));
}

export function formatBytes(bytes: number | null | undefined): string {
  const value = Number(bytes ?? 0);
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const idx = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const scaled = value / Math.pow(1024, idx);
  return `${scaled >= 10 || idx === 0 ? scaled.toFixed(0) : scaled.toFixed(1)} ${units[idx]}`;
}

export function formatAge(ts?: number | string): string {
  if (ts === undefined || ts === null || ts === "" || ts === 0) return "";
  const n = typeof ts === "string" ? Number(ts) : ts;
  if (!Number.isFinite(n)) return String(ts);
  const diff = Date.now() / 1000 - n;
  if (diff < 60) return `${Math.max(1, Math.floor(diff))}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
