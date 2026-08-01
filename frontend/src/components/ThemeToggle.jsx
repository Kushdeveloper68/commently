import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-panel2 transition-colors ${className}`}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
