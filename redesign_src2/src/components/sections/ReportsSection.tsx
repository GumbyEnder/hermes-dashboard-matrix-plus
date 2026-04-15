import { useEffect, useMemo, useState } from "react";
import { BarChart3, TrendingUp, DollarSign, Zap, Activity } from "lucide-react";
import { apiGet, formatAge, formatNumber } from "@/lib/dashboard-api";

type OpsTokens = {
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_estimated_cost?: number;
  session_count?: number;
};

type ResourcePayload = {
  cpu_percent?: number;
  memory?: { percent?: number; used?: number; available?: number };
  disk?: { percent?: number; used?: number; free?: number };
  net_io?: Record<string, number>;
  boot_time?: number;
};

type Agent = {
  pid?: number;
  command?: string;
  cpu_percent?: number;
  mem_percent?: number;
  elapsed_seconds?: number;
};

type CostRow = {
  model?: string;
  project?: string;
  day?: string;
  sessions?: number;
  input_tokens?: number;
  output_tokens?: number;
  estimated_cost?: number;
};

type CostPayload = {
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_estimated_cost?: number;
  session_count?: number;
  by_model?: CostRow[];
  by_project?: CostRow[];
  by_day?: CostRow[];
  top_sessions?: Array<{
    session_id?: string;
    title?: string;
    model?: string;
    project?: string;
    profile?: string;
    updated_at?: number | string;
    input_tokens?: number;
    output_tokens?: number;
    estimated_cost?: number;
    message_count?: number;
  }>;
};

type DialogPayload = {
  session_count?: number;
  tool_count?: number;
  roots?: Array<{
    id?: string;
    title?: string;
    model?: string;
    profile?: string;
    project?: string;
    updated_at?: number | string;
    message_count?: number;
    children?: Array<{ id?: string; label?: string; name?: string; type?: string }>;
  }>;
};

type SessionSummary = {
  session_id?: string;
  title?: string;
  model?: string;
  profile?: string;
  workspace?: string;
  updated_at?: number;
  created_at?: number;
  message_count?: number;
  input_tokens?: number;
  output_tokens?: number;
  estimated_cost?: number;
};

type TimeRange = "1h" | "24h" | "7d" | "30d";

function bucketLabel(date: Date, range: TimeRange) {
  if (range === "1h" || range === "24h") {
    return `${date.getHours().toString().padStart(2, "0")}:00`;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function buildUsageSeries(sessions: SessionSummary[], range: TimeRange) {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  const bucketSize = range === "1h" ? 5 * 60 * 1000 : range === "24h" ? hour : day;
  const windowMs = range === "1h" ? hour : range === "24h" ? day : range === "7d" ? 7 * day : 30 * day;
  const bucketCount = Math.max(1, Math.ceil(windowMs / bucketSize));
  const start = now - bucketCount * bucketSize;
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const ts = start + index * bucketSize;
    return { ts, label: bucketLabel(new Date(ts), range), sessions: 0, tokens: 0, cost: 0 };
  });

  for (const session of sessions) {
    const updated = Number(session.updated_at || session.created_at || 0) * 1000;
    if (!updated || updated < start) continue;
    const bucketIndex = Math.min(buckets.length - 1, Math.max(0, Math.floor((updated - start) / bucketSize)));
    const bucket = buckets[bucketIndex];
    bucket.sessions += 1;
    bucket.tokens += Number(session.input_tokens || 0) + Number(session.output_tokens || 0);
    bucket.cost += Number(session.estimated_cost || 0);
  }

  return buckets;
}

function filterSessionsByRange(sessions: SessionSummary[], range: TimeRange) {
  const nowSeconds = Date.now() / 1000;
  const hour = 60 * 60;
  const day = 24 * hour;
  const windowSeconds = range === "1h" ? hour : range === "24h" ? day : range === "7d" ? 7 * day : 30 * day;
  return sessions.filter((session) => {
    const ts = Number(session.updated_at || session.created_at || 0);
    return ts > 0 && ts >= nowSeconds - windowSeconds;
  });
}

