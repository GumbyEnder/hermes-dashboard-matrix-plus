import { LeftPanel } from "@/components/LeftPanel";
import { Briefcase, FileText, MessageSquare, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_PROJECTS = [
  { id: "1", name: "hermes-core", status: "active" as const, events: 24, briefs: 3 },
  { id: "2", name: "client-portal", status: "active" as const, events: 12, briefs: 1 },
  { id: "3", name: "research-agent", status: "idle" as const, events: 5, briefs: 2 },
];

const MOCK_EVENTS = [
  { id: "1", type: "ledger", msg: "Deployed v2.3.1 to staging", ts: "14:20" },
  { id: "2", type: "dialog", msg: "Review: auth middleware changes", ts: "13:45" },
  { id: "3", type: "obsidian", msg: "Updated project brief", ts: "12:30" },
  { id: "4", type: "ledger", msg: "Database migration completed", ts: "11:15" },
  { id: "5", type: "dialog", msg: "Approval: deploy to production", ts: "10:00" },
];

export function ProjectsSection() {
  return (
    <LeftPanel title="Projects" onRefresh={() => {}}>
      <div className="px-1 py-1">
        {MOCK_PROJECTS.map((p) => (
          <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-row-hover transition-colors cursor-pointer">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.status === "active" ? "bg-badge-live" : "bg-badge-idle"}`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium font-mono truncate">{p.name}</div>
              <div className="text-[10px] text-hermes-muted">{p.events} events • {p.briefs} briefs</div>
            </div>
          </div>
        ))}
      </div>
    </LeftPanel>
  );
}

export function ProjectsMain() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-hermes-border">
        <h1 className="text-sm font-semibold flex items-center gap-2">
          <Briefcase size={16} className="text-hermes-accent" />
          Project Dashboard
        </h1>
      </div>

      <div className="px-4 py-3">
        <h2 className="text-xs font-semibold text-hermes-muted uppercase tracking-wider mb-2">Recent Activity</h2>
        <div className="space-y-1">
          {MOCK_EVENTS.map((e) => (
            <div key={e.id} className="flex items-start gap-2 px-3 py-2 bg-hermes-panel rounded-md border border-hermes-border">
              {e.type === "ledger" ? <Activity size={12} className="text-hermes-accent mt-0.5 shrink-0" />
                : e.type === "dialog" ? <MessageSquare size={12} className="text-hermes-accent-2 mt-0.5 shrink-0" />
                : <FileText size={12} className="text-success mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-xs">{e.msg}</div>
                <div className="text-[10px] text-hermes-muted mt-0.5 font-mono">{e.ts}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
