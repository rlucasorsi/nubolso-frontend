// Lightweight pub-sub so the global MobileNav can trigger the "add entry"
// drawer owned by whichever page is currently mounted (e.g. PainelView),
// without lifting that state into the shared layout.
let handler: (() => void) | null = null;

export function setQuickAddHandler(fn: (() => void) | null) {
  handler = fn;
}

export function triggerQuickAdd(): boolean {
  if (!handler) return false;
  handler();
  return true;
}
