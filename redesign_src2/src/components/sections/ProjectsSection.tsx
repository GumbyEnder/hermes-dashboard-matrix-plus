import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Briefcase, CheckCircle2, ClipboardList, FileText, MessageSquare, Plus, RotateCcw, Trash2 } from "lucide-react";
import { LeftPanel } from "@/components/LeftPanel";
import { apiGet, apiPost, formatAge, formatNumber } from "@/lib/dashboard-api";
import { TextPreviewDialog } from "@/components/TextPreviewDialog";
import { Button } from "@/components/ui/button";

type Project = {
  project_id?: string;
  id?: string;
  name?: string;
  path?: string;
  description?: string;
  status?: string;
  mtime?: number;
  brief?: string;
  access_instructions?: string;
  kanban?: KanbanBoard;
};

type KanbanCard = {
  id: string;
  title: string;
  detail?: string;
  updated_at?: number;
};

type KanbanBoard = {
  todo?: KanbanCard[];
  in_progress?: KanbanCard[];
  done?: KanbanCard[];
};

type LedgerEvent = {
  ts?: number;
  type?: string;
  project?: string;
  title?: string;
  event?: string;
  summary?: string;
};

type Brief = {
  title?: string;
  path?: string;
  updated_at?: number;
  summary?: string;
};

