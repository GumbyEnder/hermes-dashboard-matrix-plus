import { useMemo, useState } from "react";
import { Settings2, RefreshCw, Download, Sparkles, Trash2 } from "lucide-react";
import { apiGet, apiPost, formatAge, usePollingQuery } from "@/lib/dashboard-api";
import { Button } from "@/components/ui/button";

type UpdateRepoStatus = {
  name?: string;
  behind?: number;
  current_sha?: string;
  latest_sha?: string;
  branch?: string;
  error?: string;
};

type UpdatePayload = {
  webui?: UpdateRepoStatus | null;
  agent?: UpdateRepoStatus | null;
  checked_at?: number;
  disabled?: boolean;
};

export function MaintenanceSection() {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="text-center text-hermes-muted text-sm">
        <Settings2 size={40} className="mx-auto mb-3 opacity-30" />
        <p>Maintenance tools appear in the main panel</p>
      </div>
    </div>
  );
}

export function MaintenanceMain() {
  const { data, refresh } = usePollingQuery(
    () => apiGet<UpdatePayload>("/api/updates/check", { quiet: true }),
    { initialData: {}, intervalMs: 300000, quiet: true },
  );
  const [busy, setBusy] = useState<string | null>(null);
  const checkedAt = useMemo(() => Number(data.checked_at || 0), [data.checked_at]);

  const runAction = async (name: string, task: () => Promise<unknown>) => {
    setBusy(name);
    try {
      await task();
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-hermes-border px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-base font-semibold">
              <Settings2 size={18} className="text-hermes-accent" />
              Maintenance
            </h1>
            <p className="mt-1 text-xs text-hermes-muted">
              Operational controls for the Hermes dashboard and agent environment.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void runAction("check", () => apiGet("/api/updates/check?force=1"))}
            disabled={busy === "check"}
          >
            <RefreshCw size={14} className="mr-1.5" />
            Check Updates
          </Button>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <MaintenanceCard
            title="Web UI"
            subtitle="Current dashboard repository"
            status={data.webui}
            busy={busy === "apply-webui"}
            onApply={() => runAction("apply-webui", () => apiPost("/api/updates/apply", { target: "webui" }))}
          />
          <MaintenanceCard
            title="Hermes Agent"
            subtitle="Attached Hermes agent repository"
            status={data.agent}
            busy={busy === "apply-agent"}
            onApply={() => runAction("apply-agent", () => apiPost("/api/updates/apply", { target: "agent" }))}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-hermes-muted">Cleanup</div>
            <div className="mt-3 space-y-3">
              <ActionRow
                title="Remove zero-message sessions"
                description="Clean up empty sessions created during experiments or aborted runs."
                icon={Trash2}
                busy={busy === "cleanup-zero"}
                onClick={() => runAction("cleanup-zero", () => apiPost("/api/sessions/cleanup_zero_message", {}))}
              />
              <ActionRow
                title="Run session cleanup"
                description="Prune stale sessions according to backend cleanup rules."
                icon={Sparkles}
                busy={busy === "cleanup"}
                onClick={() => runAction("cleanup", () => apiPost("/api/sessions/cleanup", {}))}
              />
            </div>
          </div>

          <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-hermes-muted">Status</div>
            <div className="mt-3 space-y-2 text-[11px] text-hermes-muted">
              <p>Last update check: {checkedAt ? formatAge(checkedAt) : "not checked yet"}</p>
              <p>
                This is the first maintenance tranche. Next planned additions are diagnostics, backup/import,
                restart controls, and eventually gateway-aware service management.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MaintenanceCard({
  title,
  subtitle,
  status,
  busy,
  onApply,
}: {
  title: string;
  subtitle: string;
  status?: UpdateRepoStatus | null;
  busy: boolean;
  onApply: () => void;
}) {
  const behind = Number(status?.behind || 0);
  const canApply = behind > 0 && !status?.error;

  return (
    <div className="rounded-lg border border-hermes-border bg-hermes-panel p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-[11px] text-hermes-muted">{subtitle}</div>
        </div>
        <Button variant="outline" size="sm" disabled={!canApply || busy} onClick={onApply}>
          <Download size={14} className="mr-1.5" />
          Apply
        </Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <RepoField label="Behind" value={status?.error ? "error" : String(behind)} />
        <RepoField label="Branch" value={status?.branch || "unknown"} mono />
        <RepoField label="Current" value={status?.current_sha || "unknown"} mono />
        <RepoField label="Latest" value={status?.latest_sha || "unknown"} mono />
      </div>
      {status?.error && (
        <div className="mt-3 rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-[11px] text-danger">
          {status.error}
        </div>
      )}
    </div>
  );
}

function RepoField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-hermes-border bg-background/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-hermes-muted">{label}</div>
      <div className={mono ? "mt-1 text-xs font-mono" : "mt-1 text-xs"}>{value}</div>
    </div>
  );
}

function ActionRow({
  title,
  description,
  icon: Icon,
  busy,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-hermes-border bg-background/40 px-3 py-3">
      <div className="flex min-w-0 gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-hermes-accent/10 text-hermes-accent">
          <Icon size={14} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium">{title}</div>
          <div className="mt-1 text-[11px] text-hermes-muted">{description}</div>
        </div>
      </div>
      <Button variant="outline" size="sm" disabled={busy} onClick={onClick}>
        Run
      </Button>
    </div>
  );
}
