import { useEffect, useState } from "react";
import { Brain, Save, X } from "lucide-react";
import { apiGet, apiPost } from "@/lib/dashboard-api";

type MemoryPayload = {
  memory: string;
  user: string;
  memory_path?: string;
  user_path?: string;
  memory_mtime?: number | null;
  user_mtime?: number | null;
};

export function MemorySection() {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="text-center text-hermes-muted text-sm">
        <Brain size={40} className="mx-auto mb-3 opacity-30" />
        <p>Live memory appears in the main panel</p>
      </div>
    </div>
  );
}

export function MemoryMain() {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState("");
  const [path, setPath] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiGet<MemoryPayload>("/api/memory")
      .then((data) => {
        setContent(data.memory || "");
        setPath(data.memory_path || "");
      })
      .catch(() => {
        setContent("");
        setPath("");
      });
  }, []);

  const save = async () => {
    setStatus("Saving…");
    try {
      await apiPost("/api/memory/write", { section: "memory", content });
      setEditing(false);
      setStatus("Saved");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-hermes-border">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-hermes-accent" />
          <span className="text-sm font-semibold">Live Memory</span>
        </div>
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button onClick={save} className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-success/20 text-success hover:bg-success/30 transition-colors">
                <Save size={12} /> Save
              </button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-hermes-muted hover:bg-row-hover transition-colors">
                <X size={12} /> Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="px-2 py-1 rounded text-xs text-hermes-muted hover:bg-row-hover transition-colors">
              Edit
            </button>
          )}
        </div>
      </div>
      <div className="px-4 py-2 text-[11px] text-hermes-muted border-b border-hermes-border">
        {path || "No memory file"} {status ? `· ${status}` : ""}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full bg-hermes-code rounded-md p-3 font-mono text-sm resize-none outline-none border border-hermes-border focus:border-hermes-accent transition-colors"
          />
        ) : (
          <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{content || "No memory content found."}</pre>
        )}
      </div>
    </div>
  );
}
