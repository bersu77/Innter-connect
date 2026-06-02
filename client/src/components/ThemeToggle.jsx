import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { isDark, setDarkMode } from '../lib/theme';

// Light / dark toggle — v2 ghost button sized for the header.
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
      className="btn btn-ghost btn-sm"
      style={{ width: 36, height: 36, padding: 0 }}
    >
      {dark ? <Sun size={18} strokeWidth={1.6} /> : <Moon size={18} strokeWidth={1.6} />}
    </button>
  );
}
