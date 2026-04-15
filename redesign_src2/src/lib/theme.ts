export const THEMES = [
  { id: "nord", label: "Starter" },
  { id: "matrix", label: "Matrix" },
  { id: "bwg", label: "Dark" },
  { id: "chroma", label: "Chroma" },
  { id: "white", label: "White" },
  { id: "amber", label: "Amber" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "hermes-theme";

export function getStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some((t) => t.id === stored)) return stored as ThemeId;
  } catch {}
  return "nord";
}

export function setStoredTheme(id: ThemeId) {
  localStorage.setItem(STORAGE_KEY, id);
  document.documentElement.setAttribute("data-theme", id);
}

export function initTheme() {
  const theme = getStoredTheme();
  document.documentElement.setAttribute("data-theme", theme);
  return theme;
}
