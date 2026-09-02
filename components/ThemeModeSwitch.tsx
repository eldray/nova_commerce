import React from "react";
import { Sun, Moon } from "lucide-react";
import { useThemeMode } from "../helpers/ThemeModeProvider";

export function ThemeModeSwitch({ className = "" }: { className?: string }) {
  try {
    const { resolvedTheme, setMode, mode } = useThemeMode();

    const toggle = () => {
      setMode(resolvedTheme === "dark" ? "light" : "dark");
    };

    return (
      <button
        type="button"
        onClick={toggle}
        className={className}
        aria-label="Toggle theme mode"
        style={{
          background: "transparent",
          border: "1px solid var(--border, #ccc)",
          borderRadius: "var(--radius, 0.625rem)",
          padding: "0.4rem 0.6rem",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--foreground, #111)",
        }}
      >
        {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    );
  } catch (error) {
    // Fallback if ThemeModeProvider is not available
    console.warn('ThemeModeSwitch: ThemeModeProvider not available');
    return (
      <button
        type="button"
        className={className}
        aria-label="Toggle theme mode"
        style={{
          background: "transparent",
          border: "1px solid var(--border, #ccc)",
          borderRadius: "var(--radius, 0.625rem)",
          padding: "0.4rem 0.6rem",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--foreground, #111)",
        }}
      >
        <Moon size={18} />
      </button>
    );
  }
}
