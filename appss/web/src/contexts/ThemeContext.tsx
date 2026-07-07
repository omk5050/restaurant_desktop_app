import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeAccent = "orange" | "blue" | "green" | "purple";
export type ThemeScale = "90" | "100" | "110";
export type ThemeCardStyle = "soft" | "sharp";

export interface ThemeState {
  mode: ThemeMode;
  accent: ThemeAccent;
  compact: boolean;
  scale: ThemeScale;
  reducedMotion: boolean;
  cardStyle: ThemeCardStyle;
}

export interface ThemeContextValue extends ThemeState {
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: ThemeAccent) => void;
  setCompact: (compact: boolean) => void;
  setScale: (scale: ThemeScale) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setCardStyle: (cardStyle: ThemeCardStyle) => void;
}

const DEFAULT_THEME: ThemeState = {
  mode: "light",
  accent: "orange",
  compact: false,
  scale: "100",
  reducedMotion: false,
  cardStyle: "soft",
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ThemeState>(() => {
    try {
      const stored = localStorage.getItem("pos-appearance-settings");
      if (stored) return { ...DEFAULT_THEME, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_THEME;
  });

  const updateState = (updates: Partial<ThemeState>) => {
    setState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("pos-appearance-settings", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const root = document.documentElement;

    // 1. Theme Mode
    let activeMode = state.mode;
    if (activeMode === "system") {
      activeMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    
    if (activeMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // 2. Accent Color
    root.setAttribute("data-accent", state.accent);

    // 3. Compact Mode
    if (state.compact) {
      root.setAttribute("data-compact", "true");
    } else {
      root.removeAttribute("data-compact");
    }

    // 4. UI Scale
    root.setAttribute("data-scale", state.scale);

    // 5. Reduced Motion
    if (state.reducedMotion) {
      root.setAttribute("data-reduced-motion", "true");
    } else {
      root.removeAttribute("data-reduced-motion");
    }

    // 6. Card Style
    if (state.cardStyle === "sharp") {
      root.setAttribute("data-card-style", "sharp");
    } else {
      root.removeAttribute("data-card-style");
    }

  }, [state]);

  const value: ThemeContextValue = {
    ...state,
    setMode: (mode) => updateState({ mode }),
    setAccent: (accent) => updateState({ accent }),
    setCompact: (compact) => updateState({ compact }),
    setScale: (scale) => updateState({ scale }),
    setReducedMotion: (reducedMotion) => updateState({ reducedMotion }),
    setCardStyle: (cardStyle) => updateState({ cardStyle }),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
