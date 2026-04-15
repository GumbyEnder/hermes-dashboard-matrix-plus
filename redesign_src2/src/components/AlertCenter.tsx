import { useEffect, useMemo, useState } from "react";
import { Bell, FolderOpen, MessageSquare, Wrench, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiGet, formatAge, usePollingQuery } from "@/lib/dashboard-api";
import { cn } from "@/lib/utils";

type LedgerEvent = {
  ts?: number;
  type?: string;
  title?: string;
  summary?: string;
  name?: string;
  path?: string;
  model?: string;
  profile?: string;
  project_ref?: string;
  message_count?: number;
  source?: string;
};

type LedgerPayload = {
  events?: LedgerEvent[];
};

const SEEN_KEY = "hermes-alert-center-last-seen-ts";

function iconFor(event: LedgerEvent) {
  const kind = String(event.type || "").toLowerCase();
  if (kind.includes("error") || kind.includes("fail")) return ShieldAlert;
  if (kind.includes("session") || kind.includes("dialog")) return MessageSquare;
  if (kind.includes("project") || kind.includes("obsidian")) return FolderOpen;
  return Wrench;
}

function titleFor(event: LedgerEvent) {
  return event.title || event.summary || event.name || event.type || "Event";
}

function detailFor(event: LedgerEvent) {
  return [
    event.project_ref,
    event.profile,
    event.model,
    event.path,
    event.message_count ? `${event.message_count} messages` : "",
  ].filter(Boolean).join(" · ");
}

function severityFor(event: LedgerEvent) {
  const kind = String(event.type || "").toLowerCase();
  if (kind.includes("error") || kind.includes("fail")) return "error";
  if (kind.includes("warn")) return "warn";
  if (kind.includes("session") || kind.includes("project")) return "live";
  return "idle";
}

export function AlertCenter() {
  const [open, setOpen] = useState(false);
  const [lastSeenTs, setLastSeenTs] = useState(0);
  const { data, loading, refresh } = usePollingQuery(
    () => apiGet<LedgerPayload>("/api/ops/ledger?limit=25", { quiet: true }),
    { initialData: { events: [] }, intervalMs: 30000, quiet: true },
  );

  useEffect(() => {
    try {
      setLastSeenTs(Number(localStorage.getItem(SEEN_KEY) || 0));
    } catch {
      setLastSeenTs(0);
    }
  }, []);

  const events = useMemo(() => (data.events || []).slice(0, 20), [data.events]);
  const unreadCount = useMemo(
    () => events.filter((event) => Number(event.ts || 0) > lastSeenTs).length,
    [events, lastSeenTs],
  );

  useEffect(() => {
    if (!open || events.length === 0) return;
    const newest = Number(events[0]?.ts || 0);
    if (!newest) return;
    setLastSeenTs(newest);
    try {
      localStorage.setItem(SEEN_KEY, String(newest));
    } catch {}
  }, [open, events]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 rounded-lg border-hermes-border/40 bg-hermes-panel/40 text-hermes-muted hover:bg-hermes-panel hover:text-foreground"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] border-hermes-border bg-hermes-panel p-0 shadow-2xl">
        <div className="flex items-center justify-between border-b border-hermes-border px-4 py-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-hermes-muted">Alerts</div>
            <div className="text-[11px] text-hermes-muted">{events.length} recent ops events</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-hermes-muted hover:text-foreground"
            onClick={() => void refresh()}
          >
            Refresh
          </Button>
        </div>
        <ScrollArea className="max-h-[420px]">
          {loading && events.length === 0 && (
            <div className="px-4 py-6 text-xs text-hermes-muted">Loading alerts…</div>
          )}
          {!loading && events.length === 0 && (
            <div className="px-4 py-6 text-xs text-hermes-muted">No recent events.</div>
          )}
          <div className="divide-y divide-hermes-border/40">
            {events.map((event, index) => {
              const Icon = iconFor(event);
              const severity = severityFor(event);
              return (
                <div
                  key={`${event.ts || 0}-${event.type || "event"}-${index}`}
                  className="flex gap-3 px-4 py-3 hover:bg-row-hover/70"
                >
                  <div className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                    severity === "error" && "border-danger/30 bg-danger/10 text-danger",
                    severity === "warn" && "border-warn/30 bg-warn/10 text-warn",
                    severity === "live" && "border-hermes-accent/30 bg-hermes-accent/10 text-hermes-accent",
                    severity === "idle" && "border-hermes-border bg-background/30 text-hermes-muted",
                  )}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-xs font-medium text-foreground">{titleFor(event)}</p>
                      <span className="shrink-0 text-[10px] font-mono text-hermes-muted">{formatAge(event.ts || 0)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-hermes-muted">
                      {detailFor(event) || "Hermes dashboard activity"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
