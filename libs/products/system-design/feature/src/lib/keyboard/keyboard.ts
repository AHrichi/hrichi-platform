export interface SystemDesignKeyHandlers {
  overlayOpen?: () => boolean;
  openSearch?: () => void;
  closeOverlays?: () => boolean;
  nextStep?: () => void;
  prevStep?: () => void;
  firstStep?: () => void;
  lastStep?: () => void;
  replay?: () => void;
  togglePlay?: () => void;
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""]',
    ),
  );
}

function isInteractiveControl(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('button, a, summary, [role="button"]'));
}

/**
 * Global keyboard shortcuts for the System Design course (technical-design §5):
 * - `Ctrl/⌘ + K`: open search
 * - `Escape`: close search dialog or drawer
 * - `←` / `→`: step backward / forward
 * - `Home` / `End`: first / last step
 * - `R`: replay current step's packets
 * - `Space`: pause or resume animation
 *
 * Returns `true` when the key was handled.
 */
export function handleSystemDesignKey(
  event: KeyboardEvent,
  handlers: SystemDesignKeyHandlers,
): boolean {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    if (handlers.openSearch) {
      event.preventDefault();
      handlers.openSearch();
      return true;
    }
    return false;
  }

  if (event.key === 'Escape') {
    if (handlers.closeOverlays?.()) {
      event.preventDefault();
      return true;
    }
    return false;
  }

  if (handlers.overlayOpen?.() || isEditableElement(event.target)) {
    return false;
  }

  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }

  switch (event.key) {
    case 'ArrowRight':
      if (!handlers.nextStep) return false;
      event.preventDefault();
      handlers.nextStep();
      return true;
    case 'ArrowLeft':
      if (!handlers.prevStep) return false;
      event.preventDefault();
      handlers.prevStep();
      return true;
    case 'Home':
      if (!handlers.firstStep) return false;
      event.preventDefault();
      handlers.firstStep();
      return true;
    case 'End':
      if (!handlers.lastStep) return false;
      event.preventDefault();
      handlers.lastStep();
      return true;
    case 'r':
    case 'R':
      if (!handlers.replay) return false;
      event.preventDefault();
      handlers.replay();
      return true;
    case ' ':
      if (!handlers.togglePlay || isInteractiveControl(event.target)) {
        return false;
      }
      event.preventDefault();
      handlers.togglePlay();
      return true;
    default:
      return false;
  }
}
