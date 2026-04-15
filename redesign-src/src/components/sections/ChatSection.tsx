import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, Mic, ChevronDown, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeftPanel } from "@/components/LeftPanel";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: string;
}

const MOCK_SESSIONS = [
  { id: "1", title: "Build deployment pipeline", ts: "2m ago", active: true },
  { id: "2", title: "Debug auth middleware", ts: "1h ago", active: false },
  { id: "3", title: "Write unit tests for API", ts: "3h ago", active: false },
  { id: "4", title: "Refactor config loader", ts: "Yesterday", active: false },
];

const MOCK_MESSAGES: Message[] = [
  { id: "1", role: "user", content: "Can you set up a CI/CD pipeline for the Hermes project? I need automated tests and deployment to staging.", ts: "14:32" },
  { id: "2", role: "assistant", content: "I'll set up the pipeline. Here's my plan:\n\n1. **GitHub Actions** workflow for CI\n2. Run tests on every PR\n3. Auto-deploy to staging on merge to `main`\n4. Notify via webhook on completion\n\nLet me start by creating the workflow file.", ts: "14:32" },
  { id: "3", role: "system", content: "Created .github/workflows/ci.yml", ts: "14:33" },
  { id: "4", role: "user", content: "Looks good. Also add a step for linting.", ts: "14:35" },
  { id: "5", role: "assistant", content: "Done. I've added an ESLint step before the test step. The pipeline now runs:\n\n```yaml\nsteps:\n  - lint\n  - test\n  - build\n  - deploy-staging\n```\n\nShall I also add a production deployment trigger?", ts: "14:35" },
];

export function ChatSection() {
  return (
    <LeftPanel title="Sessions" onRefresh={() => {}}>
      <div className="p-2">
        <button className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-md bg-hermes-accent/10 text-hermes-accent hover:bg-hermes-accent/20 transition-colors font-medium">
          <Sparkles size={14} />
          New Conversation
        </button>
      </div>
      <div className="px-1">
        {MOCK_SESSIONS.map((s) => (
          <button
            key={s.id}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-xs transition-colors",
              s.active ? "bg-row-selected text-foreground" : "text-hermes-muted hover:bg-row-hover hover:text-foreground"
            )}
          >
            <div className="font-medium truncate">{s.title}</div>
            <div className="text-[10px] mt-0.5 opacity-60">{s.ts}</div>
          </button>
        ))}
      </div>
    </LeftPanel>
  );
}

export function ChatMain() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-hermes-border">
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-hermes-panel text-hermes-muted">claude-sonnet-4-20250514</span>
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-hermes-panel text-hermes-muted">hermes-agent</span>
        <div className="flex-1" />
        <button className="text-xs text-hermes-muted hover:text-foreground transition-colors">Clear</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {MOCK_MESSAGES.map((msg) => (
          <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-hermes-accent/15 text-foreground"
                  : msg.role === "system"
                  ? "bg-hermes-panel text-hermes-muted font-mono text-xs italic"
                  : "bg-hermes-panel text-foreground"
              )}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              <div className="text-[10px] text-hermes-muted mt-1 text-right">{msg.ts}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status strip */}
      <div className="flex items-center gap-2 px-4 py-1 border-t border-hermes-border text-[11px] text-hermes-muted">
        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
        <span>Connected</span>
        <span className="ml-auto font-mono">tokens: 2,847</span>
      </div>

      {/* Composer */}
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-end gap-2 bg-hermes-panel rounded-lg border border-hermes-border px-3 py-2">
          <button className="p-1 text-hermes-muted hover:text-foreground transition-colors shrink-0">
            <Paperclip size={16} />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-hermes-muted min-h-[24px] max-h-[120px]"
          />
          <button className="p-1 text-hermes-muted hover:text-foreground transition-colors shrink-0">
            <Mic size={16} />
          </button>
          <button className="p-1.5 rounded-md bg-hermes-accent text-background hover:opacity-90 transition-opacity shrink-0">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
