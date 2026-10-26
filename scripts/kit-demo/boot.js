// Load synchronously before styles to restore the consumer's theme without a flash.
(() => {
  const html = document.documentElement;
  let theme = html.dataset.theme;
  try { theme = localStorage.getItem(`forma.kit.${html.dataset.kit}.${html.dataset.palette}.theme`) || theme; } catch { /* Storage is optional. */ }
  html.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  html.dataset.density = html.dataset.density === 'compact' ? 'compact' : 'comfortable';
})();
