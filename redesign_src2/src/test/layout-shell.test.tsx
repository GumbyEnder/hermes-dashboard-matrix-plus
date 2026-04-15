import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavRail } from "@/components/NavRail";
import { CommandPalette } from "@/components/CommandPalette";

describe("layout shell sections", () => {
  it("shows notes and best practices in the nav rail", () => {
    render(
      <TooltipProvider>
        <NavRail active="notes" onNavigate={vi.fn()} onSettingsOpen={vi.fn()} />
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: /notes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /best practices/i })).toBeInTheDocument();
  });

  it("shows notes and best practices in the command palette", () => {
    render(<CommandPalette open onOpenChange={vi.fn()} onNavigate={vi.fn()} />);

    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Best Practices")).toBeInTheDocument();
  });
});
