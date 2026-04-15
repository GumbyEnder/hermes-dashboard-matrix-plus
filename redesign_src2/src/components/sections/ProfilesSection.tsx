import { useEffect, useState } from "react";
import { LeftPanel } from "@/components/LeftPanel";
import { User, Plus, Copy, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiGet, apiPost } from "@/lib/dashboard-api";
import { TextPreviewDialog } from "@/components/TextPreviewDialog";

export interface Profile {
  name: string;
  model?: string;
  provider?: string;
  is_active?: boolean;
  is_default?: boolean;
  has_env?: boolean;
  skill_count?: number;
  path?: string;
}

type ProfilesPayload = {
  profiles: Profile[];
  active?: string;
};

type ProfileContent = {
  name?: string;
  path?: string;
  config?: string;
  soul?: string;
  env?: string;
  config_path?: string;
  soul_path?: string;
  env_path?: string;
};

export function ProfilesSection() {
  return null;
}

export function ProfilesSectionWithState({ selected, onSelect }: { selected: string | null; onSelect: (name: string) => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    apiGet<ProfilesPayload>("/api/profiles")
      .then((data) => {
        const list = data.profiles || [];
        setProfiles(list);
        if (!selected && list.length) onSelect(list.find((p) => p.is_active)?.name || list[0].name);
      })
      .catch(() => setProfiles([]));
  }, []);

  return (
    <LeftPanel title="Profiles" onRefresh={() => window.location.reload()} actions={
      <button className="p-1 rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors">
        <Plus size={14} />
      </button>
    }>
      <div className="px-1 py-1">
        {profiles.length === 0 && <div className="px-3 py-2 text-xs text-hermes-muted">No profiles found.</div>}
        {profiles.map((profile) => (
          <div
            key={profile.name}
            onClick={() => onSelect(profile.name)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer group",
              selected === profile.name ? "bg-row-selected" : "hover:bg-row-hover"
            )}
          >
            <User size={14} className={selected === profile.name ? "text-hermes-accent" : "text-hermes-muted"} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium">{profile.name}</div>
              <div className="text-[10px] text-hermes-muted font-mono">{profile.model || "unknown model"}</div>
            </div>
            <div className="hidden group-hover:flex items-center gap-0.5">
              <button className="p-1 text-hermes-muted hover:text-foreground"><Copy size={10} /></button>
              <button className="p-1 text-hermes-muted hover:text-foreground"><Edit size={10} /></button>
            </div>
          </div>
        ))}
      </div>
    </LeftPanel>
  );
}

export function ProfilesMain({ selectedId }: { selectedId: string | null }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [content, setContent] = useState<ProfileContent | null>(null);
  const [soulEditorOpen, setSoulEditorOpen] = useState(false);

  useEffect(() => {
    apiGet<ProfilesPayload>("/api/profiles")
      .then((data) => setProfiles(data.profiles || []))
      .catch(() => setProfiles([]));
  }, []);

  const profile = profiles.find((p) => p.name === selectedId) || profiles.find((p) => p.is_active) || profiles[0] || null;

  useEffect(() => {
    if (!profile?.name) {
      setContent(null);
      return;
    }
    apiGet<ProfileContent>(`/api/profile/content?name=${encodeURIComponent(profile.name)}`)
      .then(setContent)
      .catch(() => setContent(null));
  }, [profile?.name]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full text-hermes-muted text-sm">
        <div className="text-center">
          <User size={40} className="mx-auto mb-3 opacity-30" />
          <p>No profile data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-hermes-border space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-hermes-accent/15 flex items-center justify-center">
            <User size={16} className="text-hermes-accent" />
          </div>
          <div>
            <h1 className="text-base font-bold font-mono">{profile.name}</h1>
            <div className="text-[11px] text-hermes-muted">{profile.provider || "provider unknown"} · {profile.model || "unknown model"}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        <div className="rounded-md border border-hermes-border bg-hermes-panel px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-hermes-muted">Profile Path</div>
          <div className="mt-2 text-xs font-mono text-foreground/85 break-all">{content?.path || profile.path || "Unknown"}</div>
        </div>

        <div className="rounded-md border border-hermes-border bg-hermes-panel">
          <div className="px-4 py-2 border-b border-hermes-border flex items-center gap-2">
            <span className="text-[11px] font-mono text-hermes-muted">SOUL.md</span>
            {content?.soul_path && <span className="text-[10px] text-hermes-muted truncate">{content.soul_path}</span>}
            <button type="button" onClick={() => setSoulEditorOpen(true)} className="ml-auto p-1 text-hermes-muted hover:text-foreground">
              <Edit size={12} />
            </button>
          </div>
          <div className="px-4 py-3">
            <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-foreground/90">{content?.soul || `# SOUL.md — ${profile.name}\n\nNo soul file configured.`}</pre>
          </div>
        </div>

        <div className="rounded-md border border-hermes-border bg-hermes-panel">
          <div className="px-4 py-2 border-b border-hermes-border flex items-center gap-2">
            <span className="text-[11px] font-mono text-hermes-muted">config.yaml</span>
            {content?.config_path && <span className="text-[10px] text-hermes-muted truncate">{content.config_path}</span>}
          </div>
          <div className="px-4 py-3">
            <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-foreground/90">{content?.config || "# config.yaml\n\nNo config file found."}</pre>
          </div>
        </div>

        {content?.env && (
          <div className="rounded-md border border-hermes-border bg-hermes-panel">
            <div className="px-4 py-2 border-b border-hermes-border flex items-center gap-2">
              <span className="text-[11px] font-mono text-hermes-muted">.env</span>
              {content?.env_path && <span className="text-[10px] text-hermes-muted truncate">{content.env_path}</span>}
            </div>
            <div className="px-4 py-3">
              <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-foreground/90">{content.env}</pre>
            </div>
          </div>
        )}
        {!content && (
          <div className="rounded-md border border-hermes-border bg-hermes-panel px-4 py-3 text-xs text-hermes-muted">
            Profile files could not be loaded.
          </div>
        )}
      </div>
      <TextPreviewDialog
        open={soulEditorOpen}
        onOpenChange={setSoulEditorOpen}
        title="SOUL.md"
        subtitle={content?.soul_path}
        content={content?.soul || ""}
        editable={Boolean(content?.soul_path)}
        onSave={content?.soul_path ? async (next) => {
          await apiPost("/api/text-file/save", { path: content.soul_path, content: next });
          setContent((prev) => prev ? { ...prev, soul: next } : prev);
        } : undefined}
      />
    </div>
  );
}
