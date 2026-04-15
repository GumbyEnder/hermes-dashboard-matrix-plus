import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiGet } from "@/lib/dashboard-api";

type Entry = {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number | null;
};

type FileTreeProps = {
  sessionId: string | null;
  onFileSelect: (path: string) => void;
};

function TreeItem({
  node,
  depth = 0,
  sessionId,
  onFileSelect,
}: {
  node: Entry;
  depth?: number;
  sessionId: string;
  onFileSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const [children, setChildren] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (node.type !== "dir" || !open || loaded) return;
    let mounted = true;
    apiGet<{ entries: Entry[] }>(`/api/list?session_id=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(node.path)}`)
      .then((data) => {
        if (mounted) {
          setChildren(data.entries || []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setChildren([]);
          setLoaded(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, [loaded, node.path, node.type, open, sessionId]);

  if (node.type === "file") {
    return (
      <button
        type="button"
        onClick={() => onFileSelect(node.path)}
        className="flex cursor-pointer items-center gap-1.5 w-full px-2 py-0.5 text-xs hover:bg-row-hover rounded transition-colors"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <File size={12} className="text-hermes-muted shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex cursor-pointer items-center gap-1.5 w-full px-2 py-0.5 text-xs hover:bg-row-hover rounded transition-colors font-medium"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <ChevronRight size={12} className={cn("transition-transform shrink-0 text-hermes-muted", open && "rotate-90")} />
        {open ? <FolderOpen size={12} className="text-hermes-accent shrink-0" /> : <Folder size={12} className="text-hermes-accent shrink-0" />}
        <span className="truncate">{node.name}</span>
      </button>
      {open && children.map((child) => (
        <TreeItem key={child.path} node={child} depth={depth + 1} sessionId={sessionId} onFileSelect={onFileSelect} />
      ))}
    </div>
  );
}

export function FileTree({ sessionId, onFileSelect }: FileTreeProps) {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (!sessionId) {
      setEntries([]);
      return;
    }
    let mounted = true;
    apiGet<{ entries: Entry[] }>(`/api/list?session_id=${encodeURIComponent(sessionId)}&path=.`)
      .then((data) => {
        if (mounted) setEntries(data.entries || []);
      })
      .catch(() => {
        if (mounted) setEntries([]);
      });
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  if (!sessionId) {
    return <div className="px-3 py-3 text-xs text-hermes-muted">Open or create a session to browse workspace files.</div>;
  }

  return (
    <div className="py-1">
      {entries.map((node) => (
        <TreeItem key={node.path} node={node} sessionId={sessionId} onFileSelect={onFileSelect} />
      ))}
    </div>
  );
}