function MiniBars({
  title,
  metric,
  series,
}: {
  title: string;
  metric: "sessions" | "tokens" | "cost";
  series: Array<{ label: string; sessions: number; tokens: number; cost: number }>;
}) {
  const max = Math.max(1, ...series.map((item) => Number(item[metric] || 0)));
  return (
    <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
      <h2 className="text-xs font-semibold text-hermes-muted uppercase tracking-wider mb-3">{title}</h2>
      <div className="flex items-end gap-2 h-40">
        {series.map((item, index) => {
          const value = Number(item[metric] || 0);
          const height = `${Math.max(6, (value / max) * 100)}%`;
          return (
            <div key={`${item.label}-${index}`} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-2">
              <div className="text-[10px] text-hermes-muted font-mono">
                {metric === "cost" ? `$${value.toFixed(2)}` : formatNumber(value)}
              </div>
              <div className="w-full rounded-t bg-hermes-accent/70 hover:bg-hermes-accent transition-colors" style={{ height }} />
              <div className="text-[10px] text-hermes-muted font-mono truncate max-w-full">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReportsSection() {
  return (
    <div className="flex items-center justify-center h-full p-4 text-hermes-muted text-sm">
      <div className="text-center">
        <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
        <p>Reports shown in main panel</p>
      </div>
    </div>
  );
}

export function ReportsMain() {
  const [tokens, setTokens] = useState<OpsTokens>({});
  const [resources, setResources] = useState<ResourcePayload>({});
  const [agents, setAgents] = useState<Agent[]>([]);
  const [costs, setCosts] = useState<CostPayload>({});
  const [dialogs, setDialogs] = useState<DialogPayload>({});
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [range, setRange] = useState<TimeRange>("24h");

  useEffect(() => {
    apiGet<OpsTokens>("/api/ops/tokens").then(setTokens).catch(() => setTokens({}));
    apiGet<ResourcePayload>("/api/ops/resources").then(setResources).catch(() => setResources({}));
    apiGet<{ agents: Agent[] }>("/api/ops/agents").then((data) => setAgents(data.agents || [])).catch(() => setAgents([]));
    apiGet<CostPayload>("/api/ops/costs").then(setCosts).catch(() => setCosts({}));
    apiGet<DialogPayload>("/api/ops/dialogs").then(setDialogs).catch(() => setDialogs({}));
    apiGet<{ sessions: SessionSummary[] }>("/api/sessions").then((data) => setSessions(data.sessions || [])).catch(() => setSessions([]));
  }, []);

  const usageSeries = useMemo(() => buildUsageSeries(sessions, range), [range, sessions]);
  const filteredSessions = useMemo(() => filterSessionsByRange(sessions, range), [range, sessions]);
  const topModels = useMemo(() => (costs.by_model || []).slice(0, 5), [costs.by_model]);
  const topProjects = useMemo(() => (costs.by_project || []).slice(0, 5), [costs.by_project]);
  const topSessions = useMemo(
    () => filteredSessions
      .slice()
      .sort((a, b) => Number(b.estimated_cost || 0) - Number(a.estimated_cost || 0))
      .slice(0, 8),
    [filteredSessions]
  );
  const dialogRoots = useMemo(() => (dialogs.roots || []).slice(0, 6), [dialogs.roots]);
  const filteredInputTokens = filteredSessions.reduce((sum, session) => sum + Number(session.input_tokens || 0), 0);
  const filteredOutputTokens = filteredSessions.reduce((sum, session) => sum + Number(session.output_tokens || 0), 0);
  const filteredCost = filteredSessions.reduce((sum, session) => sum + Number(session.estimated_cost || 0), 0);

  const aggregate = [
    { label: "Total Tokens", value: formatNumber(filteredInputTokens + filteredOutputTokens), icon: Zap, color: "text-hermes-accent" },
    { label: "Total Cost", value: `$${filteredCost.toFixed(2)}`, icon: DollarSign, color: "text-success" },
    { label: "Sessions", value: formatNumber(filteredSessions.length), icon: TrendingUp, color: "text-hermes-accent-2" },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-hermes-border">
        <h1 className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 size={16} className="text-hermes-accent" />
          Live Ops Report
        </h1>
        <div className="mt-3 flex items-center gap-2">
          {(["1h", "24h", "7d", "30d"] as TimeRange[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={`rounded px-3 py-1 text-xs font-mono ${range === value ? "bg-hermes-accent/15 text-hermes-accent" : "bg-hermes-panel text-hermes-muted"}`}
            >
              {value.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 p-4">
        {aggregate.map((card) => (
          <div key={card.label} className="bg-hermes-panel rounded-lg p-3 border border-hermes-border">
            <div className="flex items-center gap-2 mb-1">
              <card.icon size={14} className={card.color} />
              <span className="text-[11px] text-hermes-muted">{card.label}</span>
            </div>
            <div className="text-lg font-bold font-mono">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-3">
        <h2 className="text-xs font-semibold text-hermes-muted uppercase tracking-wider mb-2">System Resources</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-hermes-border bg-hermes-panel p-3 text-xs">
            <div className="text-hermes-muted">CPU</div>
            <div className="mt-1 text-lg font-mono">{Number(resources.cpu_percent || 0).toFixed(1)}%</div>
          </div>
          <div className="rounded-lg border border-hermes-border bg-hermes-panel p-3 text-xs">
            <div className="text-hermes-muted">Memory</div>
            <div className="mt-1 text-lg font-mono">{Number(resources.memory?.percent || 0).toFixed(1)}%</div>
          </div>
          <div className="rounded-lg border border-hermes-border bg-hermes-panel p-3 text-xs">
            <div className="text-hermes-muted">Disk</div>
            <div className="mt-1 text-lg font-mono">{Number(resources.disk?.percent || 0).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <h2 className="text-xs font-semibold text-hermes-muted uppercase tracking-wider mb-2 flex items-center gap-2">
          <Activity size={12} /> Live Agents & Processes
        </h2>
        <div className="space-y-1.5">
          {agents.slice(0, 12).map((agent) => (
            <div key={agent.pid} className="flex items-center gap-2 bg-hermes-panel rounded-md px-3 py-2 border border-hermes-border">
              <div className="w-2 h-2 rounded-full bg-badge-live animate-pulse-glow" />
              <span className="text-xs font-mono flex-1 truncate">{agent.command || "agent"}</span>
              <span className="text-[10px] text-hermes-muted font-mono">PID {agent.pid}</span>
            </div>
          ))}
          {agents.length === 0 && <div className="text-xs text-hermes-muted">No live Hermes processes detected.</div>}
        </div>
      </div>

      <div className="grid gap-4 px-4 pb-4 xl:grid-cols-2">
        <MiniBars title={`Session Volume (${range.toUpperCase()})`} metric="sessions" series={usageSeries} />
        <MiniBars title={`Token Usage (${range.toUpperCase()})`} metric="tokens" series={usageSeries} />
      </div>

      <div className="grid gap-4 px-4 pb-4 xl:grid-cols-2">
        <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
          <h2 className="text-xs font-semibold text-hermes-muted uppercase tracking-wider mb-3">Cost By Model</h2>
          <div className="space-y-2">
            {topModels.map((row) => (
              <div key={row.model} className="flex items-center gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{row.model || "unknown"}</div>
                  <div className="text-hermes-muted">{formatNumber((row.input_tokens || 0) + (row.output_tokens || 0))} tokens · {formatNumber(row.sessions)} sessions</div>
                </div>
                <div className="font-mono text-foreground">${Number(row.estimated_cost || 0).toFixed(2)}</div>
              </div>
            ))}
            {topModels.length === 0 && <div className="text-xs text-hermes-muted">No cost data available.</div>}
          </div>
        </div>

        <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
          <h2 className="text-xs font-semibold text-hermes-muted uppercase tracking-wider mb-3">Cost By Project</h2>
          <div className="space-y-2">
            {topProjects.map((row) => (
              <div key={row.project} className="flex items-center gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{row.project || "unassigned"}</div>
                  <div className="text-hermes-muted">{formatNumber(row.sessions)} sessions</div>
                </div>
                <div className="font-mono text-foreground">${Number(row.estimated_cost || 0).toFixed(2)}</div>
              </div>
            ))}
            {topProjects.length === 0 && <div className="text-xs text-hermes-muted">No project cost data available.</div>}
          </div>
        </div>
        <MiniBars title={`Cost Trend (${range.toUpperCase()})`} metric="cost" series={usageSeries} />
      </div>

      <div className="grid gap-4 px-4 pb-4 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
          <h2 className="text-xs font-semibold text-hermes-muted uppercase tracking-wider mb-3">Top Sessions</h2>
          <div className="space-y-2">
            {topSessions.map((item) => (
              <div key={item.session_id} className="rounded-md border border-hermes-border/70 bg-hermes-code/40 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1 truncate font-medium">{item.title || "Untitled"}</div>
                  <div className="font-mono">${Number(item.estimated_cost || 0).toFixed(3)}</div>
                </div>
                <div className="mt-1 text-hermes-muted">{item.project || "Hermes"} · {item.model || "unknown"} · {formatNumber(item.message_count)} messages · {formatAge(item.updated_at || 0)}</div>
              </div>
            ))}
            {topSessions.length === 0 && <div className="text-xs text-hermes-muted">No session usage data available.</div>}
          </div>
        </div>

        <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
          <h2 className="text-xs font-semibold text-hermes-muted uppercase tracking-wider mb-3">Dialog Graph</h2>
          <div className="space-y-2">
            <div className="text-xs text-hermes-muted">{formatNumber(dialogs.session_count)} sessions · {formatNumber(dialogs.tool_count)} tool calls</div>
            {dialogRoots.map((root) => (
              <div key={root.id} className="rounded-md border border-hermes-border/70 bg-hermes-code/40 px-3 py-2 text-xs">
                <div className="font-medium truncate">{root.title || "Untitled"}</div>
                <div className="mt-1 text-hermes-muted">{root.project || "Hermes"} · {root.model || "unknown"} · {formatNumber(root.message_count)} messages</div>
                {root.children && root.children.length > 0 && (
                  <div className="mt-2 text-[11px] text-hermes-muted truncate">
                    Recent tools: {root.children.slice(0, 3).map((child) => child.label || child.name || child.type || "tool").join(" · ")}
                  </div>
                )}
              </div>
            ))}
            {dialogRoots.length === 0 && <div className="text-xs text-hermes-muted">No dialog graph data available.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