export function ProjectsSection({
  selectedProjectId,
  onProjectSelect,
}: {
  selectedProjectId: string | null;
  onProjectSelect: (id: string | null) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    apiGet<{ projects: Project[] }>("/api/projects")
      .then((data) => setProjects(data.projects || []))
      .catch(() => setProjects([]));
  }, []);

  return (
    <LeftPanel title="Projects" onRefresh={() => window.location.reload()}>
      <div className="px-1 py-1">
        {projects.length === 0 && <div className="px-3 py-2 text-xs text-hermes-muted">No projects found.</div>}
        {projects.map((project) => (
          <button
            key={project.project_id || project.path || project.name}
            type="button"
            onClick={() => onProjectSelect(project.project_id || project.id || project.path || project.name || null)}
            className={`flex w-full items-center gap-2 px-3 py-2 rounded-md transition-colors text-left ${
              (project.project_id || project.id || project.path || project.name) === selectedProjectId
                ? "bg-row-selected"
                : "hover:bg-row-hover"
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-badge-live" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium font-mono truncate">{project.name || project.path}</div>
              <div className="text-[10px] text-hermes-muted truncate">{project.description || project.path || "project"}</div>
            </div>
          </button>
        ))}
      </div>
    </LeftPanel>
  );
}

export function ProjectsMain({ selectedProjectId }: { selectedProjectId: string | null }) {
  const [ledger, setLedger] = useState<LedgerEvent[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewer, setViewer] = useState<{ title: string; subtitle?: string; content: string } | null>(null);
  const [savingKanban, setSavingKanban] = useState(false);

  const openPreview = async (title: string, path: string | undefined, fallback: string) => {
    if (path && path.toLowerCase().endsWith(".md")) {
      try {
        const data = await apiGet<{ path: string; content: string }>(`/api/text-file?path=${encodeURIComponent(path)}`);
        setViewer({ title, subtitle: data.path, content: data.content });
        return;
      } catch {}
    }
    setViewer({ title, subtitle: path, content: fallback });
  };

  useEffect(() => {
    apiGet<{ events: LedgerEvent[] }>("/api/ops/ledger")
      .then((data) => setLedger(data.events || []))
      .catch(() => setLedger([]));
    apiGet<{ briefs: Brief[] }>("/api/ops/briefs")
      .then((data) => setBriefs(data.briefs || []))
      .catch(() => setBriefs([]));
    apiGet<{ projects: Project[] }>("/api/projects")
      .then((data) => setProjects(data.projects || []))
      .catch(() => setProjects([]));
  }, []);

  const selectedProject = projects.find((project) =>
    (project.project_id || project.id || project.path || project.name) === selectedProjectId
  ) || null;

  const kanban = useMemo(() => normalizeKanban(selectedProject?.kanban), [selectedProject?.kanban]);

  const persistKanban = async (nextKanban: KanbanBoard) => {
    if (!selectedProject?.project_id) return;
    setSavingKanban(true);
    try {
      const data = await apiPost<{ project?: Project }>("/api/projects/update", {
        project_id: selectedProject.project_id,
        kanban: nextKanban,
      });
      setProjects((current) =>
        current.map((project) =>
          project.project_id === selectedProject.project_id
            ? { ...project, kanban: normalizeKanban(data.project?.kanban || nextKanban) }
            : project
        )
      );
    } finally {
      setSavingKanban(false);
    }
  };

  const addKanbanCard = async (column: keyof Required<KanbanBoard>) => {
    if (!selectedProject) return;
    const title = window.prompt(`New ${labelForColumn(column)} item`, "");
    if (!title || !title.trim()) return;
    const detail = window.prompt("Optional detail", "") || "";
    const nextKanban = {
      ...kanban,
      [column]: [
        ...kanban[column],
        {
          id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          title: title.trim(),
          detail: detail.trim(),
          updated_at: Date.now() / 1000,
        },
      ],
    };
    await persistKanban(nextKanban);
  };

  const moveKanbanCard = async (column: keyof Required<KanbanBoard>, cardId: string, direction: -1 | 1) => {
    const orderedColumns: Array<keyof Required<KanbanBoard>> = ["todo", "in_progress", "done"];
    const currentIndex = orderedColumns.indexOf(column);
    const nextColumn = orderedColumns[currentIndex + direction];
    if (!nextColumn) return;
    const card = kanban[column].find((entry) => entry.id === cardId);
    if (!card) return;
    const nextKanban = {
      ...kanban,
      [column]: kanban[column].filter((entry) => entry.id !== cardId),
      [nextColumn]: [
        ...kanban[nextColumn],
        {
          ...card,
          updated_at: Date.now() / 1000,
        },
      ],
    };
    await persistKanban(nextKanban);
  };

  const removeKanbanCard = async (column: keyof Required<KanbanBoard>, cardId: string) => {
    const nextKanban = {
      ...kanban,
      [column]: kanban[column].filter((entry) => entry.id !== cardId),
    };
    await persistKanban(nextKanban);
  };

  const visibleLedger = selectedProject
    ? ledger.filter((event) => {
        const ref = `${event.project || ""} ${event.title || ""} ${event.summary || ""}`.toLowerCase();
        const needle = `${selectedProject.name || selectedProject.path || ""}`.toLowerCase();
        return needle ? ref.includes(needle) : true;
      })
    : ledger;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-hermes-border">
        <h1 className="text-sm font-semibold flex items-center gap-2">
          <Briefcase size={16} className="text-hermes-accent" />
          Project Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-3 p-4">
        {[
          { label: "Projects", value: formatNumber(projects.length || 0), icon: Briefcase, color: "text-hermes-accent" },
          { label: "Briefs", value: formatNumber(briefs.length || 0), icon: FileText, color: "text-success" },
          { label: "Ledger Events", value: formatNumber(ledger.length || 0), icon: Activity, color: "text-hermes-accent-2" },
        ].map((card) => (
          <div key={card.label} className="bg-hermes-panel rounded-lg p-3 border border-hermes-border">
            <div className="flex items-center gap-2 mb-1">
              <card.icon size={14} className={card.color} />
              <span className="text-[11px] text-hermes-muted">{card.label}</span>
            </div>
            <div className="text-lg font-bold font-mono">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-3">
        {selectedProject && (
          <div className="mb-3 rounded-lg border border-hermes-border bg-hermes-panel p-3">
            <div className="text-sm font-semibold">{selectedProject.name || "Selected project"}</div>
            <div className="mt-1 text-[11px] text-hermes-muted font-mono">{selectedProject.path || "No path set"}</div>
            <div className="mt-2 text-xs text-hermes-muted">{selectedProject.brief || selectedProject.description || selectedProject.access_instructions || "No project brief available."}</div>
            <button
              type="button"
              onClick={() => void openPreview(
                selectedProject.name || "Project Brief",
                selectedProject.path,
                selectedProject.brief || selectedProject.description || selectedProject.access_instructions || "No project brief available."
              )}
              className="mt-3 rounded px-3 py-1 text-xs bg-hermes-accent/15 text-hermes-accent"
            >
              Open Text Viewer
            </button>
          </div>
        )}
        <h2 className="text-xs font-semibold text-hermes-muted uppercase tracking-wider mb-2">Recent Ledger Activity</h2>
        <div className="space-y-1">
          {visibleLedger.slice(0, 8).map((event, index) => (
            <div key={`${event.ts}-${index}`} className="flex items-start gap-2 px-3 py-2 bg-hermes-panel rounded-md border border-hermes-border">
              {event.type?.includes("dialog") ? <MessageSquare size={12} className="text-hermes-accent-2 mt-0.5 shrink-0" /> : <Activity size={12} className="text-hermes-accent mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-xs">{event.title || event.summary || event.event || event.type || "event"}</div>
                <div className="text-[10px] text-hermes-muted mt-0.5 font-mono">
                  {event.project || "Hermes Dashboard"} · {formatAge(event.ts || 0)}
                </div>
              </div>
            </div>
          ))}
          {visibleLedger.length === 0 && <div className="px-3 py-2 text-xs text-hermes-muted">No recent events.</div>}
        </div>
      </div>

      <div className="px-4 pb-4">
        <h2 className="text-xs font-semibold text-hermes-muted uppercase tracking-wider mb-2">Recent Briefs</h2>
        <div className="space-y-2">
          {briefs.slice(0, 5).map((brief, index) => (
            <button
              key={`${brief.path}-${index}`}
              type="button"
              onClick={() => void openPreview(brief.title || "Brief", brief.path, brief.summary || brief.path || "No summary available.")}
              className="w-full text-left bg-hermes-panel rounded-md px-3 py-2 border border-hermes-border hover:bg-row-hover transition-colors"
            >
              <div className="text-xs font-medium font-mono truncate">{brief.title || brief.path || "brief"}</div>
              <div className="text-[10px] text-hermes-muted mt-0.5 truncate">{brief.summary || brief.path || ""}</div>
            </button>
          ))}
          {briefs.length === 0 && <div className="text-xs text-hermes-muted">No briefs found.</div>}
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-hermes-muted uppercase tracking-wider">Project Kanban</h2>
          <div className="text-[10px] text-hermes-muted">{savingKanban ? "Saving..." : selectedProject ? "Per-project board" : "Select a project"}</div>
        </div>
        {selectedProject ? (
          <div className="grid gap-3 md:grid-cols-3">
            {KANBAN_COLUMNS.map((column) => (
              <div key={column.key} className="rounded-lg border border-hermes-border bg-hermes-panel/80 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <column.icon size={14} className={column.iconClass} />
                    <div>
                      <div className="text-xs font-semibold">{column.label}</div>
                      <div className="text-[10px] text-hermes-muted">{formatNumber(kanban[column.key].length)} cards</div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-hermes-muted" onClick={() => void addKanbanCard(column.key)}>
                    <Plus size={13} />
                  </Button>
                </div>
                <div className="space-y-2">
                  {kanban[column.key].map((card) => (
                    <div key={card.id} className="rounded-md border border-hermes-border bg-black/20 p-3">
                      <div className="text-xs font-medium">{card.title}</div>
                      {card.detail ? <div className="mt-1 text-[11px] text-hermes-muted whitespace-pre-wrap">{card.detail}</div> : null}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="text-[10px] text-hermes-muted">{card.updated_at ? formatAge(card.updated_at) : "now"}</div>
                        <div className="flex items-center gap-1">
                          {column.key !== "todo" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-hermes-muted"
                              onClick={() => void moveKanbanCard(column.key, card.id, -1)}
                            >
                              <RotateCcw size={12} />
                            </Button>
                          ) : null}
                          {column.key !== "done" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-hermes-muted"
                              onClick={() => void moveKanbanCard(column.key, card.id, 1)}
                            >
                              <ArrowRight size={12} />
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-destructive"
                            onClick={() => void removeKanbanCard(column.key, card.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {kanban[column.key].length === 0 ? (
                    <div className="rounded-md border border-dashed border-hermes-border px-3 py-6 text-center text-xs text-hermes-muted">
                      No cards in {column.label.toLowerCase()}.
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-hermes-border bg-hermes-panel/60 px-4 py-6 text-sm text-hermes-muted">
            Select a project to view its Todo, In Progress, and Done board.
          </div>
        )}
      </div>
      <TextPreviewDialog
        open={Boolean(viewer)}
        onOpenChange={(open) => { if (!open) setViewer(null); }}
        title={viewer?.title || "Preview"}
        subtitle={viewer?.subtitle}
        content={viewer?.content || ""}
        editable={Boolean(viewer?.subtitle && viewer.subtitle.toLowerCase().endsWith(".md"))}
        onSave={viewer?.subtitle ? async (content) => {
          await apiPost("/api/text-file/save", { path: viewer.subtitle, content });
          setViewer({ ...viewer, content });
        } : undefined}
      />
    </div>
  );
}

const KANBAN_COLUMNS: Array<{
  key: keyof Required<KanbanBoard>;
  label: string;
  icon: typeof ClipboardList;
  iconClass: string;
}> = [
  { key: "todo", label: "Todo", icon: ClipboardList, iconClass: "text-hermes-accent" },
  { key: "in_progress", label: "In Progress", icon: Activity, iconClass: "text-warning" },
  { key: "done", label: "Done", icon: CheckCircle2, iconClass: "text-success" },
];

function normalizeKanban(input?: KanbanBoard): Required<KanbanBoard> {
  return {
    todo: Array.isArray(input?.todo) ? input.todo : [],
    in_progress: Array.isArray(input?.in_progress) ? input.in_progress : [],
    done: Array.isArray(input?.done) ? input.done : [],
  };
}

function labelForColumn(column: keyof Required<KanbanBoard>): string {
  switch (column) {
    case "todo":
      return "Todo";
    case "in_progress":
      return "In Progress";
    case "done":
      return "Done";
  }
}
