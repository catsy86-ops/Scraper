import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const ThemeToggle = () => {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      aria-label={dark ? "Tryb jasny" : "Tryb ciemny"}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default ThemeToggle;
