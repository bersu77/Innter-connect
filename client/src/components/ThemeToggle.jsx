import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { isDark, setDarkMode } from '../lib/theme';

// Light / dark mode toggle for the dashboard header.
export default function ThemeToggle() {
  const [dark, setDark] = useState(isDark);

  function toggle() {
    const next = !dark;
    setDarkMode(next);
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
    >
      {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
