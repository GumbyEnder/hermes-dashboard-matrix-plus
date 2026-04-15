import { THEMES } from "@/lib/theme";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, changeTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-secondary/50 rounded-md p-0.5">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => changeTheme(t.id)}
          className={cn(
            "px-2.5 py-1 rounded text-[11px] font-medium transition-all",
            theme === t.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-row-hover"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
