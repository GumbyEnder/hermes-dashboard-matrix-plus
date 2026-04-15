import { useEffect, useState } from "react";
import { LeftPanel } from "@/components/LeftPanel";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpenText, Clock3, FileText, Pin, Sparkles } from "lucide-react";
import { apiGet, apiPost, formatAge } from "@/lib/dashboard-api";
import { TextPreviewDialog } from "@/components/TextPreviewDialog";

type Brief = {
  title?: string;
  path?: string;
  updated_at?: number;
  summary?: string;
  project?: string;
  recent_files?: string[];
  what?: string;
  why_stopped?: string;
  next?: string;
  when?: string;
};

type LedgerEvent = {
  ts?: number;
  type?: string;
  title?: string;
  summary?: string;
  path?: string;
};

export function NotesSection({ selectedNoteId, onNoteSelect }: { selectedNoteId: string | null; onNoteSelect: (id: string | null) => void }) {
  const [briefs, setBriefs] = useState<Brief[]>([]);

  useEffect(() => {
    apiGet<{ briefs: Brief[] }>("/api/ops/briefs")
      .then((data) => {
        const list = data.briefs || [];
        setBriefs(list);
        if (!selectedNoteId) onNoteSelect("hermes-notes");
      })
      .catch(() => setBriefs([]));
  }, [onNoteSelect, selectedNoteId]);

  return (
    <LeftPanel title="Notes" onRefresh={() => window.location.reload()}>
      <div className="px-1 py-2 space-y-1">
        <button type="button" onClick={() => onNoteSelect("hermes-notes")} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${selectedNoteId === "hermes-notes" ? "bg-row-selected" : "hover:bg-row-hover"}`}>
          <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-success" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Hermes Notes</div>
            <div className="text-[10px] text-hermes-muted">~/.hermes/notes.md</div>
          </div>
          <Badge variant="secondary" className="bg-hermes-code text-hermes-muted border-hermes-border text-[10px]">
            notes
          </Badge>
        </button>
        {briefs.length === 0 && <div className="px-3 py-2 text-xs text-hermes-muted">No briefs available.</div>}
        {briefs.map((brief, index) => (
          <button key={`${brief.path}-${index}`} type="button" onClick={() => onNoteSelect(brief.path || null)} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${selectedNoteId === brief.path ? "bg-row-selected" : "hover:bg-row-hover"}`}>
            <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-hermes-accent" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{brief.title || brief.path || "brief"}</div>
              <div className="text-[10px] text-hermes-muted">{formatAge(brief.updated_at || 0)}</div>
            </div>
            <Badge variant="secondary" className="bg-hermes-code text-hermes-muted border-hermes-border text-[10px]">
              brief
            </Badge>
          </button>
        ))}
      </div>
    </LeftPanel>
  );
}

