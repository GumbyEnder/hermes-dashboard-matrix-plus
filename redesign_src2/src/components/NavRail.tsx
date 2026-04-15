import {
  MessageSquare,
  CalendarCheck,
  Layers,
  Brain,
  NotebookTabs,
  Folder,
  BarChart3,
  Briefcase,
  BookMarked,
  ShieldCheck,
  User,
  ListChecks,
  Settings,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type NavSection =
  | "chat" | "tasks" | "skills" | "memory"
  | "notes" | "best-practices" | "spaces" | "reports" | "projects" | "profiles" | "todos" | "ascii"
  | "agents" | "maintenance";

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ElementType; shortcut?: string }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare, shortcut: "Ctrl+1" },
  { id: "projects", label: "Projects", icon: Briefcase, shortcut: "Ctrl+2" },
  { id: "tasks", label: "Tasks", icon: CalendarCheck, shortcut: "Ctrl+3" },
  { id: "skills", label: "Skills", icon: Layers, shortcut: "Ctrl+4" },
  { id: "memory", label: "Memory", icon: Brain, shortcut: "Ctrl+5" },
  { id: "notes", label: "Notes", icon: NotebookTabs },
  { id: "best-practices", label: "Best Practices", icon: BookMarked },
  { id: "spaces", label: "Spaces", icon: Folder, shortcut: "Ctrl+6" },
  { id: "reports", label: "Reports", icon: BarChart3, shortcut: "Ctrl+7" },
  { id: "agents", label: "Agents", icon: User, shortcut: "Ctrl+8" },
  { id: "profiles", label: "Profiles", icon: User, shortcut: "Ctrl+9" },
  { id: "maintenance", label: "Maintenance", icon: ShieldCheck },
  { id: "todos", label: "Todos", icon: ListChecks },
];

interface NavRailProps {
  active: NavSection;
  onNavigate: (section: NavSection) => void;
  onSettingsOpen: () => void;
}

export function NavRail({ active, onNavigate, onSettingsOpen }: NavRailProps) {
  return (
    <nav className="flex flex-col items-center w-12 py-3 gap-1 bg-hermes-panel border-r border-hermes-border shrink-0">
      <div className="font-mono text-xs font-bold mb-3 tracking-widest" style={{ color: "hsl(45, 100%, 55%)" }}>H</div>
      {NAV_ITEMS.map((item) => (
        <Tooltip key={item.id} delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onNavigate(item.id)}
              aria-label={item.label}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-md transition-colors",
                active === item.id
                  ? "bg-hermes-accent/20 text-hermes-accent"
                  : "text-hermes-muted hover:text-foreground hover:bg-row-hover"
              )}
            >
              <item.icon size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {item.label}
            {item.shortcut && <span className="ml-2 text-hermes-muted text-[10px]">{item.shortcut}</span>}
          </TooltipContent>
        </Tooltip>
      ))}
      <div className="flex-1" />
      {/* ASCII Art icon */}
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            onClick={() => onNavigate("ascii")}
            aria-label="ASCII Art"
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-md transition-colors font-mono text-xs font-bold",
              active === "ascii"
                ? "bg-hermes-accent/20 text-hermes-accent"
                : "text-hermes-muted hover:text-foreground hover:bg-row-hover"
            )}
          >
            <Terminal size={18} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">ASCII Art</TooltipContent>
      </Tooltip>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            onClick={onSettingsOpen}
            aria-label="Settings"
            className="w-9 h-9 flex items-center justify-center rounded-md text-hermes-muted hover:text-foreground hover:bg-row-hover transition-colors"
          >
            <Settings size={18} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">Settings</TooltipContent>
      </Tooltip>
    </nav>
  );
}
