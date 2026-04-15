import { useState, useCallback, useMemo, useEffect } from "react";
import { NavRail, type NavSection } from "@/components/NavRail";
import { WorkspacePanel } from "@/components/WorkspacePanel";
import { SettingsModal } from "@/components/SettingsModal";
import { useTheme } from "@/hooks/use-theme";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { CommandPalette } from "@/components/CommandPalette";
import { ChevronRight, PanelLeftClose, PanelRightClose } from "lucide-react";
import { ChatSection, ChatMain } from "@/components/sections/ChatSection";
import { TasksSection, TasksMain } from "@/components/sections/TasksSection";
import { SkillsSection, SkillsMain } from "@/components/sections/SkillsSection";
import { MemorySection, MemoryMain } from "@/components/sections/MemorySection";
import { SpacesSection, SpacesMain } from "@/components/sections/SpacesSection";
import { ReportsSection, ReportsMain } from "@/components/sections/ReportsSection";
import { ProjectsSection, ProjectsMain } from "@/components/sections/ProjectsSection";
import { ProfilesSectionWithState, ProfilesMain } from "@/components/sections/ProfilesSection";
import { TodosSection, TodosMain } from "@/components/sections/TodosSection";
import { AsciiSidebar, AsciiMain } from "@/components/sections/AsciiSection";
import { Toaster, toast } from "@/components/ui/sonner";

const NAV_ORDER: NavSection[] = [
  "chat", "projects", "tasks", "skills", "memory", "spaces", "reports", "profiles", "todos",
];

const SECTION_LABELS: Record<NavSection, string> = {
  chat: "Chat", tasks: "Tasks", skills: "Skills", memory: "Memory",
  spaces: "Spaces", reports: "Reports", projects: "Projects", profiles: "Profiles",
  todos: "Todos", ascii: "ASCII Art",
};

const SECTION_MAP: Record<NavSection, { left: React.ComponentType; main: React.ComponentType }> = {
  chat: { left: ChatSection, main: ChatMain },
  tasks: { left: TasksSection, main: TasksMain },
  skills: { left: SkillsSection, main: SkillsMain },
  memory: { left: MemorySection, main: MemoryMain },
  spaces: { left: SpacesSection, main: SpacesMain },
  reports: { left: ReportsSection, main: ReportsMain },
  projects: { left: ProjectsSection, main: ProjectsMain },
  profiles: { left: () => null, main: () => null },
  todos: { left: TodosSection, main: TodosMain },
  ascii: { left: AsciiSidebar, main: AsciiMain },
};

const AGENT_EVENTS = [
  { title: "Task complete", desc: "Daily summary report finished" },
  { title: "Build succeeded", desc: "hermes-core v2.4.1 deployed" },
  { title: "New commit", desc: "fix: memory leak in pooler" },
  { title: "Health check", desc: "All 12 services healthy" },
  { title: "Sync complete", desc: "Obsidian notes synced (14 files)" },
  { title: "Alert resolved", desc: "CPU spike on node-03 subsided" },
];

export function AppShell() {
  const [activeSection, setActiveSection] = useState<NavSection>("chat");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(280);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>("1");
  const { theme, changeTheme } = useTheme();

  const isProfiles = activeSection === "profiles";
  const { left: LeftComp, main: MainComp } = SECTION_MAP[activeSection];

  const breadcrumbs = useMemo(() => {
    const crumbs = ["Hermes", SECTION_LABELS[activeSection]];
    if (isProfiles && selectedProfileId) {
      const names: Record<string, string> = { "1": "hermes-agent", "2": "research-bot", "3": "code-reviewer" };
      crumbs.push(names[selectedProfileId] || selectedProfileId);
    }
    return crumbs;
  }, [activeSection, isProfiles, selectedProfileId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9 && NAV_ORDER[num - 1]) {
          e.preventDefault();
          setActiveSection(NAV_ORDER[num - 1]);
          return;
        }
        if (e.key === "k") { e.preventDefault(); setCmdOpen(true); return; }
        if (e.key === "b" && !e.shiftKey) { e.preventDefault(); setLeftCollapsed((p) => !p); return; }
        if (e.key === "b" && e.shiftKey) { e.preventDefault(); setRightCollapsed((p) => !p); return; }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Notification toasts
  useEffect(() => {
    const fire = () => {
      const ev = AGENT_EVENTS[Math.floor(Math.random() * AGENT_EVENTS.length)];
      toast(ev.title, { description: ev.desc });
    };
    const id = setInterval(fire, 20000 + Math.random() * 15000);
    return () => clearInterval(id);
  }, []);

  const handleLeftResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = leftWidth;
    const onMove = (ev: MouseEvent) => setLeftWidth(Math.max(200, Math.min(400, startW + ev.clientX - startX)));
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [leftWidth]);

  const handleRightResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = rightWidth;
    const onMove = (ev: MouseEvent) => setRightWidth(Math.max(200, Math.min(400, startW - (ev.clientX - startX))));
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [rightWidth]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <NavRail active={activeSection} onNavigate={setActiveSection} onSettingsOpen={() => setSettingsOpen(true)} />

      {/* Left panel */}
      <div className="shrink-0 h-full overflow-hidden transition-[width] duration-200" style={{ width: leftCollapsed ? 0 : leftWidth }}>
        {isProfiles
          ? <ProfilesSectionWithState selected={selectedProfileId} onSelect={setSelectedProfileId} />
          : <LeftComp />}
      </div>

      {/* Left divider */}
      <div
        className="w-1 shrink-0 cursor-col-resize hover:bg-hermes-accent/30 active:bg-hermes-accent/50 transition-colors relative group"
        onMouseDown={handleLeftResize}
        onDoubleClick={() => setLeftCollapsed((p) => !p)}
      >
        {leftCollapsed && (
          <button onClick={() => setLeftCollapsed(false)} className="absolute top-1/2 -translate-y-1/2 left-0 z-10 p-0.5 rounded bg-hermes-panel border border-hermes-border text-hermes-muted hover:text-foreground">
            <PanelLeftClose size={12} />
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 h-full bg-background flex flex-col">
        <div className="h-8 shrink-0 flex items-center justify-between px-3 border-b border-hermes-border bg-secondary/30">
          <nav className="flex items-center gap-1 text-[11px]">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={10} className="text-hermes-muted/50" />}
                <span className={i === breadcrumbs.length - 1 ? "font-semibold text-foreground" : "text-hermes-muted hover:text-foreground cursor-pointer transition-colors"}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
          <ThemeSwitcher />
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          {isProfiles ? <ProfilesMain selectedId={selectedProfileId} /> : <MainComp />}
        </div>
      </div>

      {/* Right divider */}
      <div
        className="w-1 shrink-0 cursor-col-resize hover:bg-hermes-accent/30 active:bg-hermes-accent/50 transition-colors relative"
        onMouseDown={handleRightResize}
        onDoubleClick={() => setRightCollapsed((p) => !p)}
      >
        {rightCollapsed && (
          <button onClick={() => setRightCollapsed(false)} className="absolute top-1/2 -translate-y-1/2 right-0 z-10 p-0.5 rounded bg-hermes-panel border border-hermes-border text-hermes-muted hover:text-foreground">
            <PanelRightClose size={12} />
          </button>
        )}
      </div>

      {/* Right panel */}
      <div className="shrink-0 h-full overflow-hidden transition-[width] duration-200" style={{ width: rightCollapsed ? 0 : rightWidth }}>
        <WorkspacePanel />
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} onNavigate={setActiveSection} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} theme={theme} onThemeChange={changeTheme} />
      <Toaster position="bottom-right" />
    </div>
  );
}
