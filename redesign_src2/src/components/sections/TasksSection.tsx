import { useMemo } from "react";
import { CalendarCheck, Plus, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeftPanel } from "@/components/LeftPanel";
import { apiGet, apiPost, formatAge, usePollingQuery } from "@/lib/dashboard-api";

type Job = {
  id?: string;
  name?: string;
  schedule?: { display?: string; expr?: string; kind?: string } | string;
  schedule_display?: string;
  enabled?: boolean;
  last_run?: string | null;
  last_run_at?: string | null;
  next_run_at?: string | null;
  state?: string;
  last_status?: string | null;
};

function textValue(value: unknown, fallback = "unknown") {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    if ("display" in (value as Record<string, unknown>) && typeof (value as Record<string, unknown>).display === "string") {
      return String((value as Record<string, unknown>).display);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

const COLUMNS = [
  { id: "todo", label: "Todo", color: "bg-hermes-muted" },
  { id: "in-progress", label: "In Progress", color: "bg-badge-live" },
  { id: "done", label: "Done", color: "bg-success" },
] as const;

function scheduleLabel(job: Job) {
  return textValue(job.schedule_display || job.schedule, "manual");
}

function lastLabel(job: Job) {
  return textValue(job.last_run_at || job.last_run || job.last_status || job.state, "pending");
}

function jobLabel(job: Job) {
  return textValue(job.name || job.id, "unnamed job");
}

export function TasksSection({ selectedTaskId, onTaskSelect }: { selectedTaskId: string | null; onTaskSelect: (id: string | null) => void }) {
  const { data, refresh, setData } = usePollingQuery(
    () => apiGet<{ jobs: Job[] }>("/api/crons", { quiet: true }),
    { initialData: { jobs: [] }, intervalMs: 30000, quiet: true },
  );
  const jobs = useMemo(() => data.jobs || [], [data.jobs]);

  return (
    <LeftPanel title="Scheduled Tasks" onRefresh={() => void refresh()} actions={
      <button className="p-1 rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors">
        <Plus size={14} />
      </button>
    }>
      <div className="px-1 py-1">
        {jobs.length === 0 && <div className="px-3 py-2 text-xs text-hermes-muted">No cron jobs scheduled.</div>}
        {jobs.map((job) => (
          <div key={job.id || job.name} className={cn("flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer", (job.id || job.name) === selectedTaskId ? "bg-row-selected" : "hover:bg-row-hover")} onClick={() => onTaskSelect(job.id || job.name || null)}>
            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", job.enabled === false ? "bg-badge-idle" : "bg-badge-live")} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{jobLabel(job)}</div>
              <div className="flex items-center gap-2 text-[10px] text-hermes-muted mt-0.5">
                <span className="font-mono">{scheduleLabel(job)}</span>
                <span>• {lastLabel(job)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await apiPost(job.enabled === false ? "/api/crons/resume" : "/api/crons/pause", { job_id: job.id, id: job.id });
                  const latest = await refresh();
                  if (latest) setData(latest);
                } catch {}
              }}
              className="p-1 text-hermes-muted hover:text-foreground"
            >
              {job.enabled === false ? <Play size={12} /> : <Pause size={12} />}
            </button>
          </div>
        ))}
      </div>
    </LeftPanel>
  );
}

export function TasksMain({ selectedTaskId }: { selectedTaskId: string | null }) {
  const { data } = usePollingQuery(
    () => apiGet<{ jobs: Job[] }>("/api/crons", { quiet: true }),
    { initialData: { jobs: [] }, intervalMs: 30000, quiet: true },
  );
  const jobs = data.jobs || [];

  const grouped = {
    todo: jobs.filter((job) => job.enabled === false),
    "in-progress": jobs.filter((job) => job.enabled !== false),
    done: [],
  };
  const selected = jobs.find((job) => (job.id || job.name) === selectedTaskId) || null;

  return (
    <div className="flex h-full gap-3 p-4 overflow-x-auto">
      {selected && (
        <div className="w-80 shrink-0 rounded-lg bg-hermes-elev border border-hermes-border p-4">
          <div className="text-sm font-semibold">{jobLabel(selected)}</div>
          <div className="mt-2 text-xs text-hermes-muted font-mono">{scheduleLabel(selected)}</div>
          <div className="mt-2 text-xs text-hermes-muted">State: {textValue(selected.state || (selected.enabled === false ? "paused" : "scheduled"))}</div>
          <div className="mt-1 text-xs text-hermes-muted">Last run: {lastLabel(selected)}</div>
          <div className="mt-1 text-xs text-hermes-muted">Next run: {selected.next_run_at ? formatAge(selected.next_run_at) : "not scheduled"}</div>
        </div>
      )}
      {COLUMNS.map((col) => {
        const colJobs = grouped[col.id];
        return (
          <div key={col.id} className="flex-1 min-w-[200px] flex flex-col rounded-lg bg-hermes-elev border border-hermes-border">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-hermes-border">
              <div className={cn("w-2 h-2 rounded-full", col.color)} />
              <span className="text-xs font-semibold">{col.label}</span>
              <span className="ml-auto text-[10px] text-hermes-muted">{colJobs.length}</span>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {colJobs.map((job) => (
                <div key={job.id || job.name} className="px-3 py-2 rounded-md border border-hermes-border bg-hermes-panel">
                  <div className="text-xs font-medium">{jobLabel(job)}</div>
                  <div className="text-[10px] text-hermes-muted mt-1 font-mono">{scheduleLabel(job)}</div>
                  <div className="text-[10px] text-hermes-muted mt-0.5">{lastLabel(job)}</div>
                </div>
              ))}
              {colJobs.length === 0 && <div className="text-[10px] text-hermes-muted text-center py-4 opacity-50">No jobs</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
