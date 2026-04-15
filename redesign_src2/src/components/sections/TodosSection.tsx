import { useEffect, useState } from "react";
import { ListChecks, Circle, Plus } from "lucide-react";
import { apiGet, apiPost } from "@/lib/dashboard-api";

type NotesPayload = { notes: string[] };

type TodoItem = {
  text: string;
  raw: string;
  done: boolean;
};

function parseTodos(lines: string[]) {
  return lines
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+\[( |x|X)\]\s+/.test(line))
    .map<TodoItem>((line) => ({
      raw: line,
      done: /\[(x|X)\]/.test(line),
      text: line.replace(/^[-*]\s+\[( |x|X)\]\s+/, ""),
    }));
}

export function TodosSection() {
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useEffect(() => {
    apiGet<NotesPayload>("/api/notes")
      .then((data) => setTodos(parseTodos(data.notes || []).slice(0, 6)))
      .catch(() => setTodos([]));
  }, []);

  return (
    <div className="flex items-center justify-center h-full p-4 text-hermes-muted text-sm">
      <div className="text-center">
        <ListChecks size={40} className="mx-auto mb-3 opacity-30" />
        <p>Notes-backed todos shown in the main panel</p>
      </div>
    </div>
  );
}

export function TodosMain() {
  const [lines, setLines] = useState<string[]>([]);

  const load = async () => {
    try {
      const data = await apiGet<NotesPayload>("/api/notes");
      setLines(data.notes || []);
    } catch {
      setLines([]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const items = parseTodos(lines);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-hermes-border">
        <div className="flex items-center gap-2">
          <ListChecks size={16} className="text-hermes-accent" />
          <span className="text-sm font-semibold">Hermes Todo List</span>
        </div>
        <button
          type="button"
          onClick={async () => {
            const text = window.prompt("New todo");
            if (!text?.trim()) return;
            const nextLines = [...lines, `- [ ] ${text.trim()}`];
            await apiPost("/api/notes/save", { content: nextLines.join("\n") });
            setLines(nextLines);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-hermes-muted hover:bg-row-hover transition-colors"
        >
          <Plus size={12} /> Add
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {items.length === 0 && <div className="text-sm text-hermes-muted">No current todos in Hermes Notes.</div>}
        {items.map((item, index) => (
          <div key={`${item.raw}-${index}`} className="px-3 py-2 rounded-md hover:bg-row-hover transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <Circle size={16} className={`shrink-0 ${item.done ? "text-success" : "text-hermes-muted"}`} />
              <span className="text-sm">{item.text || "todo"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
