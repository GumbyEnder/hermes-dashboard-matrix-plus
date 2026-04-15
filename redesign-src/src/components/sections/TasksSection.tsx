import { LeftPanel } from "@/components/LeftPanel";
import { CalendarCheck, Plus, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";

const INITIAL_TASKS = [
  { id: "1", name: "Daily summary report", schedule: "0 9 * * *", status: "todo" as const, lastRun: "Today 09:00" },
  { id: "2", name: "Sync obsidian notes", schedule: "*/30 * * * *", status: "in-progress" as const, lastRun: "12m ago" },
  { id: "3", name: "Backup databases", schedule: "0 2 * * 0", status: "done" as const, lastRun: "5 days ago" },
  { id: "4", name: "Check service health", schedule: "*/5 * * * *", status: "todo" as const, lastRun: "2m ago" },
  { id: "5", name: "Deploy staging build", schedule: "manual", status: "in-progress" as const, lastRun: "1h ago" },
  { id: "6", name: "Run test suite", schedule: "0 */4 * * *", status: "done" as const, lastRun: "3h ago" },
];

type TaskStatus = "todo" | "in-progress" | "done";
type Task = typeof INITIAL_TASKS[number];

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "Todo", color: "bg-hermes-muted" },
  { id: "in-progress", label: "In Progress", color: "bg-badge-live" },
  { id: "done", label: "Done", color: "bg-success" },
];

export function TasksSection() {
  return (
    <LeftPanel title="Scheduled Tasks" onRefresh={() => {}} actions={
      <button className="p-1 rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors">
        <Plus size={14} />
      </button>
    }>
      <div className="px-1 py-1">
        {INITIAL_TASKS.map((t) => (
          <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-row-hover transition-colors cursor-pointer">
            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0",
              t.status === "done" ? "bg-success" : t.status === "in-progress" ? "bg-badge-live" : "bg-badge-idle"
            )} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{t.name}</div>
              <div className="flex items-center gap-2 text-[10px] text-hermes-muted mt-0.5">
                <span className="font-mono">{t.schedule}</span>
                <span>• {t.lastRun}</span>
              </div>
            </div>
            <button className="p-1 text-hermes-muted hover:text-foreground">
              {t.status !== "done" ? <Pause size={12} /> : <Play size={12} />}
            </button>
          </div>
        ))}
      </div>
    </LeftPanel>
  );
}

export function TasksMain() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [dragId, setDragId] = useState<string | null>(null);

  const onDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onDrop = useCallback((e: React.DragEvent, col: TaskStatus) => {
    e.preventDefault();
    if (!dragId) return;
    setTasks((prev) => prev.map((t) => t.id === dragId ? { ...t, status: col } : t));
    setDragId(null);
  }, [dragId]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }, []);

  return (
    <div className="flex h-full gap-3 p-4 overflow-x-auto">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div
            key={col.id}
            className="flex-1 min-w-[200px] flex flex-col rounded-lg bg-hermes-elev border border-hermes-border"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, col.id)}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-hermes-border">
              <div className={cn("w-2 h-2 rounded-full", col.color)} />
              <span className="text-xs font-semibold">{col.label}</span>
              <span className="ml-auto text-[10px] text-hermes-muted">{colTasks.length}</span>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {colTasks.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, t.id)}
                  className={cn(
                    "px-3 py-2 rounded-md border border-hermes-border bg-hermes-panel cursor-grab active:cursor-grabbing transition-all hover:border-hermes-accent/40",
                    dragId === t.id && "opacity-50"
                  )}
                >
                  <div className="text-xs font-medium">{t.name}</div>
                  <div className="text-[10px] text-hermes-muted mt-1 font-mono">{t.schedule}</div>
                  <div className="text-[10px] text-hermes-muted mt-0.5">{t.lastRun}</div>
                </div>
              ))}
              {colTasks.length === 0 && (
                <div className="text-[10px] text-hermes-muted text-center py-4 opacity-50">Drop tasks here</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
