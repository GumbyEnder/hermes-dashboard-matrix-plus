import { useEffect, useState } from "react";
import { Folder, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeftPanel } from "@/components/LeftPanel";
import { apiGet, apiPost } from "@/lib/dashboard-api";
import { FileTree } from "@/components/FileTree";
import { TextPreviewDialog } from "@/components/TextPreviewDialog";

type WorkspaceResponse = {
  workspaces: Array<{ path: string; name?: string }>;
  last?: string;
};

function textValue(value: unknown, fallback = "") {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    if ("path" in (value as Record<string, unknown>) && typeof (value as Record<string, unknown>).path === "string") {
      return String((value as Record<string, unknown>).path);
    }
    if ("name" in (value as Record<string, unknown>) && typeof (value as Record<string, unknown>).name === "string") {
      return String((value as Record<string, unknown>).name);
    }
  }
  return fallback;
}

export function SpacesSection({ selectedWorkspacePath, onWorkspaceSelect }: { selectedWorkspacePath: string | null; onWorkspaceSelect: (path: string | null) => void }) {
  const [workspaces, setWorkspaces] = useState<Array<{ path: string; name?: string }>>([]);
  const [last, setLast] = useState<string>("");

  const loadWorkspaces = async () => {
    try {
      const data = await apiGet<WorkspaceResponse>("/api/workspaces");
      setWorkspaces(data.workspaces || []);
      setLast(data.last || "");
      if (!selectedWorkspacePath && data.workspaces?.length) onWorkspaceSelect(data.last || data.workspaces[0].path);
    } catch {
      setWorkspaces([]);
      setLast("");
    }
  };

  useEffect(() => {
    void loadWorkspaces();
  }, [onWorkspaceSelect, selectedWorkspacePath]);

  return (
    <LeftPanel title="Spaces" onRefresh={() => window.location.reload()} actions={
      <button
        type="button"
        onClick={async () => {
          const path = window.prompt("Workspace path");
          if (!path?.trim()) return;
          const name = window.prompt("Workspace name (optional)") || "";
          try {
            await apiPost("/api/workspaces/add", { path: path.trim(), name: name.trim() });
            await loadWorkspaces();
            onWorkspaceSelect(path.trim());
          } catch {}
        }}
        className="p-1 rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors"
      >
        <Plus size={14} />
      </button>
    }>
      <div className="px-1 py-1">
        {workspaces.length === 0 && <div className="px-3 py-2 text-xs text-hermes-muted">No workspaces found.</div>}
        {workspaces.map((workspace) => (
          <button key={textValue(workspace.path, textValue(workspace.name, "workspace"))} type="button" onClick={() => onWorkspaceSelect(textValue(workspace.path) || null)} className={cn(
            "flex w-full items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer text-left",
            textValue(workspace.path) === selectedWorkspacePath ? "bg-row-selected" : "hover:bg-row-hover"
          )}>
            <Folder size={14} className={textValue(workspace.path) === selectedWorkspacePath ? "text-hermes-accent" : "text-hermes-muted"} />
            <span className="text-xs font-medium flex-1 truncate">{textValue(workspace.name, textValue(workspace.path, "workspace"))}</span>
            {textValue(workspace.path) === textValue(last) && <Check size={12} className="text-hermes-accent" />}
          </button>
        ))}
      </div>
    </LeftPanel>
  );
}

export function SpacesMain({ selectedWorkspacePath, onWorkspaceSelect }: { selectedWorkspacePath: string | null; onWorkspaceSelect: (path: string | null) => void }) {
  const [workspaces, setWorkspaces] = useState<Array<{ path: string; name?: string }>>([]);
  const [last, setLast] = useState<string>("");
  const [browserSessionId, setBrowserSessionId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ path: string; content: string } | null>(null);

  useEffect(() => {
    apiGet<WorkspaceResponse>("/api/workspaces")
      .then((data) => {
        setWorkspaces(data.workspaces || []);
        setLast(data.last || "");
      })
      .catch(() => {
        setWorkspaces([]);
        setLast("");
      });
  }, []);

  const selected = workspaces.find((workspace) => textValue(workspace.path) === selectedWorkspacePath) || null;

  useEffect(() => {
    if (!selectedWorkspacePath) {
      setBrowserSessionId(null);
      return;
    }
    let mounted = true;
    apiPost<{ session: { session_id: string } }>("/api/session/new", { workspace: selectedWorkspacePath })
      .then((data) => {
        if (mounted) setBrowserSessionId(data.session.session_id);
      })
      .catch(() => {
        if (mounted) setBrowserSessionId(null);
      });
    return () => {
      mounted = false;
    };
  }, [selectedWorkspacePath]);

  const handleFileSelect = async (path: string) => {
    if (!browserSessionId) return;
    try {
      const data = await apiGet<{ path: string; content: string }>(`/api/file/read?session_id=${encodeURIComponent(browserSessionId)}&path=${encodeURIComponent(path)}`);
      setPreview(data);
    } catch {
      setPreview({ path, content: "Unable to preview this file." });
    }
  };

  return (
    <div className="flex h-full text-hermes-muted text-sm p-4 gap-4">
      <div className="w-full max-w-sm shrink-0">
        <div className="text-center mb-4">
          <Folder size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-foreground">Live workspaces</p>
        </div>
        <div className="grid gap-2">
          {workspaces.map((workspace) => (
            <button key={textValue(workspace.path, textValue(workspace.name, "workspace"))} type="button" onClick={() => onWorkspaceSelect(textValue(workspace.path) || null)} className={cn("rounded-md border border-hermes-border bg-hermes-panel px-3 py-2 text-left", textValue(workspace.path) === selectedWorkspacePath && "border-hermes-accent/40 bg-row-selected")}>
              <div className="text-sm font-medium">{textValue(workspace.name, textValue(workspace.path, "workspace"))}</div>
              <div className="text-[11px] text-hermes-muted mt-1">{textValue(workspace.path) === textValue(last) ? "Last used workspace" : "Available workspace"}</div>
            </button>
          ))}
          {workspaces.length === 0 && <div className="text-sm text-hermes-muted">No workspace data available.</div>}
        </div>
        {selected && (
          <div className="mt-4 rounded-md border border-hermes-border bg-hermes-panel px-3 py-3">
            <div className="text-sm font-semibold">{textValue(selected.name, "Workspace")}</div>
            <div className="mt-1 text-xs font-mono text-hermes-muted">{textValue(selected.path)}</div>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 rounded-md border border-hermes-border bg-hermes-elev overflow-hidden">
        <div className="px-4 py-3 border-b border-hermes-border">
          <div className="text-sm font-semibold">Workspace Explorer</div>
          <div className="text-[11px] text-hermes-muted font-mono truncate">{selectedWorkspacePath || "Select a workspace"}</div>
        </div>
        <div className="h-[calc(100%-57px)] overflow-auto">
          {browserSessionId ? (
            <FileTree sessionId={browserSessionId} onFileSelect={handleFileSelect} />
          ) : (
            <div className="p-4 text-xs text-hermes-muted">Select a workspace to explore files.</div>
          )}
        </div>
      </div>
      <TextPreviewDialog
        open={Boolean(preview)}
        onOpenChange={(open) => { if (!open) setPreview(null); }}
        title={preview?.path || "File Preview"}
        subtitle={selectedWorkspacePath || undefined}
        content={preview?.content || ""}
      />
    </div>
  );
}
