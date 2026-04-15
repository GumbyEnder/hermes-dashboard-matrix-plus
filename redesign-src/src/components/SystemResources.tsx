import { useState, useEffect, useRef } from "react";
import { Cpu, HardDrive, Wifi, MemoryStick } from "lucide-react";

interface SystemResource {
  label: string;
  value: string;
  icon: React.ElementType;
  status: "ok" | "warn" | "error";
}

function randomize(): SystemResource[] {
  const cpu = Math.floor(Math.random() * 60 + 5);
  const mem = (Math.random() * 6 + 1.5).toFixed(1);
  const disk = Math.floor(Math.random() * 30 + 50);
  const up = (Math.random() * 5 + 0.5).toFixed(1);
  const down = Math.floor(Math.random() * 30 + 2);
  return [
    { label: "CPU", value: `${cpu}%`, icon: Cpu, status: cpu > 80 ? "error" : cpu > 50 ? "warn" : "ok" },
    { label: "Mem", value: `${mem}G`, icon: MemoryStick, status: parseFloat(mem) > 6 ? "warn" : "ok" },
    { label: "Disk", value: `${disk}%`, icon: HardDrive, status: disk > 80 ? "error" : disk > 60 ? "warn" : "ok" },
    { label: "Net", value: `↑${up} ↓${down}`, icon: Wifi, status: "ok" },
  ];
}

export function SystemResources() {
  const [resources, setResources] = useState<SystemResource[]>(randomize);
  const [ago, setAgo] = useState(0);
  const agoRef = useRef(0);

  useEffect(() => {
    const poll = setInterval(() => { setResources(randomize()); agoRef.current = 0; setAgo(0); }, 3000);
    const tick = setInterval(() => { agoRef.current += 1; setAgo(agoRef.current); }, 1000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, []);

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
        {resources.map((r) => (
          <div key={r.label} className="flex items-center gap-1.5 px-2 py-1 rounded bg-hermes-panel text-xs">
            <r.icon size={12} className={
              r.status === "warn" ? "text-warn" : r.status === "error" ? "text-danger" : "text-success"
            } />
            <span className="text-hermes-muted">{r.label}</span>
            <span className="ml-auto font-mono text-foreground">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
