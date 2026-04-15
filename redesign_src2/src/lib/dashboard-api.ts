import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/sonner";

let authToastShown = false;

export class ApiError extends Error {
  status: number;
  body: string;
  payload: unknown;

  constructor(status: number, message: string, body = "", payload: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.payload = payload;
  }
}

type ApiRequestOptions = RequestInit & {
  quiet?: boolean;
  responseType?: "json" | "text";
};

async function parseResponsePayload(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function normalizeErrorMessage(status: number, payload: unknown, body: string) {
  if (payload && typeof payload === "object") {
    const rec = payload as Record<string, unknown>;
    if (typeof rec.error === "string" && rec.error.trim()) return rec.error;
    if (typeof rec.message === "string" && rec.message.trim()) return rec.message;
    if (typeof rec.hint === "string" && rec.hint.trim()) return rec.hint;
  }
  if (body.trim()) return body;
  if (status === 401) return "Session expired. Please log in again.";
  if (status === 429) return "Rate limited. Slow down and retry.";
  return `HTTP ${status}`;
}

function emitApiEvent(name: string, detail?: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function notifyError(error: ApiError, quiet = false) {
  if (quiet) return;
  if (error.status === 401) {
    if (!authToastShown) {
      authToastShown = true;
      toast.error("Session expired", { description: "Reload the page and sign in again." });
      window.setTimeout(() => {
        authToastShown = false;
      }, 4000);
    }
    emitApiEvent("hermes:auth-expired", { status: error.status });
    return;
  }
  if (error.status === 429) {
    toast.warning("Rate limited", { description: error.message });
    return;
  }
  toast.error("Request failed", { description: error.message });
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { quiet = false, responseType = "json", headers, ...rest } = options;
  const res = await fetch(path, {
    credentials: "include",
    headers,
    ...rest,
  });

  const payload = await parseResponsePayload(res);
  const body = typeof payload === "string" ? payload : "";

  if (!res.ok) {
    const message = normalizeErrorMessage(res.status, payload, body);
    const error = new ApiError(res.status, message, body, payload);
    notifyError(error, quiet);
    throw error;
  }

  if (responseType === "text") {
    return (typeof payload === "string" ? payload : "") as T;
  }

  return payload as T;
}

export async function apiGet<T>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "GET" });
}

export async function apiPost<T>(path: string, body: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}): Promise<T> {
  return apiRequest<T>(path, {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    body: JSON.stringify(body),
  });
}

type PollingOptions<T> = {
  enabled?: boolean;
  intervalMs?: number;
  initialData: T;
  quiet?: boolean;
  keepPreviousData?: boolean;
};

export function usePollingQuery<T>(
  fetcher: () => Promise<T>,
  { enabled = true, intervalMs = 0, initialData, quiet = true, keepPreviousData = true }: PollingOptions<T>,
) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<ApiError | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetcherRef.current();
      setData(next);
      return next;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(0, err instanceof Error ? err.message : "Unknown error");
      setError(apiError);
      if (!keepPreviousData) setData(initialData);
      if (!quiet) notifyError(apiError, false);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [initialData, keepPreviousData, quiet]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const next = await fetcherRef.current();
        if (!cancelled) {
          setData(next);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err : new ApiError(0, err instanceof Error ? err.message : "Unknown error"));
          if (!keepPreviousData) setData(initialData);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    if (!intervalMs) {
      return () => {
        cancelled = true;
      };
    }
    const id = window.setInterval(() => {
      void run();
    }, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, initialData, intervalMs, keepPreviousData]);

  return { data, loading, error, refresh, setData };
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
