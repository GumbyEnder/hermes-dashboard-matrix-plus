import { X } from "lucide-react";
import { THEMES, type ThemeId } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  theme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
}

export function SettingsModal({ open, onClose, theme, onThemeChange }: SettingsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-hermes-elev rounded-lg border border-hermes-border shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-hermes-border">
          <h2 className="text-sm font-semibold">Settings</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Theme */}
          <div>
            <label className="text-xs font-semibold text-hermes-muted uppercase tracking-wider block mb-2">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id)}
                  className={cn(
                    "px-3 py-2 rounded-md text-xs font-medium border transition-colors",
                    theme === t.id
                      ? "border-hermes-accent bg-hermes-accent/10 text-hermes-accent"
                      : "border-hermes-border text-hermes-muted hover:bg-row-hover hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Placeholder for more settings */}
          <div>
            <label className="text-xs font-semibold text-hermes-muted uppercase tracking-wider block mb-2">Model</label>
            <div className="bg-hermes-panel rounded-md border border-hermes-border px-3 py-2 text-xs font-mono text-foreground">
              claude-sonnet-4-20250514
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-hermes-muted uppercase tracking-wider block mb-2">Language</label>
            <div className="bg-hermes-panel rounded-md border border-hermes-border px-3 py-2 text-xs text-foreground">
              English
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
