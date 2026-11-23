/** Arabic-Indic (٠–٩) and Persian (۰–۹) digits, as phone keyboards type them. */
const EASTERN_DIGITS = /[٠-٩۰-۹]/g;

/**
 * A number from what a supervisor typed: Latin or Arabic-Indic digits, a
 * decimal point or comma (`7,5`, `٧٫٥`). Empty text is null; anything else
 * that isn't a number is NaN, so the form can say so.
 */
export function parseNumber(text: string): number | null {
  const latin = text
    .trim()
    .replace(EASTERN_DIGITS, (d) => String(d.charCodeAt(0) & 0xf))
    // Arabic decimal separator, and the comma used in French and Arabic.
    .replace(/[٫,]/g, '.')
    .replace(/\s+/g, '');
  if (latin === '') return null;
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(latin)) return Number.NaN;
  return Number(latin);
}

/** A stepper's next value: one step up or down, kept within bounds. */
export function stepValue(
  value: number | null,
  delta: number,
  bounds: { min: number; max: number },
): number {
  const base = value === null || Number.isNaN(value) ? 0 : value;
  const next = Math.round((base + delta) * 100) / 100;
  return Math.min(bounds.max, Math.max(bounds.min, next));
}
