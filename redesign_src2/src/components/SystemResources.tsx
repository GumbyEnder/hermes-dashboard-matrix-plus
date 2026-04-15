import { useEffect, useMemo, useRef, useState } from "react";
import { Cpu, HardDrive, MemoryStick, Wifi } from "lucide-react";
import { apiGet, formatBytes } from "@/lib/dashboard-api";

interface ResourcePayload {
  cpu_percent?: number;
  memory?: { percent?: number; used?: number };
  disk?: { percent?: number; used?: number };
  net_io?: { bytes_sent?: number; bytes_recv?: number };
}

interface SystemResource {
  label: string;
  value: string;
  icon: React.ElementType;
  status: "ok" | "warn" | "error";
}

function statusForPercent(value: number) {
  if (value >= 85) return "error" as const;
  if (value >= 65) return "warn" as const;
  return "ok" as const;
}

export function SystemResources() {
  const [payload, setPayload] = useState<ResourcePayload>({});
  const [ago, setAgo] = useState(0);
  const prevNet = useRef<{ sent: number; recv: number; ts: number } | null>(null);
  const [netRate, setNetRate] = useState({ up: 0, down: 0 });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await apiGet<ResourcePayload>("/api/ops/resources");
        if (!mounted) return;
        setPayload(data);
        setAgo(0);

        const sent = Number(data.net_io?.bytes_sent || 0);
        const recv = Number(data.net_io?.bytes_recv || 0);
        const now = Date.now();
        if (prevNet.current) {
          const dt = Math.max(1, (now - prevNet.current.ts) / 1000);
          setNetRate({
            up: Math.max(0, (sent - prevNet.current.sent) / dt),
            down: Math.max(0, (recv - prevNet.current.recv) / dt),
          });
        }
        prevNet.current = { sent, recv, ts: now };
      } catch {
        if (mounted) {
          setPayload({});
          setNetRate({ up: 0, down: 0 });
        }
      }
    };

    void load();
    const poll = setInterval(() => void load(), 3000);
    const tick = setInterval(() => setAgo((current) => current + 1), 1000);
    return () => {
      mounted = false;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  const resources = useMemo<SystemResource[]>(() => {
    const cpu = Number(payload.cpu_percent || 0);
    const mem = Number(payload.memory?.percent || 0);
    const disk = Number(payload.disk?.percent || 0);
    return [
      { label: "CPU", value: `${cpu.toFixed(1)}%`, icon: Cpu, status: statusForPercent(cpu) },
      { label: "Mem", value: `${mem.toFixed(1)}%`, icon: MemoryStick, status: statusForPercent(mem) },
      { label: "Disk", value: `${disk.toFixed(1)}%`, icon: HardDrive, status: statusForPercent(disk) },
      { label: "Net", value: `↑${formatBytes(netRate.up)}/s ↓${formatBytes(netRate.down)}/s`, icon: Wifi, status: "ok" },
    ];
  }, [netRate.down, netRate.up, payload.cpu_percent, payload.disk?.percent, payload.memory?.percent]);

  return (
    <div className="px-3 py-2 border-b border-hermes-border">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-hermes-muted uppercase tracking-wider">System</span>
        <div className="flex items-center gap-1 ml-auto text-hermes-muted">
          <span className="live-pulse" />
          <span className="text-[10px]">{ago}s ago</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {resources.map((resource) => (
          <div key={resource.label} className="flex items-center gap-1.5 px-2 py-1 rounded bg-hermes-panel text-xs">
            <resource.icon
              size={12}
              className={
                resource.status === "warn"
                  ? "text-warn"
                  : resource.status === "error"
                    ? "text-danger"
                    : "text-success"
              }
            />
            <span className="text-hermes-muted">{resource.label}</span>
            <span className="ml-auto font-mono text-foreground">{resource.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
