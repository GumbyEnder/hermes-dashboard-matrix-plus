import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SHORTCUTS = [
  { section: "Navigation", items: [
    { keys: ["Ctrl", "1–9"], desc: "Switch sections" },
    { keys: ["Nav"], desc: "Notes / Best Practices in rail and palette" },
    { keys: ["Ctrl", "K"], desc: "Open command palette" },
    { keys: ["?"], desc: "Show this shortcut guide" },
  ]},
  { section: "Panels", items: [
    { keys: ["Ctrl", "B"], desc: "Toggle left panel" },
    { keys: ["Ctrl", "Shift", "B"], desc: "Toggle right panel" },
    { keys: ["Dbl-click"], desc: "Double-click divider to collapse" },
  ]},
  { section: "Actions", items: [
    { keys: ["Ctrl", "Enter"], desc: "Send message (Chat)" },
    { keys: ["Esc"], desc: "Close modals / palette" },
  ]},
];

interface ShortcutsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsOverlay({ open, onOpenChange }: ShortcutsOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-hermes-elev border-hermes-border">
        <DialogHeader>
          <DialogTitle className="text-foreground font-mono text-sm tracking-wider">
            ⌨ Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {SHORTCUTS.map((group) => (
            <div key={group.section}>
              <h3 className="text-[10px] text-hermes-muted uppercase tracking-widest font-semibold mb-2">
                {group.section}
              </h3>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div key={item.desc} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-row-hover transition-colors">
                    <span className="text-xs text-foreground">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd key={k} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold
                          bg-hermes-panel border border-hermes-border text-hermes-muted
                          shadow-[0_1px_0_hsl(var(--shadow)/0.3)]">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-hermes-muted text-center mt-3 font-mono">
          Press <kbd className="px-1 py-0.5 rounded text-[9px] bg-hermes-panel border border-hermes-border">?</kbd> or <kbd className="px-1 py-0.5 rounded text-[9px] bg-hermes-panel border border-hermes-border">Esc</kbd> to close
        </p>
      </DialogContent>
    </Dialog>
  );
}
