import { useState, useEffect, useRef } from "react";
import { Cpu, MemoryStick, HardDrive, Wifi, Rocket, RefreshCw, Trash2, Play, Zap, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiGet } from "@/lib/dashboard-api";
import type { ThemeId } from "@/lib/theme";
import { AlertCenter } from "@/components/AlertCenter";

type ResourceResponse = {
  cpu_percent?: number;
  memory?: { percent?: number; used?: number; total?: number };
  disk?: { percent?: number };
  net_io?: { bytes_sent?: number; bytes_recv?: number };
};

type HeaderResources = {
  cpu: number;
  memRaw: number;
  memPercent: number;
  disk: number;
  upRate: number;
  downRate: number;
};

/* ── Animated Number ── */
function useAnimatedValue(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>();
  const startRef = useRef({ value: target, time: 0 });

  useEffect(() => {
    const start = display;
    const startTime = performance.now();
    startRef.current = { value: start, time: startTime };

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(start + (target - start) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

/* ── Live Clock ── */
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const local = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const utc = now.toUTCString().slice(17, 25);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-hermes-panel/40 border border-hermes-border/30">
      <Clock size={13} className="text-hermes-accent" />
      <div className="flex flex-col">
        <span className="text-[10px] text-hermes-muted uppercase tracking-wider">Local</span>
        <span className="text-xs font-mono font-semibold text-foreground tabular-nums">{local}</span>
      </div>
      <div className="w-px h-6 bg-hermes-border/30" />
      <div className="flex flex-col">
        <span className="text-[10px] text-hermes-muted uppercase tracking-wider">UTC</span>
        <span className="text-xs font-mono font-semibold text-foreground tabular-nums">{utc}</span>
      </div>
    </div>
  );
}

/* ── Sparkline ── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 60, h = 20;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ── Quick Action Button ── */
function QuickAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick?: () => void }) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
            bg-hermes-panel/60 border border-hermes-border/50 text-hermes-muted
            hover:text-foreground hover:bg-hermes-panel hover:border-hermes-accent/30
            hover:shadow-[0_0_12px_hsl(var(--accent)/0.15)] transition-all duration-200"
        >
          <Icon size={13} />
          <span className="hidden xl:inline">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

/* ── Resource Gauge with animated values ── */
function ResourceGauge({ label, rawValue, unit, percent, icon: Icon, status, history, decimals = 0 }: {
  label: string; rawValue: number; unit: string; percent: number;
  icon: React.ElementType; status: "ok" | "warn" | "error";
  history: number[]; decimals?: number;
}) {
  const animatedValue = useAnimatedValue(rawValue);
  const animatedPercent = useAnimatedValue(percent);
  const statusColor = status === "error" ? "var(--danger)" : status === "warn" ? "var(--warn)" : "var(--success)";
  const displayValue = decimals > 0 ? animatedValue.toFixed(decimals) : Math.round(animatedValue);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-hermes-panel/40 border border-hermes-border/30
      hover:border-hermes-accent/20 transition-all duration-200 group">
      <div className="relative">
        <Icon size={16} style={{ color: `hsl(${statusColor})` }} />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: `hsl(${statusColor})` }} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-hermes-muted uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono font-semibold text-foreground tabular-nums">{displayValue}{unit}</span>
      </div>
      <Sparkline data={history} color={`hsl(${statusColor})`} />
      <div className="w-12 h-1 rounded-full bg-hermes-border/30 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${animatedPercent}%`, backgroundColor: `hsl(${statusColor})` }} />
      </div>
    </div>
  );
}

