export const THRESHOLDS = [
  100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000,
] as const

const SET = new Set<number>(THRESHOLDS)

/** A milestone fires iff clicks lands exactly on a threshold value. */
export function crossedThreshold(clicks: number): number | null {
  return SET.has(clicks) ? clicks : null
}

/** The next milestone above `clicks`, or null once the ladder is topped out. */
export function nextThreshold(clicks: number): number | null {
  for (const t of THRESHOLDS) if (t > clicks) return t
  return null
}
