import { FolderOpen, Plus, Search } from "lucide-react";
import { SystemResources } from "./SystemResources";
import { FileTree } from "./FileTree";

export function WorkspacePanel() {
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
        ~/workspace/hermes
      </div>

      {/* System Resources */}
      <SystemResources />

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        <FileTree />
      </div>

      {/* Preview placeholder */}
      <div className="border-t border-hermes-border px-3 py-4 text-center text-xs text-hermes-muted">
        Select a file to preview
      </div>
    </div>
  );
}
