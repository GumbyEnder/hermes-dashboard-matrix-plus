import { LeftPanel } from "@/components/LeftPanel";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookMarked, CheckCircle2, Code2, Database, Layers3, ServerCog, ShieldCheck } from "lucide-react";

const PRACTICE_TRACKS = [
  { id: "frontend", label: "Frontend", icon: Layers3, notes: "shell, motion, accessibility" },
  { id: "backend", label: "Backend", icon: ServerCog, notes: "handlers, errors, contracts" },
  { id: "data", label: "Data", icon: Database, notes: "schemas, caching, queries" },
  { id: "agent", label: "Agent Ops", icon: ShieldCheck, notes: "prompts, runbooks, handoffs" },
] as const;

const CHECKLISTS = {
  frontend: [
    "Keep shell extensions additive and reversible.",
    "Preserve panel resize, collapse, and shortcut behavior when adding sections.",
    "Use code-friendly contrast and avoid theme drift from the Hermes dark baseline.",
  ],
  backend: [
    "Hide Phase2 transport details behind explicit TODO boundaries until UI shape is stable.",
    "Prefer durable response contracts over section-specific ad hoc payloads.",
    "Keep chat provider/model fixes out of unrelated shell work.",
  ],
  data: [
    "Define note and best-practice sources before connecting TanStack Query hooks.",
    "Model collection metadata separately from heavy note content for sidebar performance.",
    "Plan cache invalidation around workspace switches, not just route changes.",
  ],
  agent: [
    "Update living docs after each sprint so future agents inherit the latest shell choices.",
    "Record verification commands and risks in the handover document, not only in chat.",
    "Keep mock content obviously synthetic to avoid confusion during later integration.",
  ],
} as const;

const PRINCIPLES = [
  {
    title: "Shell First",
    desc: "Stabilize nav, panels, and section composition before wiring APIs or backend state.",
  },
  {
    title: "Visual Debt Visible",
    desc: "Use explicit TODOs where live data will replace placeholders so Phase2 work has clear seams.",
  },
  {
    title: "Ops-Ready Defaults",
    desc: "Favor readable density, terminal-friendly typography, and low-friction navigation over decorative noise.",
  },
] as const;

export function BestPracticesSection() {
  return (
    <LeftPanel title="Best Practices" onRefresh={() => {}}>
      <div className="px-1 py-2 space-y-1">
        {PRACTICE_TRACKS.map((track) => (
          <button
            key={track.id}
            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-row-hover transition-colors"
          >
            <track.icon size={14} className="text-hermes-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{track.label}</div>
              <div className="text-[10px] text-hermes-muted truncate">{track.notes}</div>
            </div>
          </button>
        ))}
      </div>
    </LeftPanel>
  );
}

export function BestPracticesMain() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-hermes-border">
        <h1 className="text-sm font-semibold flex items-center gap-2">
          <BookMarked size={16} className="text-hermes-accent" />
          Best Practices
        </h1>
        <p className="text-xs text-hermes-muted mt-1">
          Working conventions for shell delivery now, with data and automation hooks deferred to a later phase.
        </p>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="space-y-3">
          {PRINCIPLES.map((principle) => (
            <div key={principle.title} className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Code2 size={14} className="text-hermes-accent-2" />
                {principle.title}
              </div>
              <p className="mt-2 text-xs leading-6 text-foreground/85">{principle.desc}</p>
            </div>
          ))}

          <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Phase2 Boundaries</div>
              <Badge className="bg-hermes-code text-hermes-muted border-hermes-border">deferred</Badge>
            </div>
            <div className="mt-3 space-y-2 text-xs text-hermes-muted">
              <div className="rounded-md border border-dashed border-hermes-border px-3 py-2">
                TODO: replace static checklists with persisted practices or runbook data.
              </div>
              <div className="rounded-md border border-dashed border-hermes-border px-3 py-2">
                TODO: connect workspace-specific guidance once project context APIs are chosen.
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="frontend" className="min-w-0">
          <TabsList className="w-full justify-start bg-hermes-panel border border-hermes-border">
            {PRACTICE_TRACKS.map((track) => (
              <TabsTrigger key={track.id} value={track.id} className="data-[state=active]:bg-hermes-code">
                {track.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {PRACTICE_TRACKS.map((track) => (
            <TabsContent key={track.id} value={track.id} className="mt-3">
              <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <track.icon size={14} className="text-hermes-accent" />
                  {track.label} Checklist
                </div>
                <div className="mt-4 space-y-3">
                  {CHECKLISTS[track.id].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-md bg-hermes-code/70 px-3 py-3">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success" />
                      <span className="text-xs leading-6 text-foreground/90">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
