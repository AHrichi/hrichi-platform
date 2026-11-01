/** True when the element lays out right to left (an Arabic page, say). */
export function isRtl(element: Element): boolean {
  return getComputedStyle(element).direction === 'rtl';
}