export function NotesMain({ selectedNoteId, onNoteSelect }: { selectedNoteId: string | null; onNoteSelect: (id: string | null) => void }) {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [ledger, setLedger] = useState<LedgerEvent[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [saved, setSaved] = useState<string>("");
  const [viewer, setViewer] = useState<{ title: string; subtitle?: string; content: string } | null>(null);

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
    apiGet<{ briefs: Brief[] }>("/api/ops/briefs")
      .then((data) => setBriefs(data.briefs || []))
      .catch(() => setBriefs([]));
    apiGet<{ events: LedgerEvent[] }>("/api/ops/ledger")
      .then((data) => setLedger(data.events || []))
      .catch(() => setLedger([]));
    apiGet<{ notes: string[] }>("/api/notes")
      .then((data) => setNotes((data.notes || []).join("\n")))
      .catch(() => setNotes(""));
  }, []);

  const selectedBrief = briefs.find((brief) => brief.path === selectedNoteId) || null;

  useEffect(() => {
    if (!selectedNoteId && briefs.length) onNoteSelect("hermes-notes");
  }, [briefs, onNoteSelect, selectedNoteId]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-hermes-border">
        <h1 className="text-sm font-semibold flex items-center gap-2">
          <BookOpenText size={16} className="text-hermes-accent" />
          Notes Workspace
        </h1>
        <p className="text-xs text-hermes-muted mt-1">
          Live brief and ledger data pulled from the Hermes dashboard backend.
        </p>
      </div>

      <Tabs defaultValue="overview" className="flex-1 px-4 py-4">
        <TabsList className="bg-hermes-panel border border-hermes-border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-hermes-code">Overview</TabsTrigger>
          <TabsTrigger value="ledger" className="data-[state=active]:bg-hermes-code">Ledger</TabsTrigger>
          <TabsTrigger value="briefs" className="data-[state=active]:bg-hermes-code">Briefs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-2">
          {selectedNoteId === "hermes-notes" && (
            <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Hermes Notes</div>
                  <div className="text-[11px] text-hermes-muted">Stored in ~/.hermes/notes.md {saved ? `· ${saved}` : ""}</div>
                </div>
                <button type="button" onClick={async () => {
                  setSaved("saving");
                  try {
                    await apiPost("/api/notes/save", { content: notes });
                    setSaved("saved");
                  } catch {
                    setSaved("save failed");
                  }
                }} className="rounded px-3 py-1 text-xs bg-hermes-accent/15 text-hermes-accent">
                  Save Notes
                </button>
              </div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-3 w-full min-h-64 rounded-md border border-hermes-border bg-hermes-code p-3 font-mono text-sm outline-none" />
            </div>
          )}
          {selectedBrief && (
            <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
              <div className="text-sm font-semibold">{selectedBrief.title || selectedBrief.path || "brief"}</div>
              <div className="mt-1 text-[11px] text-hermes-muted font-mono">{selectedBrief.path}</div>
              <div className="mt-3 space-y-2 text-xs text-foreground/85">
                <div><span className="font-semibold">What:</span> {selectedBrief.what || selectedBrief.summary || "No content"}</div>
                <div><span className="font-semibold">Why Stopped:</span> {selectedBrief.why_stopped || "n/a"}</div>
                <div><span className="font-semibold">Next:</span> {selectedBrief.next || "n/a"}</div>
                <div><span className="font-semibold">When:</span> {selectedBrief.when || "n/a"}</div>
              </div>
            </div>
          )}
          <div className="grid gap-3 xl:grid-cols-[1.4fr,0.8fr]">
            <div className="space-y-3">
              {briefs.slice(0, 4).map((brief, index) => (
                <div key={`${brief.path}-${index}`} className="rounded-lg border border-hermes-border bg-hermes-panel p-4 card-glow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{brief.title || brief.path || "brief"}</div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-hermes-muted">
                        <span className="flex items-center gap-1"><FileText size={11} /> {brief.project || "Hermes"}</span>
                        <span className="flex items-center gap-1"><Clock3 size={11} /> {formatAge(brief.updated_at || 0)}</span>
                      </div>
                    </div>
                    <Badge className="bg-hermes-accent/15 text-hermes-accent border-hermes-accent/20">Live</Badge>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-foreground/85">{brief.summary || brief.path || "No summary available."}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Pin size={14} className="text-hermes-accent-2" />
                  Live Notes Scope
                </div>
                <div className="mt-3 space-y-3 text-xs text-hermes-muted">
                  <div className="rounded-md border border-hermes-border/70 bg-hermes-code/70 px-3 py-2">
                    Briefs and ledger entries are loaded directly from backend APIs.
                  </div>
                  <div className="rounded-md border border-hermes-border/70 bg-hermes-code/70 px-3 py-2">
                    Edit flows should write back to the same source of truth before adding richer UX.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ledger" className="space-y-2 pt-2">
          {ledger.slice(0, 12).map((event, index) => (
            <button
              key={`${event.ts}-${index}`}
              type="button"
              onClick={() => void openPreview(
                event.title || event.type || "Ledger Event",
                event.path,
                event.summary || event.title || event.type || "event"
              )}
              className="w-full text-left rounded-md border border-hermes-border bg-hermes-panel px-3 py-2 hover:bg-row-hover transition-colors"
            >
              <div className="text-sm font-medium">{event.title || event.summary || event.type || "event"}</div>
              <div className="text-[11px] text-hermes-muted mt-1">{formatAge(event.ts || 0)}</div>
            </button>
          ))}
          {ledger.length === 0 && <div className="text-xs text-hermes-muted">No ledger events available.</div>}
        </TabsContent>

        <TabsContent value="briefs" className="space-y-2 pt-2">
          {briefs.map((brief, index) => (
            <button
              key={`${brief.path}-${index}`}
              type="button"
              onClick={() => void openPreview(
                brief.title || "Brief",
                brief.path,
                [brief.summary, brief.what, brief.next].filter(Boolean).join("\n\n") || brief.path || "brief"
              )}
              className="w-full text-left rounded-md border border-hermes-border bg-hermes-panel px-3 py-2 hover:bg-row-hover transition-colors"
            >
              <div className="text-sm font-medium">{brief.title || brief.path || "brief"}</div>
              <div className="text-[11px] text-hermes-muted mt-1">{brief.summary || ""}</div>
            </button>
          ))}
        </TabsContent>
      </Tabs>
      <TextPreviewDialog
        open={Boolean(viewer)}
        onOpenChange={(open) => { if (!open) setViewer(null); }}
        title={viewer?.title || "Note"}
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
