/**
 * Finding what a step points at. Targets carry `data-tour="id"` (several ids
 * may share one element, space-separated). Layouts hide whole navigations at
 * some widths with `display: none`, which leaves them with an empty box, so
 * a target counts only while it has a size and isn't `visibility: hidden`.
 */
export function isShown(element: Element): boolean {
  const box = element.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return false;
  return getComputedStyle(element).visibility !== 'hidden';
}

/** The first shown element for the first id that has one, inside `root`. */
export function findTarget(
  root: ParentNode,
  ids: readonly string[],
): HTMLElement | null {
  for (const id of ids) {
    for (const element of Array.from(
      root.querySelectorAll<HTMLElement>(`[data-tour~="${id}"]`),
    )) {
      if (isShown(element)) return element;
    }
  }
  return null;
}

/**
 * Waits for a target to appear, after a step opened another screen whose
 * code is still loading. Gives up after `timeoutMs` (the step then shows
 * in the middle of the screen) or when `signal` aborts.
 */
export function waitForTarget(
  root: ParentNode & Node,
  ids: readonly string[],
  timeoutMs = 1500,
  signal?: AbortSignal,
): Promise<HTMLElement | null> {
  const found = findTarget(root, ids);
  if (found || ids.length === 0) return Promise.resolve(found);
  return new Promise((resolve) => {
    let frame = 0;
    const finish = (element: HTMLElement | null) => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      signal?.removeEventListener('abort', aborted);
      resolve(element);
    };
    const check = () => {
      cancelAnimationFrame(frame);
      // After the frame, so layout (and so the box) is up to date.
      frame = requestAnimationFrame(() => {
        const element = findTarget(root, ids);
        if (element) finish(element);
      });
    };
    const aborted = () => finish(null);
    const observer = new MutationObserver(check);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'data-tour'],
    });
    const timer = setTimeout(() => finish(findTarget(root, ids)), timeoutMs);
    signal?.addEventListener('abort', aborted, { once: true });
    check();
  });
}
