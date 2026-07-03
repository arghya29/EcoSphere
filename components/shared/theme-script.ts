export const THEME_STORAGE_KEY = 'ecosphere-theme';

export const THEME_INIT_SCRIPT = `
  (function() {
    var theme = null;
    try {
      theme = localStorage.getItem('${THEME_STORAGE_KEY}');
    } catch (error) {}
    if (theme !== 'light' && theme !== 'dark') {
      theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.classList.toggle('dark', theme === 'dark');
  })();
`;
