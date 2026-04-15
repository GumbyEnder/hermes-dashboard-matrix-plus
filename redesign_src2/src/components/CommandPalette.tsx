import { useEffect } from "react";
import {
  CommandDialog, CommandInput, CommandList,
  CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import {
  MessageSquare, Briefcase, CalendarCheck, Layers, Brain,
  NotebookTabs, BookMarked, Folder, BarChart3, User, ListChecks, Terminal,
} from "lucide-react";
import type { NavSection } from "@/components/NavRail";

const SECTIONS: { id: NavSection; label: string; icon: React.ElementType }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "projects", label: "Projects", icon: Briefcase },
  { id: "tasks", label: "Tasks", icon: CalendarCheck },
  { id: "skills", label: "Skills", icon: Layers },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "notes", label: "Notes", icon: NotebookTabs },
  { id: "best-practices", label: "Best Practices", icon: BookMarked },
  { id: "spaces", label: "Spaces", icon: Folder },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "profiles", label: "Profiles", icon: User },
  { id: "todos", label: "Todos", icon: ListChecks },
  { id: "ascii", label: "ASCII Art", icon: Terminal },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (section: NavSection) => void;
}

export function CommandPalette({ open, onOpenChange, onNavigate }: CommandPaletteProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search sections, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Sections">
          {SECTIONS.map((s) => (
            <CommandItem key={s.id} onSelect={() => { onNavigate(s.id); onOpenChange(false); }}>
              <s.icon size={16} className="mr-2 text-hermes-muted" />
              {s.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => onOpenChange(false)}>New Chat</CommandItem>
          <CommandItem onSelect={() => onOpenChange(false)}>New Task</CommandItem>
          <CommandItem onSelect={() => onOpenChange(false)}>Toggle Theme</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
