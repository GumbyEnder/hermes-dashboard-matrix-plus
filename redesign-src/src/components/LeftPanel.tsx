import { ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface LeftPanelProps {
  title: string;
  onRefresh?: () => void;
  actions?: ReactNode;
  children: ReactNode;
}

export function LeftPanel({ title, onRefresh, actions, children }: LeftPanelProps) {
  return (
    <div className="flex flex-col h-full bg-hermes-elev">
      <div className="flex items-center justify-between px-3 py-2 border-b border-hermes-border">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <div className="flex items-center gap-1">
          {actions}
          {onRefresh && (
            <button onClick={onRefresh} className="p-1 rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors">
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
