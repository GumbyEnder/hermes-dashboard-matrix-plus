import { useEffect, useState } from "react";
import { Activity, FolderOpen, MessageSquare, Wrench } from "lucide-react";
import { apiGet, formatAge } from "@/lib/dashboard-api";

type FeedEvent = {
  ts?: number;
  type?: string;
  title?: string;
  summary?: string;
  name?: string;
  path?: string;
  model?: string;
  message_count?: number;
};

function iconFor(event: FeedEvent) {
  const kind = event.type || "";
  if (kind.includes("session")) return MessageSquare;
  if (kind.includes("project") || kind.includes("obsidian")) return FolderOpen;
  return Wrench;
}

function labelFor(event: FeedEvent) {
  return event.title || event.summary || event.name || event.type || "event";
}

function detailFor(event: FeedEvent) {
  return event.path || event.model || (event.message_count ? `${event.message_count} messages` : "");
}

export function ActivityFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = () => {
      apiGet<{ events: FeedEvent[] }>("/api/ops/ledger")
        .then((data) => {
          if (mounted) setEvents((data.events || []).slice(0, 20));
        })
        .catch(() => {
          if (mounted) setEvents([]);
        });
    };

    load();
    const id = setInterval(load, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-hermes-border">
        <div className="flex items-center gap-2">
          <span className="live-pulse" />
          <span className="text-xs font-semibold">Activity</span>
        </div>
        <span className="text-[10px] text-hermes-muted font-mono">{events.length} events</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {events.length === 0 && (
          <div className="px-3 py-3 text-xs text-hermes-muted">No recent ledger activity.</div>
        )}
        {events.map((ev, i) => {
          const Icon = iconFor(ev);
          return (
            <div
              key={`${ev.ts || 0}-${ev.type || "event"}-${i}`}
              className="flex items-start gap-2 px-3 py-2 border-b border-hermes-border/30 hover:bg-row-hover transition-colors"
            >
              <div className="mt-0.5 shrink-0">
                <Icon size={14} className="text-hermes-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{labelFor(ev)}</p>
                <p className="text-[10px] text-hermes-muted truncate">{detailFor(ev) || "Ledger event"}</p>
              </div>
              <span className="text-[9px] text-hermes-muted font-mono shrink-0 mt-0.5">
                {formatAge(ev.ts || 0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
