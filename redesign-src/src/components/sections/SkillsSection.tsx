import { LeftPanel } from "@/components/LeftPanel";
import { Layers, Search } from "lucide-react";

const MOCK_SKILLS = [
  { id: "1", name: "Web Search", category: "Research", enabled: true },
  { id: "2", name: "Code Execution", category: "Dev", enabled: true },
  { id: "3", name: "File Management", category: "System", enabled: true },
  { id: "4", name: "Image Generation", category: "Creative", enabled: false },
  { id: "5", name: "Database Query", category: "Data", enabled: true },
  { id: "6", name: "Email Send", category: "Communication", enabled: false },
];

export function SkillsSection() {
  return (
    <LeftPanel title="Skills" onRefresh={() => {}} actions={
      <button className="p-1 rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors">
        <Search size={14} />
      </button>
    }>
      <div className="px-1 py-1">
        {MOCK_SKILLS.map((s) => (
          <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-row-hover transition-colors cursor-pointer">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.enabled ? "bg-badge-live" : "bg-badge-idle"}`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium">{s.name}</div>
              <div className="text-[10px] text-hermes-muted">{s.category}</div>
            </div>
          </div>
        ))}
      </div>
    </LeftPanel>
  );
}

export function SkillsMain() {
  return (
    <div className="flex items-center justify-center h-full text-hermes-muted text-sm">
      <div className="text-center">
        <Layers size={40} className="mx-auto mb-3 opacity-30" />
        <p>Select a skill to view details</p>
      </div>
    </div>
  );
}
