// Light / dark theme. Follows the OS preference on first load, then remembers
// the user's explicit choice. The `dark` class on <html> drives the palette
// remap defined in index.css.
const STORAGE_KEY = 'internconnect-theme';

export function applyInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  const dark = stored
    ? stored === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', dark);
}

export function isDark() {
  return document.documentElement.classList.contains('dark');
}

export function setDarkMode(dark) {
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
}
