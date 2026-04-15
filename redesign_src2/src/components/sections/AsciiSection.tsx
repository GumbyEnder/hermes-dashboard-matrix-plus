import { useState } from "react";
import { LeftPanel } from "@/components/LeftPanel";
import { Terminal, Upload, Edit3, Save, RotateCcw } from "lucide-react";

const STARTING_ART = "";

export function AsciiSidebar() {
  return (
    <LeftPanel title="ASCII Art" onRefresh={() => {}}>
      <div className="px-3 py-2 space-y-1">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-row-hover cursor-pointer transition-colors">
          <Terminal size={12} className="text-hermes-accent shrink-0" />
          <span className="text-xs">Current canvas</span>
        </div>
        <div className="border-t border-hermes-border my-2" />
        <div className="text-[10px] text-hermes-muted px-2">Upload or paste art in the main panel</div>
      </div>
    </LeftPanel>
  );
}

export function AsciiMain() {
  const [art, setArt] = useState(STARTING_ART);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(art);

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.ans,.asc";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result as string;
          setArt(text);
          setDraft(text);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-hermes-border">
        <Terminal size={16} className="text-hermes-accent" />
        <span className="text-sm font-semibold">ASCII Art Studio</span>
        <div className="flex-1" />
        <button onClick={handleUpload} className="flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors">
          <Upload size={12} /> Upload
        </button>
        {editing ? (
          <>
            <button onClick={() => { setArt(draft); setEditing(false); }} className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-hermes-accent/20 text-hermes-accent hover:bg-hermes-accent/30 transition-colors">
              <Save size={12} /> Save
            </button>
            <button onClick={() => { setDraft(art); setEditing(false); }} className="flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors">
              <RotateCcw size={12} /> Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors">
            <Edit3 size={12} /> Edit
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center p-8">
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-full font-mono text-xs leading-tight bg-transparent border border-hermes-border rounded-md p-4 resize-none focus:outline-none focus:border-hermes-accent text-hermes-accent"
            spellCheck={false}
          />
        ) : art ? (
          <pre className="font-mono text-xs sm:text-sm leading-tight text-hermes-accent whitespace-pre select-all" style={{ textShadow: "0 0 8px hsl(var(--hermes-accent) / 0.4)" }}>
            {art}
          </pre>
        ) : (
          <div className="text-center text-hermes-muted text-sm">
            <Terminal size={32} className="mx-auto mb-3 opacity-30" />
            <p>No art loaded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
