import { FolderOpen, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ActivityFeed } from "./ActivityFeed";
import { FileTree } from "./FileTree";
import { apiGet, apiPost } from "@/lib/dashboard-api";
import { TextPreviewDialog } from "@/components/TextPreviewDialog";

type SessionSummary = { session_id: string };
type Preview = { path: string; content: string; size?: number; lines?: number };
type SessionDetails = { session: { workspace?: string } };

export function WorkspacePanel({ sessionId }: { sessionId: string | null }) {
  const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(sessionId);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [workspacePath, setWorkspacePath] = useState<string>("");
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (sessionId) {
      setResolvedSessionId(sessionId);
      return;
    }
    let mounted = true;
    apiGet<{ sessions: SessionSummary[] }>("/api/sessions")
      .then((data) => {
        if (mounted) setResolvedSessionId(data.sessions?.[0]?.session_id || null);
      })
      .catch(() => {
        if (mounted) setResolvedSessionId(null);
      });
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  useEffect(() => {
    if (resolvedSessionId) return;
    let mounted = true;
    apiPost<{ session: SessionSummary }>("/api/session/new", {})
      .then((data) => {
        if (mounted) setResolvedSessionId(data.session.session_id);
      })
      .catch(() => {
        if (mounted) setResolvedSessionId(null);
      });
    return () => {
      mounted = false;
    };
  }, [resolvedSessionId]);

  useEffect(() => {
    if (!resolvedSessionId) {
      setWorkspacePath("");
      return;
    }
    apiGet<SessionDetails>(`/api/session?session_id=${encodeURIComponent(resolvedSessionId)}`)
      .then((data) => setWorkspacePath(data.session?.workspace || ""))
      .catch(() => setWorkspacePath(""));
  }, [resolvedSessionId]);

  const handleFileSelect = async (path: string) => {
    if (!resolvedSessionId) return;
    try {
      const data = await apiGet<Preview>(`/api/file/read?session_id=${encodeURIComponent(resolvedSessionId)}&path=${encodeURIComponent(path)}`);
      setPreview(data);
      setViewerOpen(true);
    } catch {
      setPreview({ path, content: "Unable to preview this file." });
      setViewerOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-hermes-elev border-l border-hermes-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-hermes-border">
        <div className="flex items-center gap-2">
          <FolderOpen size={14} className="text-hermes-accent" />
          <span className="text-sm font-semibold">Workspace</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors">
            <Search size={14} />
          </button>
          <button className="p-1 rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors">
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-3 py-1 text-[11px] text-hermes-muted border-b border-hermes-border font-mono">
        {workspacePath || "No workspace selected"}
      </div>

      {/* Activity Feed */}
      <div className="h-64 shrink-0 border-b border-hermes-border">
        <ActivityFeed />
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        <FileTree sessionId={resolvedSessionId} onFileSelect={handleFileSelect} />
      </div>

      <div className="border-t border-hermes-border px-3 py-3 text-xs">
        {preview ? (
          <div className="space-y-2">
            <div className="font-mono text-[11px] text-hermes-muted truncate">{preview.path}</div>
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              className="rounded px-2 py-1 text-[11px] bg-hermes-accent/15 text-hermes-accent"
            >
              Open Viewer
            </button>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-hermes-panel px-2 py-2 text-[11px] text-foreground">
              {preview.content}
            </pre>
          </div>
        ) : (
          <div className="text-center text-hermes-muted">Select a file to preview</div>
        )}
      </div>
      <TextPreviewDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        title={preview?.path || "File Preview"}
        subtitle={workspacePath}
        content={preview?.content || ""}
        editable={Boolean(resolvedSessionId && preview?.path.toLowerCase().endsWith(".md"))}
        onSave={preview && resolvedSessionId ? async (content) => {
          await apiPost("/api/file/save", { session_id: resolvedSessionId, path: preview.path, content });
          setPreview({ ...preview, content });
        } : undefined}
      />
    </div>
  );
}