/* ── Main Header ── */
export function HermesHeader({ theme }: { theme: ThemeId }) {
  const [resources, setResources] = useState<HeaderResources>({
    cpu: 0,
    memRaw: 0,
    memPercent: 0,
    disk: 0,
    upRate: 0,
    downRate: 0,
  });
  const [ago, setAgo] = useState(0);
  const historyRef = useRef<{ cpu: number[]; mem: number[]; disk: number[]; net: number[] }>({
    cpu: Array(12).fill(0), mem: Array(12).fill(0), disk: Array(12).fill(0), net: Array(12).fill(0),
  });
  const netRef = useRef<{ bytesSent: number; bytesRecv: number; time: number } | null>(null);

  useEffect(() => {
    let alive = true;
    const pollOnce = async () => {
      const r = await fetchResources(netRef.current);
      if (!alive || !r) return;
      setResources(r.resources);
      setAgo(0);
      netRef.current = r.netSnapshot;
      const h = historyRef.current;
      h.cpu = [...h.cpu.slice(1), r.resources.cpu];
      h.mem = [...h.mem.slice(1), r.resources.memPercent];
      h.disk = [...h.disk.slice(1), r.resources.disk];
      h.net = [...h.net.slice(1), r.resources.downRate];
    };

    pollOnce();
    const poll = setInterval(pollOnce, 3000);
    const tick = setInterval(() => setAgo((a) => a + 1), 1000);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  const h = historyRef.current;

  const headerVideoSrc = theme === "amber"
    ? "/assets/media/hermes-dash-amber.mp4"
    : "/assets/media/hermes-dash-header-matrix.mp4";

  return (
    <header className="shrink-0 relative border-b-2 border-hermes-border backdrop-blur-md bg-hermes-elev/60 shadow-[0_4px_20px_hsl(var(--shadow)/0.4)]">
      {(theme === "matrix" || theme === "amber") && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <video
            key={headerVideoSrc}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          >
            <source src={headerVideoSrc} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />
        </div>
      )}
      {/* Accent top stripe */}
      <div className="h-[2px] w-full bg-gradient-to-r from-hermes-accent via-hermes-accent-2 to-hermes-accent" />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-hermes-accent/[0.03] via-transparent to-hermes-accent-2/[0.03] pointer-events-none" />

      {/* Top row: branding + quick actions + clock + avatar */}
      <div className="relative flex items-center justify-between px-8 pt-7 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-hermes-accent/15 border border-hermes-accent/30 flex items-center justify-center
              shadow-[0_0_16px_hsl(var(--accent)/0.2)]">
              <Zap size={18} className="text-hermes-accent glow" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide text-foreground glow">HERMES</h1>
              <p className="text-[10px] text-hermes-muted font-mono">agent v2.4.1</p>
            </div>
          </div>
          <div className="h-6 w-px bg-hermes-border/50 mx-1" />
          <div className="flex items-center gap-1">
            <span className="live-pulse" />
            <span className="text-[10px] text-success font-mono font-medium">ONLINE</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <QuickAction icon={Play} label="Run Task" />
          <QuickAction icon={Rocket} label="Deploy" />
          <QuickAction icon={RefreshCw} label="Sync" />
          <QuickAction icon={Trash2} label="Clear Cache" />
        </div>

        <div className="flex items-center gap-4">
          <AlertCenter />
          <LiveClock />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-foreground">hermes-agent</p>
              <p className="text-[10px] text-hermes-muted font-mono">{ago}s ago</p>
            </div>
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-hermes-accent/20 border-2 border-hermes-accent/40 flex items-center justify-center
                shadow-[0_0_12px_hsl(var(--accent)/0.25)]">
                <span className="text-xs font-bold text-hermes-accent">H</span>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-background" />
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-8 border-t border-hermes-border/40" />

      {/* Bottom row: resource gauges */}
      <div className="relative flex items-center gap-2 px-8 pt-3 pb-5 overflow-x-auto">
        <ResourceGauge label="CPU" rawValue={resources.cpu} unit="%" percent={resources.cpu}
          icon={Cpu} status={resources.cpu > 80 ? "error" : resources.cpu > 50 ? "warn" : "ok"} history={h.cpu} />
        <ResourceGauge label="Memory" rawValue={resources.memRaw} unit="G" percent={resources.memPercent}
          icon={MemoryStick} status={resources.memPercent > 85 ? "error" : resources.memPercent > 65 ? "warn" : "ok"} history={h.mem} decimals={1} />
        <ResourceGauge label="Disk" rawValue={resources.disk} unit="%" percent={resources.disk}
          icon={HardDrive} status={resources.disk > 80 ? "error" : resources.disk > 60 ? "warn" : "ok"} history={h.disk} />
        <ResourceGauge label="Network" rawValue={resources.downRate} unit={` MB/s ↑${resources.upRate.toFixed(1)}`} percent={Math.min(100, resources.downRate * 20)}
          icon={Wifi} status="ok" history={h.net} decimals={1} />
      </div>
    </header>
  );
}

async function fetchResources(previousNet: { bytesSent: number; bytesRecv: number; time: number } | null) {
  try {
    const data = await apiGet<ResourceResponse>('/api/ops/resources');
    const now = Date.now();
    const nextNet = {
      bytesSent: data.net_io?.bytes_sent || 0,
      bytesRecv: data.net_io?.bytes_recv || 0,
      time: now,
    };
    const elapsedSeconds = previousNet ? Math.max((now - previousNet.time) / 1000, 1) : 1;
    const upRate = previousNet ? Math.max(0, (nextNet.bytesSent - previousNet.bytesSent) / elapsedSeconds / (1024 ** 2)) : 0;
    const downRate = previousNet ? Math.max(0, (nextNet.bytesRecv - previousNet.bytesRecv) / elapsedSeconds / (1024 ** 2)) : 0;

    return {
      resources: {
        cpu: Number(data.cpu_percent || 0),
        memRaw: Number((Number(data.memory?.used || 0) / (1024 ** 3)).toFixed(1)),
        memPercent: Number(data.memory?.percent || 0),
        disk: Number(data.disk?.percent || 0),
        upRate,
        downRate,
      },
      netSnapshot: nextNet,
    };
  } catch {
    return null;
  }
}
