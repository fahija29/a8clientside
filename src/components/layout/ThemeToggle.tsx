"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      // Read the applied theme after mount; setState in a callback, not
      // synchronously in the effect body.
      () => setDark(document.documentElement.classList.contains("dark")),
      0
    );

    return () => window.clearTimeout(timer);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);

    try {
      localStorage.setItem("booknook-theme", next ? "dark" : "light");
    } catch {
      // Ignore storage failures (e.g. private mode); theme just won't persist.
    }
  }

  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-emerald-50/70 dark:hover:bg-white/5 dark:hover:text-white"
    >
      {dark ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
