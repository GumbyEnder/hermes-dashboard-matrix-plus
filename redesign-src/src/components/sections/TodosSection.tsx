import { ListChecks, Circle, CheckCircle2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_TODOS = [
  { id: "1", text: "Review PR #42 — auth middleware", done: false },
  { id: "2", text: "Update deployment docs", done: false },
  { id: "3", text: "Fix config loader edge case", done: true },
  { id: "4", text: "Set up monitoring alerts", done: false },
  { id: "5", text: "Migrate legacy endpoints", done: true },
];

export function TodosSection() {
  return (
    <div className="flex items-center justify-center h-full p-4 text-hermes-muted text-sm">
      <div className="text-center">
        <ListChecks size={40} className="mx-auto mb-3 opacity-30" />
        <p>Todos shown in main panel</p>
      </div>
    </div>
  );
}

export function TodosMain() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-hermes-border">
        <div className="flex items-center gap-2">
          <ListChecks size={16} className="text-hermes-accent" />
          <span className="text-sm font-semibold">Todos</span>
        </div>
        <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-hermes-muted hover:bg-row-hover transition-colors">
          <Plus size={12} /> Add
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {MOCK_TODOS.map((t) => (
          <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-row-hover transition-colors cursor-pointer">
            {t.done
              ? <CheckCircle2 size={16} className="text-success shrink-0" />
              : <Circle size={16} className="text-hermes-muted shrink-0" />}
            <span className={cn("text-sm", t.done && "line-through text-hermes-muted")}>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
