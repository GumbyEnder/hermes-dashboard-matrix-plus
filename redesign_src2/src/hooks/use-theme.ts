import { useState, useEffect } from "react";
import { type ThemeId, initTheme, setStoredTheme } from "@/lib/theme";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>(initTheme);

  useEffect(() => { initTheme(); }, []);

  const changeTheme = (id: ThemeId) => {
    setStoredTheme(id);
    setTheme(id);
  };

  return { theme, changeTheme };
}
