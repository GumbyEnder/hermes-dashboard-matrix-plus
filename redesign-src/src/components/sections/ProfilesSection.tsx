import { LeftPanel } from "@/components/LeftPanel";
import { User, Plus, Copy, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface Profile {
  id: string;
  name: string;
  model: string;
  active: boolean;
}

const MOCK_PROFILES: Profile[] = [
  { id: "1", name: "hermes-agent", model: "claude-sonnet-4-20250514", active: true },
  { id: "2", name: "research-bot", model: "gpt-4o", active: false },
  { id: "3", name: "code-reviewer", model: "claude-3-haiku", active: false },
];

const MODELS = [
  "claude-sonnet-4-20250514",
  "claude-3.5-sonnet",
  "claude-3-haiku",
  "claude-3-opus",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "llama-3.1-70b",
  "mistral-large",
  "deepseek-v3",
];

const SOUL_MD: Record<string, string> = {
  "hermes-agent": `# SOUL.md — hermes-agent

## Identity
You are Hermes, a senior autonomous software agent. You operate with minimal supervision, making architectural decisions and executing complex multi-step workflows.

## Personality
- Direct, concise, technical
- Bias toward action over discussion
- Explain trade-offs when decisions are non-obvious
- Never apologize unnecessarily

## Capabilities
- Full-stack development (TypeScript, Python, Rust)
- Infrastructure & deployment (Docker, k8s, CI/CD)
- Research & analysis (web search, document parsing)
- Project management (ledger events, obsidian notes)

## Rules
1. Always check the project ledger before making changes
2. Write tests for non-trivial logic
3. Prefer composition over inheritance
4. Use sqlite for local storage, postgres for shared state
5. Log all significant actions to the event stream
6. Never expose secrets in logs or responses

## Communication Style
- Use code blocks for anything technical
- Keep explanations under 3 sentences unless asked for detail
- Surface risks and blockers proactively
- Use bullet points, not paragraphs
`,
  "research-bot": `# SOUL.md — research-bot

## Identity
You are a research-focused agent specializing in information synthesis and analysis.

## Personality
- Thorough, citation-driven
- Presents multiple perspectives
- Flags uncertainty explicitly

## Capabilities
- Web search and scraping
- Document analysis and summarization
- Data extraction and structuring

## Rules
1. Always cite sources
2. Distinguish facts from inference
3. Present confidence levels
4. Summarize before deep-diving
`,
  "code-reviewer": `# SOUL.md — code-reviewer

## Identity
You are a meticulous code review agent focused on quality, security, and maintainability.

## Personality
- Precise, constructive
- Points out both issues and good patterns
- Prioritizes security concerns

## Capabilities
- Static analysis
- Security vulnerability detection
- Performance review
- Style and convention checking

## Rules
1. Severity-rank all findings (critical/high/medium/low)
2. Always suggest a fix, not just flag the problem
3. Acknowledge good patterns when seen
4. Check for common CVEs and OWASP top 10
`,
};

export function ProfilesSection() {
  return null; // rendered by parent with props
}

export function ProfilesSectionWithState({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  return (
    <LeftPanel title="Profiles" onRefresh={() => {}} actions={
      <button className="p-1 rounded hover:bg-row-hover text-hermes-muted hover:text-foreground transition-colors">
        <Plus size={14} />
      </button>
    }>
      <div className="px-1 py-1">
        {MOCK_PROFILES.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer group",
              selected === p.id ? "bg-row-selected" : "hover:bg-row-hover"
            )}
          >
            <User size={14} className={selected === p.id ? "text-hermes-accent" : "text-hermes-muted"} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium">{p.name}</div>
              <div className="text-[10px] text-hermes-muted font-mono">{p.model}</div>
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
  const profile = MOCK_PROFILES.find((p) => p.id === selectedId);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full text-hermes-muted text-sm">
        <div className="text-center">
          <User size={40} className="mx-auto mb-3 opacity-30" />
          <p>Select a profile to edit</p>
        </div>
      </div>
    );
  }

  return <ProfileEditor profile={profile} />;
}

function ProfileEditor({ profile }: { profile: Profile }) {
  const [model, setModel] = useState(profile.model);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const soul = SOUL_MD[profile.name] || `# SOUL.md — ${profile.name}\n\nNo soul file configured.`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-hermes-border space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-hermes-accent/15 flex items-center justify-center">
            <User size={16} className="text-hermes-accent" />
          </div>
          <div>
            <h1 className="text-base font-bold font-mono">{profile.name}</h1>
            <div className="text-[11px] text-hermes-muted">Agent Profile</div>
          </div>
        </div>

        {/* Model picker */}
        <div className="relative">
          <label className="text-[11px] font-semibold text-hermes-muted uppercase tracking-wider block mb-1">Model</label>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between bg-hermes-panel border border-hermes-border rounded-md px-3 py-2 text-xs font-mono text-foreground hover:border-hermes-accent/50 transition-colors"
          >
            <span>{model}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={cn("transition-transform", dropdownOpen && "rotate-180")}>
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-hermes-elev border border-hermes-border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {MODELS.map((m) => (
                <button
                  key={m}
                  onClick={() => { setModel(m); setDropdownOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-row-hover transition-colors",
                    m === model && "bg-row-selected text-hermes-accent"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SOUL.md content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 border-b border-hermes-border flex items-center gap-2">
          <span className="text-[11px] font-mono text-hermes-muted">SOUL.md</span>
          <div className="flex-1" />
          <button className="px-2 py-0.5 rounded text-[11px] text-hermes-muted hover:bg-row-hover transition-colors">Edit</button>
        </div>
        <div className="px-4 py-3">
          <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-foreground/90">{soul}</pre>
        </div>
      </div>
    </div>
  );
}
