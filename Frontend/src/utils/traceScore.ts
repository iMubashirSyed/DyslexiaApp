import type {Point} from '../data/letterStrokeGuides';

export type Stroke = Point[];

export type TraceScoreResult = {
  /** Combined accuracy (guide coverage × ink precision). */
  percent: number;
  /** How much of the dashed guide was hit. */
  coveragePercent: number;
  /** How much of the user's ink stayed on the guide. */
  precisionPercent: number;
  covered: number;
  total: number;
  coveredFlags: boolean[];
};

function hitsAny(point: Point, candidates: Point[], thresh2: number): boolean {
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const dx = point.x - c.x;
    const dy = point.y - c.y;
    if (dx * dx + dy * dy <= thresh2) {
      return true;
    }
  }
  return false;
}

/**
 * Score tracing by two measures:
 * 1) Coverage — fraction of guide waypoints near the user's ink
 * 2) Precision — fraction of the user's ink near the guide
 *
 * Final percent = round(100 * coverage * precision) so off-track scribbling
 * near the letter no longer passes easily.
 */
export function scoreTraceCoverage(
  guidePoints: Point[],
  strokes: Stroke[],
  threshold: number,
): TraceScoreResult {
  const ink: Point[] = strokes.flat();
  const total = guidePoints.length;
  const emptyFlags = guidePoints.map(() => false);

  if (!total) {
    return {
      percent: 0,
      coveragePercent: 0,
      precisionPercent: 0,
      covered: 0,
      total: 0,
      coveredFlags: [],
    };
  }
  if (!ink.length) {
    return {
      percent: 0,
      coveragePercent: 0,
      precisionPercent: 0,
      covered: 0,
      total,
      coveredFlags: emptyFlags,
    };
  }

  const thresh2 = threshold * threshold;

  let covered = 0;
  const coveredFlags = guidePoints.map(g => {
    const ok = hitsAny(g, ink, thresh2);
    if (ok) {
      covered++;
    }
    return ok;
  });

  // Subsample dense ink so a frantic scribble can't inflate precision.
  const step = Math.max(1, Math.floor(ink.length / 80));
  let onTrack = 0;
  let sampled = 0;
  for (let i = 0; i < ink.length; i += step) {
    sampled++;
    if (hitsAny(ink[i], guidePoints, thresh2)) {
      onTrack++;
    }
  }

  const coverage = covered / total;
  const precision = sampled ? onTrack / sampled : 0;
  // Geometric mean: both coverage and staying on-track must be good.
  const combined = Math.sqrt(coverage * precision);

  return {
    percent: Math.round(combined * 100),
    coveragePercent: Math.round(coverage * 100),
    precisionPercent: Math.round(precision * 100),
    covered,
    total,
    coveredFlags,
  };
}

/** Strict pass — must follow the dashed track closely. */
export function isTracePass(percent: number, minPercent = 82): boolean {
  return percent >= minPercent;
}

/** Tight hit radius relative to letter size (≈ stroke width). */
export function hitThresholdForLetter(letterSize: number): number {
  return Math.max(5, Math.min(9, letterSize * 0.09));
}
