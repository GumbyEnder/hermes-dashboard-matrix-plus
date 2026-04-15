import { useEffect, useState } from "react";
import { Edit, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function TextPreviewDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  content,
  editable = false,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  content: string;
  editable?: boolean;
  onSave?: (content: string) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(content);
      setEditing(false);
      setSaving(false);
    }
  }, [content, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] bg-hermes-elev border-hermes-border">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-base font-mono">{title}</DialogTitle>
              {subtitle && <div className="text-xs text-hermes-muted font-mono truncate">{subtitle}</div>}
            </div>
            {editable && onSave && (
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        setSaving(true);
                        try {
                          await onSave(draft);
                          setEditing(false);
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className="rounded px-2 py-1 text-xs bg-hermes-accent/15 text-hermes-accent flex items-center gap-1.5"
                    >
                      <Save size={12} />
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(content);
                        setEditing(false);
                      }}
                      className="rounded px-2 py-1 text-xs bg-hermes-panel text-hermes-muted flex items-center gap-1.5"
                    >
                      <X size={12} />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="rounded px-2 py-1 text-xs bg-hermes-panel text-hermes-muted hover:text-foreground flex items-center gap-1.5"
                  >
                    <Edit size={12} />
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>
        <div className="min-h-0 overflow-auto rounded-md border border-hermes-border bg-hermes-code p-4">
          {editing ? (
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="w-full h-full min-h-[55vh] resize-none bg-transparent text-xs font-mono leading-relaxed text-foreground/90 outline-none"
            />
          ) : (
            <pre className="whitespace-pre-wrap break-words text-xs font-mono leading-relaxed text-foreground/90">
              {draft}
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
