import { BarChart3, TrendingUp, DollarSign, Zap, Activity } from "lucide-react";

const MODEL_DATA = [
  { model: "claude-sonnet-4-20250514", tokens: "1.2M", cost: "$14.40", calls: 342 },
  { model: "gpt-4o", tokens: "890K", cost: "$8.90", calls: 156 },
  { model: "claude-3-haiku", tokens: "3.4M", cost: "$1.70", calls: 1204 },
];

const PROJECT_DATA = [
  { project: "hermes-core", tokens: "2.1M", cost: "$12.50" },
  { project: "client-portal", tokens: "1.8M", cost: "$8.20" },
  { project: "research-agent", tokens: "500K", cost: "$4.30" },
];

const PROCESSES = [
  { name: "hermes-agent-main", status: "live" as const, pid: 4821, uptime: "14d 6h" },
  { name: "task-scheduler", status: "live" as const, pid: 4822, uptime: "14d 6h" },
  { name: "obsidian-sync", status: "idle" as const, pid: 4830, uptime: "2h 15m" },
];

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
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-hermes-border">
        <h1 className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 size={16} className="text-hermes-accent" />
          Model Usage & Cost Report
        </h1>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-3 gap-3 p-4">
        {[
          { label: "Total Tokens", value: "5.5M", icon: Zap, color: "text-hermes-accent" },
          { label: "Total Cost", value: "$25.00", icon: DollarSign, color: "text-success" },
          { label: "API Calls", value: "1,702", icon: TrendingUp, color: "text-hermes-accent-2" },
        ].map((card) => (
          <div key={card.label} className="bg-hermes-panel rounded-lg p-3 border border-hermes-border">
            <div className="flex items-center gap-2 mb-1">
              <card.icon size={14} className={card.color} />
              <span className="text-[11px] text-hermes-muted">{card.label}</span>
            </div>
            <div className="text-lg font-bold font-mono">{card.value}</div>
          </div>
        ))}
      </div>

      {/* By Model */}
      <div className="px-4 pb-3">
        <h2 className="text-xs font-semibold text-hermes-muted uppercase tracking-wider mb-2">By Model</h2>
        <div className="bg-hermes-panel rounded-lg border border-hermes-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-hermes-border text-hermes-muted">
                <th className="text-left px-3 py-2 font-medium">Model</th>
                <th className="text-right px-3 py-2 font-medium">Tokens</th>
                <th className="text-right px-3 py-2 font-medium">Cost</th>
                <th className="text-right px-3 py-2 font-medium">Calls</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_DATA.map((row) => (
                <tr key={row.model} className="border-b border-hermes-border/50 hover:bg-row-hover transition-colors">
                  <td className="px-3 py-2 font-mono">{row.model}</td>
                  <td className="px-3 py-2 text-right font-mono">{row.tokens}</td>
                  <td className="px-3 py-2 text-right font-mono text-success">{row.cost}</td>
                  <td className="px-3 py-2 text-right font-mono">{row.calls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Project */}
      <div className="px-4 pb-3">
        <h2 className="text-xs font-semibold text-hermes-muted uppercase tracking-wider mb-2">By Project</h2>
        <div className="bg-hermes-panel rounded-lg border border-hermes-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-hermes-border text-hermes-muted">
                <th className="text-left px-3 py-2 font-medium">Project</th>
                <th className="text-right px-3 py-2 font-medium">Tokens</th>
                <th className="text-right px-3 py-2 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {PROJECT_DATA.map((row) => (
                <tr key={row.project} className="border-b border-hermes-border/50 hover:bg-row-hover transition-colors">
                  <td className="px-3 py-2 font-mono">{row.project}</td>
                  <td className="px-3 py-2 text-right font-mono">{row.tokens}</td>
                  <td className="px-3 py-2 text-right font-mono text-success">{row.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Processes */}
      <div className="px-4 pb-4">
        <h2 className="text-xs font-semibold text-hermes-muted uppercase tracking-wider mb-2 flex items-center gap-2">
          <Activity size={12} /> Live Agents & Processes
        </h2>
        <div className="space-y-1.5">
          {PROCESSES.map((p) => (
            <div key={p.pid} className="flex items-center gap-2 bg-hermes-panel rounded-md px-3 py-2 border border-hermes-border">
              <div className={`w-2 h-2 rounded-full ${p.status === "live" ? "bg-badge-live animate-pulse-glow" : "bg-badge-idle"}`} />
              <span className="text-xs font-mono flex-1">{p.name}</span>
              <span className="text-[10px] text-hermes-muted font-mono">PID {p.pid}</span>
              <span className="text-[10px] text-hermes-muted font-mono">{p.uptime}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
