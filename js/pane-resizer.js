import { onDetach } from '../components/playground.js';
import { clampPaneWidths, loadPaneWidths, savePaneWidths, resizePaneWidths } from './logic/layout.js';

/** DOM adapter for the shared, pure pane-width model. Container fitting never saves preferences. */
export function attachPaneResizer({ element, panes, separators, widths, minWidths, maxWidths = [], storageKey, onCompact = () => {} }) {
  let storage;
  try { storage = window.localStorage; } catch { /* Preferences are optional when storage is blocked. */ }
  const limits = { minWidths, maxWidths };
  let preferred = storageKey ? loadPaneWidths(storage, storageKey, widths, limits) : clampPaneWidths(widths, limits);
  let current = [...preferred];
  let available = 0;
  let compact = null;
  let drag;
  let disposed = false;
  const listeners = new AbortController();
  const phone = window.matchMedia('(max-width: 767px)');

  function paint() {
    element.style.gridTemplateColumns = current.map((width, index) => `${index ? 'var(--space-3) ' : ''}${width}px`).join(' ');
    separators.forEach((separator, index) => {
      const options = { ...limits, totalWidth: available };
      const minimum = resizePaneWidths(current, index, -available, options)[index];
      const maximum = resizePaneWidths(current, index, available, options)[index];
      separator.setAttribute('aria-valuemin', String(Math.round(minimum)));
      separator.setAttribute('aria-valuemax', String(Math.round(maximum)));
      separator.setAttribute('aria-valuenow', String(Math.round(current[index])));
      separator.setAttribute('aria-valuetext', `${Math.round(current[index])} pixels`);
    });
  }

  function finishDrag(event) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    const { separator, id } = drag;
    drag = undefined;
    element.removeAttribute('data-resizing');
    if (separator.hasPointerCapture?.(id)) separator.releasePointerCapture(id);
  }

  function measure() {
    if (disposed) return;
    const width = element.getBoundingClientRect().width;
    if (width <= 0) return;
    const dividerWidth = separators.reduce((sum, separator) => sum + (separator.getBoundingClientRect().width || parseFloat(getComputedStyle(element).getPropertyValue('--space-3')) || 12), 0);
    available = Math.max(0, width - dividerWidth);
    const nextCompact = phone.matches || available < minWidths.reduce((sum, minimum) => sum + minimum, 0);
    if (nextCompact !== compact) {
      finishDrag();
      compact = nextCompact;
      element.dataset.compact = String(compact);
      separators.forEach(separator => { separator.hidden = compact; });
      onCompact(compact);
    }
    // Keep the restored/user preference distinct from the temporary container fit.
    const total = preferred.reduce((sum, value) => sum + value, 0);
    current = clampPaneWidths(preferred.map(value => total ? value * available / total : available / panes.length), { ...limits, totalWidth: available });
    paint();
  }

  function resize(index, delta) {
    if (disposed || compact || !available) return;
    current = resizePaneWidths(current, index, delta, { ...limits, totalWidth: available });
    preferred = [...current];
    if (storageKey) savePaneWidths(storage, storageKey, preferred, limits);
    paint();
  }

  separators.forEach((separator, index) => {
    separator.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || event.altKey || event.metaKey || event.ctrlKey) return;
      event.preventDefault();
      resize(index, event.key === 'Home' ? -available : event.key === 'End' ? available : (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 40 : 10));
    }, { signal: listeners.signal });
    separator.addEventListener('pointerdown', event => {
      if (event.button !== 0 || compact) return;
      event.preventDefault();
      separator.focus();
      drag = { id: event.pointerId, separator, index, x: event.clientX };
      element.dataset.resizing = 'true';
      separator.setPointerCapture?.(event.pointerId);
    }, { signal: listeners.signal });
    separator.addEventListener('lostpointercapture', finishDrag, { signal: listeners.signal });
  });
  window.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const delta = event.clientX - drag.x;
    drag.x = event.clientX;
    resize(drag.index, delta);
  }, { signal: listeners.signal });
  window.addEventListener('pointerup', finishDrag, { signal: listeners.signal });
  window.addEventListener('pointercancel', finishDrag, { signal: listeners.signal });
  window.addEventListener('resize', measure, { signal: listeners.signal });
  phone.addEventListener('change', measure, { signal: listeners.signal });
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
  observer?.observe(element);
  const frame = requestAnimationFrame(measure);

  function destroy() {
    if (disposed) return;
    finishDrag();
    disposed = true;
    listeners.abort();
    observer?.disconnect();
    cancelAnimationFrame(frame);
  }
  onDetach(element, destroy);
  return { get widths() { return [...current]; }, get compact() { return compact; }, resize, destroy };
}
