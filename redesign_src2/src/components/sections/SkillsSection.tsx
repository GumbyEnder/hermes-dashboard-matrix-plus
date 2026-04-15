import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Layers, Power, Search } from "lucide-react";
import { LeftPanel } from "@/components/LeftPanel";
import { apiGet, apiPost } from "@/lib/dashboard-api";
import { cn } from "@/lib/utils";
import { TextPreviewDialog } from "@/components/TextPreviewDialog";

type Skill = {
  name?: string;
  category?: string;
  description?: string;
  path?: string;
};

type SkillContent = {
  success?: boolean;
  name?: string;
  description?: string;
  tags?: string[];
  content?: string;
};

export function SkillsSection({ selectedSkillName, onSkillSelect }: { selectedSkillName: string | null; onSkillSelect: (name: string | null) => void }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [installedNames, setInstalledNames] = useState<Set<string>>(new Set());
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    apiGet<{ skills: Skill[] }>("/api/skills")
      .then((data) => {
        const list = data.skills || [];
        setSkills(list);
        setInstalledNames(new Set(list.map((skill) => skill.name || "").filter(Boolean)));
        if (!selectedSkillName && list.length) onSkillSelect(list[0].name || null);
        const nextState: Record<string, boolean> = {};
        for (const skill of list) {
          nextState[skill.category || "uncategorized"] = false;
        }
        setOpenCategories(nextState);
      })
      .catch(() => setSkills([]));
  }, [onSkillSelect, selectedSkillName]);

  const grouped = useMemo(() => {
    const map = new Map<string, Skill[]>();
    for (const skill of skills.slice().sort((a, b) => `${a.category || ""}${a.name || ""}`.localeCompare(`${b.category || ""}${b.name || ""}`))) {
      const category = skill.category || "uncategorized";
      const arr = map.get(category) || [];
      arr.push(skill);
      map.set(category, arr);
    }
    return Array.from(map.entries());
  }, [skills]);

  return (
    <LeftPanel title="Skills" onRefresh={() => window.location.reload()} actions={
      <button className="p-1 rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors">
        <Search size={14} />
      </button>
    }>
      <div className="px-1 py-1">
        {grouped.length === 0 && <div className="px-3 py-2 text-xs text-hermes-muted">No skills loaded.</div>}
        {grouped.map(([category, items]) => {
          const open = openCategories[category] ?? false;
          return (
            <div key={category} className="mb-1">
              <button
                type="button"
                onClick={() => setOpenCategories((prev) => ({ ...prev, [category]: !open }))}
                className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-hermes-muted hover:bg-row-hover rounded-md"
              >
                <ChevronRight size={12} className={cn("transition-transform", open && "rotate-90")} />
                <span className="truncate">{category} ({items.length})</span>
              </button>
              {open && items.map((skill, index) => (
                <button key={`${skill.name}-${index}`} type="button" onClick={() => onSkillSelect(skill.name || null)} className={cn("flex w-full items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer text-left", skill.name === selectedSkillName ? "bg-row-selected" : "hover:bg-row-hover")}>
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", installedNames.has(skill.name || "") ? "bg-badge-live" : "bg-badge-idle")} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{skill.name || "skill"}</div>
                    <div className="text-[10px] text-hermes-muted truncate">{installedNames.has(skill.name || "") ? "enabled" : "disabled"}</div>
                  </div>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </LeftPanel>
  );
}

export function SkillsMain({ selectedSkillName, onSkillSelect }: { selectedSkillName: string | null; onSkillSelect: (name: string | null) => void }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [installedSkills, setInstalledSkills] = useState<Skill[]>([]);
  const [content, setContent] = useState<SkillContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const loadInstalled = async () => {
    try {
      const data = await apiGet<{ skills: Skill[] }>("/api/skills");
      setInstalledSkills(data.skills || []);
    } catch {
      setInstalledSkills([]);
    }
  };

  useEffect(() => {
    apiGet<{ skills: Skill[] }>("/api/skills/catalog")
      .then((data) => {
        const list = data.skills || [];
        setSkills(list);
        if (!selectedSkillName && list.length) onSkillSelect(list[0].name || null);
      })
      .catch(() => setSkills([]));
    void loadInstalled();
  }, [onSkillSelect, selectedSkillName]);

  useEffect(() => {
    if (!selectedSkillName) {
      setContent(null);
      return;
    }
    apiGet<SkillContent>(`/api/skills/content?name=${encodeURIComponent(selectedSkillName)}`)
      .then(setContent)
      .catch(() => setContent(null));
  }, [selectedSkillName]);

  const selected = skills.find((skill) => skill.name === selectedSkillName) || null;
  const installed = Boolean(selectedSkillName && installedSkills.some((skill) => skill.name === selectedSkillName));

  return (
    <div className="flex h-full text-hermes-muted text-sm p-4">
      <div className="w-full max-w-4xl">
        {!selected && (
          <div className="text-center mb-4">
            <Layers size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-foreground">Select a skill to inspect</p>
          </div>
        )}
        {selected && (
          <div className="space-y-3">
            <div className="rounded-md border border-hermes-border bg-hermes-panel px-4 py-3">
              <div className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                <Layers size={16} className="text-hermes-accent" />
                <div>
                  <div className="text-sm font-semibold">{selected.name}</div>
                  <div className="text-[11px] text-hermes-muted">{selected.category || "uncategorized"} · {installed ? "enabled" : "disabled"}</div>
                </div>
                </div>
                <button
                  type="button"
                  disabled={saving || !selected?.name}
                  onClick={async () => {
                    if (!selected?.name) return;
                    setSaving(true);
                    try {
                      if (installed) {
                        await apiPost("/api/skills/delete", { name: selected.name });
                      } else {
                        await apiPost("/api/skills/save", {
                          name: selected.name,
                          category: selected.category || "",
                          content: content?.content || `# ${selected.name}\n\n${content?.description || selected.description || ""}`.trim(),
                        });
                      }
                      await loadInstalled();
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className={`rounded px-3 py-1.5 text-xs flex items-center gap-1.5 ${installed ? "bg-danger/15 text-danger" : "bg-hermes-accent/15 text-hermes-accent"}`}
                >
                  <Power size={12} />
                  {saving ? "Working…" : installed ? "Disable Skill" : "Enable Skill"}
                </button>
              </div>
              <div className="mt-2 text-xs text-hermes-muted">{content?.description || selected.description || "No description available."}</div>
            </div>
            <div className="rounded-md border border-hermes-border bg-hermes-panel px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-hermes-muted mb-2">Skill Content</div>
              <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed text-foreground/90">{content?.content || "No skill content available."}</pre>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setEditorOpen(true)}
                  className="rounded px-3 py-1 text-xs bg-hermes-panel text-hermes-muted hover:text-foreground"
                >
                  Edit SKILL.md
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <TextPreviewDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title="SKILL.md"
        subtitle={selected?.name}
        content={content?.content || ""}
        editable={Boolean(selected?.name)}
        onSave={selected?.name ? async (next) => {
          await apiPost("/api/skills/save", {
            name: selected.name,
            category: selected.category || "",
            content: next,
          });
          setContent((prev) => prev ? { ...prev, content: next } : { name: selected.name, content: next });
          await loadInstalled();
        } : undefined}
      />
    </div>
  );
}
