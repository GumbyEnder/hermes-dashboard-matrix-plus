import { useState, useCallback, useMemo, useEffect } from "react";
import { NavRail, type NavSection } from "@/components/NavRail";
import { WorkspacePanel } from "@/components/WorkspacePanel";
import { SettingsModal } from "@/components/SettingsModal";
import { useTheme } from "@/hooks/use-theme";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { CommandPalette } from "@/components/CommandPalette";
import { ShortcutsOverlay } from "@/components/ShortcutsOverlay";
import { ChevronRight, PanelLeftClose, PanelRightClose } from "lucide-react";
import { HermesHeader } from "@/components/HermesHeader";
import { ChatSection, ChatMain } from "@/components/sections/ChatSection";
import { TasksSection, TasksMain } from "@/components/sections/TasksSection";
import { SkillsSection, SkillsMain } from "@/components/sections/SkillsSection";
import { MemorySection, MemoryMain } from "@/components/sections/MemorySection";
import { SpacesSection, SpacesMain } from "@/components/sections/SpacesSection";
import { ReportsSection, ReportsMain } from "@/components/sections/ReportsSection";
import { ProjectsSection, ProjectsMain } from "@/components/sections/ProjectsSection";
import { ProfilesSectionWithState, ProfilesMain } from "@/components/sections/ProfilesSection";
import { AgentsSection, AgentsMain } from "@/components/sections/AgentsSection";
import { TodosSection, TodosMain } from "@/components/sections/TodosSection";
import { NotesSection, NotesMain } from "@/components/sections/NotesSection";
import { BestPracticesSection, BestPracticesMain } from "@/components/sections/BestPracticesSection";
import { AsciiSidebar, AsciiMain } from "@/components/sections/AsciiSection";
import { MaintenanceSection, MaintenanceMain } from "@/components/sections/MaintenanceSection";
import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "framer-motion";

const NAV_ORDER: NavSection[] = [
  "chat", "projects", "tasks", "skills", "memory", "spaces", "reports", "agents", "profiles", "todos", "notes", "best-practices",
  "maintenance",
];

const SECTION_LABELS: Record<NavSection, string> = {
  chat: "Chat", tasks: "Tasks", skills: "Skills", memory: "Memory",
  spaces: "Spaces", reports: "Reports", projects: "Projects", profiles: "Profiles",
  agents: "Agents",
  maintenance: "Maintenance",
  todos: "Todos", notes: "Notes", "best-practices": "Best Practices", ascii: "ASCII Art",
};

const SECTION_MAP: Record<NavSection, { left: React.ComponentType; main: React.ComponentType }> = {
  chat: { left: ChatSection, main: ChatMain },
  tasks: { left: TasksSection, main: TasksMain },
  skills: { left: SkillsSection, main: SkillsMain },
  memory: { left: MemorySection, main: MemoryMain },
  spaces: { left: SpacesSection, main: SpacesMain },
  reports: { left: ReportsSection, main: ReportsMain },
  projects: { left: ProjectsSection, main: ProjectsMain },
  agents: { left: () => null, main: () => null },
  profiles: { left: () => null, main: () => null },
  maintenance: { left: MaintenanceSection, main: MaintenanceMain },
  todos: { left: TodosSection, main: TodosMain },
  notes: { left: NotesSection, main: NotesMain },
  "best-practices": { left: BestPracticesSection, main: BestPracticesMain },
  ascii: { left: AsciiSidebar, main: AsciiMain },
};

const BREAKPOINT_MD = 1024;
const BREAKPOINT_SM = 768;

export function AppShell() {
const [activeSection, setActiveSection] = useState<NavSection>("chat");
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(null);
  const [selectedWorkspacePath, setSelectedWorkspacePath] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(280);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { theme, changeTheme } = useTheme();

  const isProfiles = activeSection === "profiles";
  const isAgents = activeSection === "agents";
  const { left: LeftComp, main: MainComp } = SECTION_MAP[activeSection];

  const breadcrumbs = useMemo(() => {
    const crumbs = ["Hermes", SECTION_LABELS[activeSection]];
    if (isProfiles && selectedProfileId) {
      crumbs.push(selectedProfileId);
    } else if (isAgents && selectedAgentId) {
      crumbs.push(selectedAgentId);
    }
    return crumbs;
  }, [activeSection, isAgents, isProfiles, selectedAgentId, selectedProfileId]);

  // Responsive auto-collapse
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < BREAKPOINT_SM) {
        setLeftCollapsed(true);
        setRightCollapsed(true);
      } else if (w < BREAKPOINT_MD) {
        setRightCollapsed(true);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ? key (no modifiers, not in an input)
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          setShortcutsOpen((p) => !p);
          return;
        }
      }
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

  useEffect(() => {
    const handleAuthExpired = () => {
      window.location.assign("/login");
    };
    window.addEventListener("hermes:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("hermes:auth-expired", handleAuthExpired);
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
 {activeSection === "chat" ? <ChatSection activeSessionId={chatSessionId} onSessionSelect={setChatSessionId} /> : activeSection === "projects" ? <ProjectsSection selectedProjectId={selectedProjectId} onProjectSelect={setSelectedProjectId} /> : activeSection === "tasks" ? <TasksSection selectedTaskId={selectedTaskId} onTaskSelect={setSelectedTaskId} /> : activeSection === "skills" ? <SkillsSection selectedSkillName={selectedSkillName} onSkillSelect={setSelectedSkillName} /> : activeSection === "spaces" ? <SpacesSection selectedWorkspacePath={selectedWorkspacePath} onWorkspaceSelect={setSelectedWorkspacePath} /> : activeSection === "notes" ? <NotesSection selectedNoteId={selectedNoteId} onNoteSelect={setSelectedNoteId} /> : isAgents ? <AgentsSection selectedAgent={selectedAgentId} onAgentSelect={setSelectedAgentId} /> : isProfiles ? <ProfilesSectionWithState selected={selectedProfileId} onSelect={setSelectedProfileId} /> : <LeftComp />} 
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
        <HermesHeader theme={theme} />
        {/* Breadcrumb bar */}
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
        {/* Section content with transitions */}
        <div className="flex-1 min-h-0 overflow-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="h-full"
            >
              {activeSection === "chat" ? (
                <ChatMain sessionId={chatSessionId} onSessionChange={setChatSessionId} />
              ) : activeSection === "projects" ? (
                <ProjectsMain selectedProjectId={selectedProjectId} />
              ) : activeSection === "tasks" ? (
                <TasksMain selectedTaskId={selectedTaskId} />
              ) : activeSection === "skills" ? (
                <SkillsMain selectedSkillName={selectedSkillName} onSkillSelect={setSelectedSkillName} />
              ) : activeSection === "spaces" ? (
                <SpacesMain selectedWorkspacePath={selectedWorkspacePath} onWorkspaceSelect={setSelectedWorkspacePath} />
              ) : activeSection === "notes" ? (
                <NotesMain selectedNoteId={selectedNoteId} onNoteSelect={setSelectedNoteId} />
              ) : isAgents ? (
                <AgentsMain selectedAgent={selectedAgentId} onAgentSelect={setSelectedAgentId} />
              ) : isProfiles ? (
                <ProfilesMain selectedId={selectedProfileId} />
              ) : (
                <MainComp />
              )}
            </motion.div>
          </AnimatePresence>
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
        <WorkspacePanel sessionId={chatSessionId} />
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} onNavigate={setActiveSection} />
      <ShortcutsOverlay open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} theme={theme} onThemeChange={changeTheme} />
      <Toaster position="bottom-right" />
    </div>
  );
}
