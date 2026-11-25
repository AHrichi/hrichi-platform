/**
 * About four round steps from 0 (or the low end) up to the first step at or
 * above the high end, so the tallest bar always fits under the top line.
 */
export function ticks(low: number, high: number): number[] {
  const span = Math.max(1e-9, high - low);
  const raw = span / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? raw;
  const start = Math.floor(low / step) * step;
  const out: number[] = [Number(start.toFixed(6))];
  while (out[out.length - 1] < high - step * 0.001) {
    out.push(Number((out[out.length - 1] + step).toFixed(6)));
  }
  if (out.length < 2) out.push(Number((start + step).toFixed(6)));
  return out;
}
