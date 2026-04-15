import { LeftPanel } from "@/components/LeftPanel";
import { Folder, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_SPACES = [
  { id: "1", name: "hermes-core", active: true },
  { id: "2", name: "personal-notes", active: false },
  { id: "3", name: "client-projects", active: false },
  { id: "4", name: "research", active: false },
];

export function SpacesSection() {
  return (
    <LeftPanel title="Spaces" onRefresh={() => {}} actions={
      <button className="p-1 rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors">
        <Plus size={14} />
      </button>
    }>
      <div className="px-1 py-1">
        {MOCK_SPACES.map((s) => (
          <div key={s.id} className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer",
            s.active ? "bg-row-selected" : "hover:bg-row-hover"
          )}>
            <Folder size={14} className={s.active ? "text-hermes-accent" : "text-hermes-muted"} />
            <span className="text-xs font-medium flex-1">{s.name}</span>
            {s.active && <Check size={12} className="text-hermes-accent" />}
          </div>
        ))}
      </div>
    </LeftPanel>
  );
}

export function SpacesMain() {
  return (
    <div className="flex items-center justify-center h-full text-hermes-muted text-sm">
      <div className="text-center">
        <Folder size={40} className="mx-auto mb-3 opacity-30" />
        <p>Active space: <strong className="text-foreground">hermes-core</strong></p>
      </div>
    </div>
  );
}
