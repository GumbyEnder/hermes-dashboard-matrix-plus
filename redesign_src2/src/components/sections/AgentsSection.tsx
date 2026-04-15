import { useEffect, useMemo, useState } from "react";
import { Bot, Plus, Copy, Power, Trash2, CircleDot, CheckCircle2, Pencil } from "lucide-react";
import { LeftPanel } from "@/components/LeftPanel";
import { apiGet, apiPost, formatAge, formatNumber, usePollingQuery } from "@/lib/dashboard-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextPreviewDialog } from "@/components/TextPreviewDialog";
import { Input } from "@/components/ui/input";

type AgentProfile = {
  name: string;
  model?: string;
  provider?: string;
  is_active?: boolean;
  is_default?: boolean;
  gateway_running?: boolean;
  has_env?: boolean;
  skill_count?: number;
  path?: string;
};

type ProfilesPayload = {
  profiles: AgentProfile[];
  active?: string;
};

type SessionSummary = {
  session_id?: string;
  title?: string;
  updated_at?: number;
  created_at?: number;
  profile?: string;
  model?: string;
  message_count?: number;
  input_tokens?: number;
  output_tokens?: number;
  estimated_cost?: number;
  pinned?: boolean;
  archived?: boolean;
  project_id?: string | null;
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

type CronJob = {
  id?: string;
  name?: string;
  prompt?: string;
  schedule?: { display?: string; expr?: string; kind?: string } | string;
  schedule_display?: string;
  enabled?: boolean;
  last_run?: string | null;
  last_run_at?: string | null;
  next_run_at?: string | null;
  state?: string;
  last_status?: string | null;
};

type GatewayStatus = {
  ok?: boolean;
  profile?: string;
  service?: string;
  active?: boolean;
  enabled?: boolean;
  installed?: boolean;
  status?: string;
  message?: string;
};

type GatewayLogs = {
  ok?: boolean;
  profile?: string;
  service?: string;
  logs?: string;
  installed?: boolean;
};

function cronTextValue(value: unknown, fallback = "unknown") {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    if ("display" in (value as Record<string, unknown>) && typeof (value as Record<string, unknown>).display === "string") {
      return String((value as Record<string, unknown>).display);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function cronScheduleLabel(job: CronJob) {
  return cronTextValue(job.schedule_display || job.schedule, "manual");
}

function cronLastLabel(job: CronJob) {
  return cronTextValue(job.last_run_at || job.last_run || job.last_status || job.state, "pending");
}

function cronJobLabel(job: CronJob) {
  return cronTextValue(job.name || job.id, "unnamed job");
}

function statusTone(profile: AgentProfile) {
  if (profile.gateway_running) return "bg-success";
  if (profile.is_active) return "bg-hermes-accent";
  return "bg-badge-idle";
}

async function promptCreateProfile(selectedName?: string | null) {
  const name = window.prompt("New agent profile name", "");
  if (!name) return null;
  const clone = selectedName && window.confirm(`Clone config from "${selectedName}"?`);
  return apiPost<{ ok: boolean; profile: AgentProfile }>("/api/profile/create", {
    name,
    clone_from: clone ? selectedName : undefined,
    clone_config: Boolean(clone),
  });
}

export function AgentsSection({ selectedAgent, onAgentSelect }: { selectedAgent: string | null; onAgentSelect: (name: string | null) => void }) {
  const { data, refresh } = usePollingQuery(
    () => apiGet<ProfilesPayload>("/api/profiles", { quiet: true }),
    { initialData: { profiles: [], active: undefined }, intervalMs: 30000, quiet: true },
  );
  const profiles = useMemo(() => data.profiles || [], [data.profiles]);

  useEffect(() => {
    if (!selectedAgent && profiles.length) {
      onAgentSelect(profiles.find((profile) => profile.is_active)?.name || profiles[0].name);
    }
  }, [profiles, selectedAgent, onAgentSelect]);

  return (
    <LeftPanel
      title="Agents"
      onRefresh={() => void refresh()}
      actions={
        <button
          type="button"
          onClick={async () => {
            const created = await promptCreateProfile(selectedAgent);
            if (created?.profile?.name) {
              await refresh();
              onAgentSelect(created.profile.name);
            }
          }}
          className="p-1 rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors"
        >
          <Plus size={14} />
        </button>
      }
    >
      <div className="px-1 py-1">
        {profiles.length === 0 && <div className="px-3 py-2 text-xs text-hermes-muted">No agents found.</div>}
        {profiles.map((profile) => (
          <button
            type="button"
            key={profile.name}
            onClick={() => onAgentSelect(profile.name)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-left",
              selectedAgent === profile.name ? "bg-row-selected" : "hover:bg-row-hover",
            )}
          >
            <div className="relative shrink-0">
              <Bot size={14} className={selectedAgent === profile.name ? "text-hermes-accent" : "text-hermes-muted"} />
              <span className={cn("absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full", statusTone(profile))} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span className="truncate">{profile.name}</span>
                {profile.is_active && <CircleDot size={10} className="text-success shrink-0" />}
                {profile.is_default && <CheckCircle2 size={10} className="text-hermes-accent shrink-0" />}
              </div>
              <div className="truncate text-[10px] font-mono text-hermes-muted">
                {profile.model || "unknown model"} · {profile.provider || "unknown provider"}
              </div>
            </div>
          </button>
        ))}
      </div>
    </LeftPanel>
  );
}

export function AgentsMain({ selectedAgent, onAgentSelect }: { selectedAgent: string | null; onAgentSelect: (name: string | null) => void }) {
  const { data: profileData, refresh: refreshProfiles } = usePollingQuery(
    () => apiGet<ProfilesPayload>("/api/profiles", { quiet: true }),
    { initialData: { profiles: [], active: undefined }, intervalMs: 30000, quiet: true },
  );
  const { data: sessionData, refresh: refreshSessions } = usePollingQuery(
    () => apiGet<{ sessions: SessionSummary[] }>("/api/sessions", { quiet: true }),
    { initialData: { sessions: [] }, intervalMs: 30000, quiet: true },
  );
  const { data: cronData, refresh: refreshCrons } = usePollingQuery(
    () => apiGet<{ jobs: CronJob[] }>("/api/crons", { quiet: true }),
    { initialData: { jobs: [] }, intervalMs: 30000, quiet: true },
  );
  const profiles = profileData.profiles || [];
  const selectedProfileName = profiles.find((item) => item.name === selectedAgent)?.name
    || profiles.find((item) => item.is_active)?.name
    || profiles[0]?.name
    || null;
  const { data: gatewayStatus, refresh: refreshGatewayStatus } = usePollingQuery(
    () => apiGet<GatewayStatus>(`/api/gateway/status?profile=${encodeURIComponent(selectedProfileName || "default")}`, { quiet: true }),
    { initialData: {}, intervalMs: 30000, quiet: true, enabled: Boolean(selectedProfileName) },
  );
  const { data: gatewayLogs, refresh: refreshGatewayLogs } = usePollingQuery(
    () => apiGet<GatewayLogs>(`/api/gateway/logs?profile=${encodeURIComponent(selectedProfileName || "default")}&lines=120`, { quiet: true }),
    { initialData: {}, intervalMs: 30000, quiet: true, enabled: Boolean(selectedProfileName) },
  );
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [content, setContent] = useState<ProfileContent | null>(null);
  const [configEditorOpen, setConfigEditorOpen] = useState(false);
  const [soulEditorOpen, setSoulEditorOpen] = useState(false);
  const [sessionQuery, setSessionQuery] = useState("");

  const profile = profiles.find((item) => item.name === selectedAgent) || profiles.find((item) => item.is_active) || profiles[0] || null;
  const sessions = useMemo(
    () => (sessionData.sessions || [])
      .filter((session) => (session.profile || "default") === (profile?.name || ""))
      .sort((a, b) => Number(b.updated_at || b.created_at || 0) - Number(a.updated_at || a.created_at || 0)),
    [profile?.name, sessionData.sessions],
  );

  const totalMessages = sessions.reduce((sum, session) => sum + Number(session.message_count || 0), 0);
  const totalTokens = sessions.reduce((sum, session) => sum + Number(session.input_tokens || 0) + Number(session.output_tokens || 0), 0);
  const totalCost = sessions.reduce((sum, session) => sum + Number(session.estimated_cost || 0), 0);
  const jobs = cronData.jobs || [];
  const filteredSessions = useMemo(() => {
    const q = sessionQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((session) => {
      const haystack = [
        session.title,
        session.model,
        session.project_id,
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [sessionQuery, sessions]);

  useEffect(() => {
    if (!profile?.name) {
      setContent(null);
      return;
    }
    apiGet<ProfileContent>(`/api/profile/content?name=${encodeURIComponent(profile.name)}`, { quiet: true })
      .then(setContent)
      .catch(() => setContent(null));
  }, [profile?.name]);

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-hermes-muted">
        <div className="text-center">
          <Bot size={40} className="mx-auto mb-3 opacity-30" />
          <p>No agent profiles available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-hermes-border px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-hermes-accent/15">
              <Bot size={18} className="text-hermes-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold font-mono">{profile.name}</h1>
                {profile.is_active && <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">Active</span>}
                {profile.gateway_running && <span className="rounded-full bg-hermes-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-hermes-accent">Gateway Running</span>}
              </div>
              <div className="mt-1 text-[11px] text-hermes-muted">
                {profile.provider || "provider unknown"} · {profile.model || "unknown model"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busyAction === "switch" || profile.is_active}
              onClick={async () => {
                setBusyAction("switch");
                try {
                  await apiPost("/api/profile/switch", { name: profile.name });
                  await refreshProfiles();
                } finally {
                  setBusyAction(null);
                }
              }}
            >
              <Power size={14} className="mr-1.5" />
              Set Active
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busyAction === "clone"}
              onClick={async () => {
                setBusyAction("clone");
                try {
                  const created = await promptCreateProfile(profile.name);
                  if (created?.profile?.name) {
                    await refreshProfiles();
                    onAgentSelect(created.profile.name);
                  }
                } finally {
                  setBusyAction(null);
                }
              }}
            >
              <Copy size={14} className="mr-1.5" />
              Clone
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busyAction === "delete" || profile.is_default}
              onClick={async () => {
                if (!window.confirm(`Delete agent profile "${profile.name}"?`)) return;
                setBusyAction("delete");
                try {
                  await apiPost("/api/profile/delete", { name: profile.name });
                  await refreshProfiles();
                  onAgentSelect(null);
                } finally {
                  setBusyAction(null);
                }
              }}
            >
              <Trash2 size={14} className="mr-1.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-hermes-panel border border-hermes-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="cron">Cron</TabsTrigger>
            <TabsTrigger value="gateway">Gateway</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <MetricCard label="Sessions" value={formatNumber(sessions.length)} />
                  <MetricCard label="Messages" value={formatNumber(totalMessages)} />
                  <MetricCard label="Tokens" value={formatNumber(totalTokens)} />
                  <MetricCard label="Cost" value={`$${totalCost.toFixed(2)}`} />
                </div>

                <div className="rounded-lg border border-hermes-border bg-hermes-panel">
                  <div className="flex items-center justify-between border-b border-hermes-border px-4 py-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-hermes-muted">Recent Sessions</div>
                      <div className="text-[11px] text-hermes-muted">Latest Hermes sessions for this agent profile</div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => void refreshSessions()}>
                      Refresh
                    </Button>
                  </div>
                  <div className="divide-y divide-hermes-border/40">
                    {sessions.slice(0, 8).map((session) => (
                      <div key={session.session_id || `${session.title}-${session.updated_at}`} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{session.title || "Untitled session"}</div>
                            <div className="mt-1 text-[11px] text-hermes-muted">
                              {session.model || profile.model || "unknown model"} · {formatNumber(session.message_count || 0)} messages
                            </div>
                          </div>
                          <div className="shrink-0 text-[10px] font-mono text-hermes-muted">
                            {formatAge(session.updated_at || session.created_at || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {sessions.length === 0 && (
                      <div className="px-4 py-6 text-xs text-hermes-muted">No sessions found for this agent yet.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-hermes-muted">Agent Details</div>
                  <dl className="mt-3 space-y-3 text-sm">
                    <DetailRow label="Profile" value={profile.name} mono />
                    <DetailRow label="Path" value={profile.path || "unknown"} mono />
                    <DetailRow label="Provider" value={profile.provider || "unknown"} />
                    <DetailRow label="Model" value={profile.model || "unknown"} />
                    <DetailRow label="Skills" value={formatNumber(profile.skill_count || 0)} />
                    <DetailRow label="Env File" value={profile.has_env ? "present" : "not found"} />
                    <DetailRow label="Gateway" value={profile.gateway_running ? "running" : "stopped"} />
                    <DetailRow label="Default" value={profile.is_default ? "yes" : "no"} />
                  </dl>
                </div>

                <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-hermes-muted">Parity Status</div>
                  <div className="mt-3 space-y-2 text-[11px] text-hermes-muted">
                    <p>This is the first step toward HCI-style multi-agent management.</p>
                    <p>Next planned upgrades here: gateway controls, config editing, cron jobs, and per-agent logs.</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="mt-0">
            <div className="rounded-lg border border-hermes-border bg-hermes-panel">
              <div className="flex items-center justify-between border-b border-hermes-border px-4 py-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-hermes-muted">Sessions</div>
                  <div className="text-[11px] text-hermes-muted">Manage recent sessions for {profile.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-48">
                    <Input
                      value={sessionQuery}
                      onChange={(event) => setSessionQuery(event.target.value)}
                      placeholder="Search sessions"
                      className="h-8 bg-background/50 text-xs"
                    />
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => void refreshSessions()}>
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-hermes-border/40">
                {filteredSessions.map((session) => (
                  <div key={session.session_id || `${session.title}-${session.updated_at}`} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-medium">{session.title || "Untitled session"}</div>
                          {session.pinned && <span className="rounded-full bg-hermes-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-hermes-accent">Pinned</span>}
                          {session.archived && <span className="rounded-full bg-hermes-muted/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-hermes-muted">Archived</span>}
                        </div>
                        <div className="mt-1 text-[11px] text-hermes-muted">
                          {session.model || profile.model || "unknown model"} · {formatNumber(session.message_count || 0)} messages · {formatAge(session.updated_at || session.created_at || 0)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={() => {
                            if (!session.session_id) return;
                            window.open(`/api/session/export?session_id=${encodeURIComponent(session.session_id)}`, "_blank");
                          }}
                        >
                          Export
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={async () => {
                            if (!session.session_id) return;
                            await apiPost("/api/session/pin", { session_id: session.session_id, pinned: !session.pinned });
                            await refreshSessions();
                          }}
                        >
                          {session.pinned ? "Unpin" : "Pin"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={async () => {
                            if (!session.session_id) return;
                            await apiPost("/api/session/archive", { session_id: session.session_id, archived: !session.archived });
                            await refreshSessions();
                          }}
                        >
                          {session.archived ? "Unarchive" : "Archive"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={async () => {
                            if (!session.session_id || !window.confirm(`Clear messages from "${session.title || "Untitled session"}"?`)) return;
                            await apiPost("/api/session/clear", { session_id: session.session_id });
                            await refreshSessions();
                          }}
                        >
                          Clear
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={async () => {
                            const nextTitle = window.prompt("Rename session", session.title || "Untitled session");
                            if (!nextTitle || !session.session_id) return;
                            await apiPost("/api/session/rename", { session_id: session.session_id, title: nextTitle });
                            await refreshSessions();
                          }}
                        >
                          <Pencil size={12} className="mr-1.5" />
                          Rename
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={async () => {
                            if (!session.session_id || !window.confirm(`Delete session "${session.title || "Untitled session"}"?`)) return;
                            await apiPost("/api/session/delete", { session_id: session.session_id });
                            await refreshSessions();
                          }}
                        >
                          <Trash2 size={12} className="mr-1.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredSessions.length === 0 && (
                  <div className="px-4 py-6 text-xs text-hermes-muted">No sessions found for this agent yet.</div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="config" className="mt-0">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-hermes-border bg-hermes-panel">
                <div className="flex items-center justify-between border-b border-hermes-border px-4 py-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-hermes-muted">SOUL.md</div>
                    <div className="text-[11px] text-hermes-muted truncate">{content?.soul_path || "No soul file found"}</div>
                  </div>
                  {content?.soul_path && (
                    <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setSoulEditorOpen(true)}>
                      Edit
                    </Button>
                  )}
                </div>
                <div className="px-4 py-3">
                  <pre className="whitespace-pre-wrap break-words text-xs font-mono leading-relaxed text-foreground/90">
                    {content?.soul || `# SOUL.md — ${profile.name}\n\nNo soul file configured.`}
                  </pre>
                </div>
              </div>

              <div className="rounded-lg border border-hermes-border bg-hermes-panel">
                <div className="flex items-center justify-between border-b border-hermes-border px-4 py-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-hermes-muted">config.yaml</div>
                    <div className="text-[11px] text-hermes-muted truncate">{content?.config_path || "No config file found"}</div>
                  </div>
                  {content?.config_path && (
                    <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setConfigEditorOpen(true)}>
                      Edit
                    </Button>
                  )}
                </div>
                <div className="px-4 py-3">
                  <pre className="whitespace-pre-wrap break-words text-xs font-mono leading-relaxed text-foreground/90">
                    {content?.config || "# config.yaml\n\nNo config file found."}
                  </pre>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cron" className="mt-0">
            {!profile.is_active ? (
              <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4 text-sm text-hermes-muted">
                Cron management is currently scoped to the active Hermes profile. Switch this agent to active to manage its scheduled jobs.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-hermes-border bg-hermes-panel px-4 py-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-hermes-muted">Cron Jobs</div>
                    <div className="text-[11px] text-hermes-muted">Scheduled tasks for the active agent profile</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => void refreshCrons()}>
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px]"
                      onClick={async () => {
                        const prompt = window.prompt("Cron prompt", "");
                        if (!prompt) return;
                        const schedule = window.prompt("Cron schedule expression", "0 * * * *");
                        if (!schedule) return;
                        const name = window.prompt("Job name (optional)", "") || undefined;
                        await apiPost("/api/crons/create", { prompt, schedule, name });
                        await refreshCrons();
                      }}
                    >
                      <Plus size={12} className="mr-1.5" />
                      Add Job
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-hermes-border bg-hermes-panel">
                  <div className="divide-y divide-hermes-border/40">
                    {jobs.map((job) => (
                      <div key={job.id || job.name} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={cn("h-2 w-2 rounded-full", job.enabled === false ? "bg-badge-idle" : "bg-success")} />
                              <div className="truncate text-sm font-medium">{cronJobLabel(job)}</div>
                            </div>
                            <div className="mt-1 text-[11px] text-hermes-muted font-mono">
                              {cronScheduleLabel(job)} · {cronLastLabel(job)}
                            </div>
                            {job.prompt && (
                              <div className="mt-1 line-clamp-2 text-[11px] text-hermes-muted">
                                {job.prompt}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px]"
                              onClick={async () => {
                                if (!job.id) return;
                                await apiPost("/api/crons/run", { job_id: job.id });
                                await refreshCrons();
                              }}
                            >
                              Run
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px]"
                              onClick={async () => {
                                if (!job.id) return;
                                await apiPost(job.enabled === false ? "/api/crons/resume" : "/api/crons/pause", { job_id: job.id });
                                await refreshCrons();
                              }}
                            >
                              {job.enabled === false ? "Resume" : "Pause"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px]"
                              onClick={async () => {
                                if (!job.id || !window.confirm(`Delete cron job "${cronJobLabel(job)}"?`)) return;
                                await apiPost("/api/crons/delete", { job_id: job.id });
                                await refreshCrons();
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {jobs.length === 0 && (
                      <div className="px-4 py-6 text-xs text-hermes-muted">No cron jobs found for the active profile.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gateway" className="mt-0">
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4">
                <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-hermes-muted">Gateway Service</div>
                      <div className="mt-1 text-[11px] text-hermes-muted">
                        Systemd-backed Hermes gateway status for this profile.
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => { void refreshGatewayStatus(); void refreshGatewayLogs(); }}>
                      Refresh
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <RepoField label="Profile" value={profile.name} mono />
                    <RepoField label="Service" value={gatewayStatus.service || "unknown"} mono />
                    <RepoField label="Installed" value={gatewayStatus.installed ? "yes" : "no"} />
                    <RepoField label="Active" value={gatewayStatus.active ? "running" : "stopped"} />
                    <RepoField label="Enabled" value={gatewayStatus.enabled ? "yes" : "no"} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyAction === "gateway-start" || !gatewayStatus.installed || gatewayStatus.active}
                      onClick={async () => {
                        setBusyAction("gateway-start");
                        try {
                          await apiPost("/api/gateway/action", { profile: profile.name, action: "start" });
                          await refreshGatewayStatus();
                          await refreshGatewayLogs();
                        } finally {
                          setBusyAction(null);
                        }
                      }}
                    >
                      Start
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyAction === "gateway-stop" || !gatewayStatus.installed || !gatewayStatus.active}
                      onClick={async () => {
                        setBusyAction("gateway-stop");
                        try {
                          await apiPost("/api/gateway/action", { profile: profile.name, action: "stop" });
                          await refreshGatewayStatus();
                          await refreshGatewayLogs();
                        } finally {
                          setBusyAction(null);
                        }
                      }}
                    >
                      Stop
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyAction === "gateway-restart" || !gatewayStatus.installed}
                      onClick={async () => {
                        setBusyAction("gateway-restart");
                        try {
                          await apiPost("/api/gateway/action", { profile: profile.name, action: "restart" });
                          await refreshGatewayStatus();
                          await refreshGatewayLogs();
                        } finally {
                          setBusyAction(null);
                        }
                      }}
                    >
                      Restart
                    </Button>
                  </div>

                  {!gatewayStatus.installed && (
                    <div className="mt-4 rounded-md border border-hermes-border bg-background/40 px-3 py-3 text-[11px] text-hermes-muted">
                      No gateway service was detected for this profile yet.
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-hermes-muted">Status Summary</div>
                  <pre className="mt-3 whitespace-pre-wrap break-words text-[11px] font-mono leading-relaxed text-foreground/85">
                    {gatewayStatus.status || "No status output available."}
                  </pre>
                </div>
              </div>

              <div className="rounded-lg border border-hermes-border bg-hermes-panel">
                <div className="flex items-center justify-between border-b border-hermes-border px-4 py-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-hermes-muted">Gateway Logs</div>
                    <div className="text-[11px] text-hermes-muted">Recent journal output for the gateway service</div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => void refreshGatewayLogs()}>
                    Refresh
                  </Button>
                </div>
                <div className="p-4">
                  <pre className="min-h-[420px] whitespace-pre-wrap break-words rounded-md border border-hermes-border bg-background/40 p-3 text-[11px] font-mono leading-relaxed text-foreground/85">
                    {gatewayLogs.logs || "No gateway logs available."}
                  </pre>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <TextPreviewDialog
        open={configEditorOpen}
        onOpenChange={setConfigEditorOpen}
        title="config.yaml"
        subtitle={content?.config_path}
        content={content?.config || ""}
        editable={Boolean(content?.config_path)}
        onSave={content?.config_path ? async (next) => {
          await apiPost("/api/text-file/save", { path: content.config_path, content: next });
          setContent((prev) => prev ? { ...prev, config: next } : prev);
        } : undefined}
      />
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hermes-border bg-hermes-panel px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-hermes-muted">{label}</div>
      <div className="mt-2 text-lg font-semibold font-mono">{value}</div>
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3">
      <dt className="text-hermes-muted">{label}</dt>
      <dd className={cn("break-all text-foreground/90", mono && "font-mono text-[12px]")}>{value}</dd>
    </div>
  );
}
