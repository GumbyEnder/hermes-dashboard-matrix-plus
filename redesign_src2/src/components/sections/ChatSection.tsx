import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { Paperclip, Send, Mic, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeftPanel } from "@/components/LeftPanel";
import { apiGet, apiPost, formatAge, formatNumber } from "@/lib/dashboard-api";

type SessionSummary = {
  session_id: string;
  title?: string;
  updated_at?: number;
  created_at?: number;
  message_count?: number;
  model?: string;
  profile?: string;
  workspace?: string;
  input_tokens?: number;
  output_tokens?: number;
  estimated_cost?: number;
  is_cli_session?: boolean;
};

type SessionResponse = {
  session: {
    session_id: string;
    title?: string;
    model?: string;
    profile?: string;
    workspace?: string;
    messages?: Array<{ role: string; content: string; ts?: string }>;
    input_tokens?: number;
    output_tokens?: number;
    estimated_cost?: number;
    message_count?: number;
    updated_at?: number;
  };
};

type StreamDone = {
  session?: SessionResponse["session"];
};

type PendingTurn = {
  user: string;
  assistant: string;
};

export function ChatSection({ activeSessionId, onSessionSelect }: { activeSessionId: string | null; onSessionSelect: (id: string) => void }) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiGet<{ sessions: SessionSummary[] }>("/api/sessions")
      .then((data) => {
        if (!mounted) return;
        const ordered = (data.sessions || []).slice().sort((a, b) => Number(b.updated_at || 0) - Number(a.updated_at || 0));
        setSessions(ordered);
        if (!activeSessionId && ordered.length) {
          onSessionSelect(ordered[0].session_id);
        }
      })
      .catch(() => {
        if (mounted) setSessions([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [activeSessionId, onSessionSelect]);

  return (
    <LeftPanel title="Sessions" onRefresh={() => window.location.reload()}>
      <div className="p-2">
        <button
          onClick={async () => {
            try {
              const data = await apiPost<{ session: SessionSummary }>("/api/session/new", {});
              onSessionSelect(data.session.session_id);
            } catch {
              // leave sidebar state unchanged on failure
            }
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-md bg-hermes-accent/10 text-hermes-accent hover:bg-hermes-accent/20 transition-colors font-medium"
        >
          <Sparkles size={14} />
          New session
        </button>
      </div>
      <div className="px-1">
        {loading && <div className="px-3 py-2 text-xs text-hermes-muted">Loading sessions…</div>}
        {!loading && sessions.length === 0 && <div className="px-3 py-2 text-xs text-hermes-muted">No sessions found.</div>}
        {sessions.map((s) => (
          <button
            key={s.session_id}
            onClick={() => onSessionSelect(s.session_id)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-xs transition-colors",
              s.session_id === activeSessionId ? "bg-row-selected text-foreground" : "text-hermes-muted hover:bg-row-hover hover:text-foreground"
            )}
          >
            <div className="font-medium truncate">{s.title || "Untitled session"}</div>
            <div className="text-[10px] mt-0.5 opacity-60">
              {formatAge(s.updated_at || s.created_at || 0)} · {s.model || "unknown"}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-3 border-t border-hermes-border px-3 py-3 text-[11px] text-hermes-muted">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-badge-live animate-pulse-glow" />
          <span>Live data from /api/sessions</span>
        </div>
      </div>
    </LeftPanel>
  );
}

interface ChatMainProps { sessionId: string | null; }

export function ChatMain({ sessionId, onSessionChange }: ChatMainProps & { onSessionChange: (id: string) => void }) {
  const [input, setInput] = useState("");
  const [session, setSession] = useState<SessionResponse["session"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingTurn, setPendingTurn] = useState<PendingTurn | null>(null);
  const [streamStatus, setStreamStatus] = useState("");
  const streamRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const closeStream = () => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
  };

const loadSession = async (id: string) => {
  setLoading(true);
  setError("");
  try {
    const data = await apiGet<SessionResponse>(`/api/session?session_id=${encodeURIComponent(id)}`);
    setSession(data.session);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load session data");
    setSession(null);
  } finally {
    setLoading(false);
  }
};

const loadLatest = async () => {
  try {
    const list = await apiGet<{ sessions: SessionSummary[] }>("/api/sessions");
    const ordered = (list.sessions || []).slice().sort((a, b) => Number(b.updated_at || 0) - Number(a.updated_at || 0));
    const first = ordered[0];
    if (first) {
      onSessionChange(first.session_id);
      await loadSession(first.session_id);
    } else {
      setSession(null);
    }
  } catch {
    setSession(null);
  }
};

  useEffect(() => () => closeStream(), []);


  useEffect(() => {
    closeStream();
    setPendingTurn(null);
    setStreamStatus("");
    if (sessionId) {
      void loadSession(sessionId);
    } else {
      void loadLatest();
    }
  }, [sessionId]);

  const messages = session?.messages || [];

  useEffect(() => {
    const target = scrollRef.current;
    if (!target) return;
    target.scrollTop = target.scrollHeight;
  }, [messages.length, pendingTurn?.assistant, pendingTurn?.user, streamStatus]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || sending) return;

    setSending(true);
    setError("");
    setStreamStatus("Starting stream…");
    setPendingTurn({ user: message, assistant: "" });
    try {
      let nextSessionId = sessionId;
      if (!nextSessionId) {
        const created = await apiPost<{ session: SessionSummary }>("/api/session/new", {});
        nextSessionId = created.session.session_id;
        onSessionChange(nextSessionId);
      }

      setInput("");

      const result = await apiPost<{ stream_id: string; session_id: string }>("/api/chat/start", {
        session_id: nextSessionId,
        message,
        workspace: session?.workspace,
        model: session?.model,
      });

      const stream = new EventSource(`/api/chat/stream?stream_id=${encodeURIComponent(result.stream_id)}`);
      streamRef.current = stream;

      stream.addEventListener("token", (event) => {
        const payload = JSON.parse((event as MessageEvent).data || "{}") as { text?: string };
        setPendingTurn((prev) => prev ? { ...prev, assistant: `${prev.assistant}${payload.text || ""}` } : prev);
        setStreamStatus("Streaming response…");
      });

      stream.addEventListener("tool", (event) => {
        const payload = JSON.parse((event as MessageEvent).data || "{}") as { name?: string; preview?: string };
        setStreamStatus(payload.preview || payload.name || "Running tool…");
      });

      stream.addEventListener("approval", () => {
        setStreamStatus("Waiting for approval…");
      });

      stream.addEventListener("compressed", () => {
        setStreamStatus("Compressing context…");
      });

      stream.addEventListener("apperror", (event) => {
        const payload = JSON.parse((event as MessageEvent).data || "{}") as { message?: string; hint?: string };
        closeStream();
        setError(payload.hint || payload.message || "Chat stream failed");
        setPendingTurn(null);
        setSending(false);
        setStreamStatus("");
      });

      stream.addEventListener("error", () => {
        closeStream();
        setError("Chat stream disconnected");
        setPendingTurn(null);
        setSending(false);
        setStreamStatus("");
      });

      stream.addEventListener("cancel", (event) => {
        const payload = JSON.parse((event as MessageEvent).data || "{}") as { message?: string };
        closeStream();
        setError(payload.message || "Chat cancelled");
        setPendingTurn(null);
        setSending(false);
        setStreamStatus("");
      });

      stream.addEventListener("done", (event) => {
        const payload = JSON.parse((event as MessageEvent).data || "{}") as StreamDone;
        closeStream();
        if (payload.session) {
          setSession(payload.session);
          if (payload.session.session_id) {
            onSessionChange(payload.session.session_id);
          }
        }
        setPendingTurn(null);
        setSending(false);
        setStreamStatus("");
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      setPendingTurn(null);
      setStreamStatus("");
      setInput(message);
    } finally {
      if (!streamRef.current) {
        setSending(false);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-hermes-border">
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-hermes-panel text-hermes-muted">{session?.model || "unknown model"}</span>
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-hermes-panel text-hermes-muted">{session?.profile || "default"}</span>
        <div className="flex-1" />
        <button onClick={() => void loadLatest()} className="text-xs text-hermes-muted hover:text-foreground transition-colors">Refresh</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading && <div className="text-sm text-hermes-muted">Loading live session…</div>}
        {!loading && error && <div className="text-sm text-danger">{error}</div>}
        {!loading && !error && !session && <div className="text-sm text-hermes-muted">No session is available yet.</div>}
        {!loading && !error && session && (
          <>
            <div className="rounded-lg border border-hermes-border bg-hermes-panel p-3">
              <div className="text-sm font-semibold">{session.title || "Untitled session"}</div>
              <div className="mt-1 text-[11px] text-hermes-muted">
                {session.workspace || "No workspace"} · {formatNumber(session.message_count ?? messages.length ?? 0)} messages · {formatNumber(session.input_tokens)} in / {formatNumber(session.output_tokens)} out
              </div>
            </div>
            {messages.length === 0 && <div className="text-sm text-hermes-muted">This session has no messages yet.</div>}
            {messages.map((msg, idx) => (
              <div key={`${idx}-${msg.role}`} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm", msg.role === "user" ? "bg-hermes-accent/15 text-foreground" : "bg-hermes-panel text-foreground") }>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  {msg.ts && <div className="text-[10px] text-hermes-muted mt-1 text-right">{msg.ts}</div>}
                </div>
              </div>
            ))}
            {pendingTurn && (
              <>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-hermes-accent/15 text-foreground">
                    <div className="whitespace-pre-wrap leading-relaxed">{pendingTurn.user}</div>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-hermes-panel text-foreground">
                    <div className="whitespace-pre-wrap leading-relaxed">{pendingTurn.assistant || streamStatus || "Thinking…"}</div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-1 border-t border-hermes-border text-[11px] text-hermes-muted">
        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
        <span>{streamStatus || (session ? "Connected to session" : "Waiting for session data")}</span>
        <span className="ml-auto font-mono">tokens: {formatNumber((session?.input_tokens || 0) + (session?.output_tokens || 0))}</span>
      </div>

      <div className="px-4 pb-3 pt-1">
        <div className="flex items-start gap-2 bg-hermes-panel rounded-lg border border-hermes-border px-3 py-3">
          <button type="button" className="p-1 text-hermes-muted hover:text-foreground transition-colors shrink-0">
            <Paperclip size={16} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={4}
            className="flex-1 bg-transparent text-sm resize-y overflow-y-auto outline-none placeholder:text-hermes-muted min-h-[96px] max-h-[240px]"
          />
          <button type="button" className="p-1 text-hermes-muted hover:text-foreground transition-colors shrink-0">
            <Mic size={16} />
          </button>
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !input.trim()}
            className="p-1.5 rounded-md bg-hermes-accent text-background hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
