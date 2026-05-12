/** Demo-only aggregates for CURSOR-27; not connected to CI or tooling. */

export type CodeHealthTimeframe = '7d' | '30d' | '90d';

export interface CodeHealthSeverityBreakdownRow {
  id: string;
  label: string;
  count: number;
}

export interface CodeHealthSummaryCard {
  id: string;
  /** Short label rendered as card title */
  label: string;
  /** Numeric or percentage main value */
  value: number;
  valueSuffix?: string;
  helper: string;
  /** Fractional trend for spark-style bars */
  spark: number[];
  /** "up" improves health (coverage), "down" improves health (lint) */
  direction: 'higherBetter' | 'lowerBetter';
}

export interface CodeHealthTrendPoint {
  week: string;
  lintIssues: number;
  coveragePct: number;
}

export interface RecommendedActionRow {
  id: string;
  rank: number;
  title: string;
  rationale: string;
  suggestedTicket: string;
}

export interface CodeHealthViewModel {
  cards: CodeHealthSummaryCard[];
  severityRows: CodeHealthSeverityBreakdownRow[];
  lintTrend: CodeHealthTrendPoint[];
  recommendations: RecommendedActionRow[];
}

const WEEK_LABELS_BY_TF: Record<CodeHealthTimeframe, string[]> = {
  '7d': ['Wk -4', 'Wk -3', 'Wk -2', 'Past week'],
  '30d': ['Wk -8', 'Wk -6', 'Wk -4', 'Wk -2', 'Past 30 days'],
  '90d': ['Q start', '+3 wks', '+6 wks', '+9 wks', 'Quarter end'],
};

function multiplier(tf: CodeHealthTimeframe): number {
  switch (tf) {
    case '7d':
      return 1;
    case '30d':
      return 1.15;
    case '90d':
      return 1.35;
    default:
      return 1;
  }
}

export function buildCodeHealthViewModel(timeframe: CodeHealthTimeframe): CodeHealthViewModel {
  const m = multiplier(timeframe);
  const weeks = WEEK_LABELS_BY_TF[timeframe];

  const lintSeries = weeks.map((_, i) => Math.round((42 + i * 3) * m - i));
  const coverageSeries = weeks.map((_, i) =>
    Math.min(94, Math.round(72 + i * 2.5 + (timeframe === '90d' ? 8 : 0)))
  );

  const cards: CodeHealthSummaryCard[] = [
    {
      id: 'lint',
      label: 'Lint issues',
      value: Math.round(38 * m),
      helper: 'OSS ESLint equivalents (demo)',
      spark: lintSeries.map((v) => 1 - v / 80),
      direction: 'lowerBetter',
    },
    {
      id: 'typescript',
      label: 'TypeScript errors',
      value: Math.round(12 * m),
      helper: 'Monorepo `yarn typecheck` concept',
      spark: [0.2, 0.35, 0.42, 0.38, 0.33],
      direction: 'lowerBetter',
    },
    {
      id: 'flaky',
      label: 'Flaky tests',
      value: Math.round(5 + (timeframe === '90d' ? 2 : 0)),
      helper: 'Last N main-branch runs',
      spark: [0.5, 0.62, 0.55, 0.58, 0.48],
      direction: 'lowerBetter',
    },
    {
      id: 'coverage',
      label: 'Est. coverage',
      value: Math.round(73 + (timeframe === '90d' ? 6 : 2)),
      valueSuffix: '%',
      helper: 'Aggregate line coverage (mock)',
      spark: coverageSeries.map((v) => v / 100),
      direction: 'higherBetter',
    },
    {
      id: 'deps',
      label: 'Outdated deps',
      value: Math.round(28 * (timeframe === '90d' ? 1.1 : 1)),
      helper: 'Direct prod + dev (demo)',
      spark: [0.7, 0.68, 0.71, 0.66],
      direction: 'lowerBetter',
    },
    {
      id: 'ci',
      label: 'CI pass rate',
      value: Math.min(
        99,
        Math.round(88 + (timeframe === '7d' ? 4 : timeframe === '30d' ? 8 : 11))
      ),
      valueSuffix: '%',
      helper: 'Required checks over window',
      spark: [0.82, 0.85, 0.87, 0.9, 0.91],
      direction: 'higherBetter',
    },
  ];

  const severityRows: CodeHealthSeverityBreakdownRow[] = [
    { id: 'critical', label: 'Critical', count: Math.round(2 * m) },
    { id: 'high', label: 'High', count: Math.round(9 * m) },
    { id: 'medium', label: 'Medium', count: Math.round(24 * m) },
    { id: 'low', label: 'Low / style', count: Math.round(18 * m) },
  ];

  const lintTrend: CodeHealthTrendPoint[] = weeks.map((week, i) => ({
    week,
    lintIssues: lintSeries[i] ?? lintSeries[lintSeries.length - 1],
    coveragePct: coverageSeries[i] ?? coverageSeries[coverageSeries.length - 1],
  }));

  const recommendations: RecommendedActionRow[] = [
    {
      id: 'a11y-batch',
      rank: 1,
      title: 'Clear legacy `jsx-a11y` violations in alerting views',
      rationale: `${cards[0].value} lint findings cluster in unified alerting; fixing the top bucket drops noise for agents.`,
      suggestedTicket: `QUALITY-${timeframe}-101`,
    },
    {
      id: 'tier2-types',
      rank: 2,
      title: 'Triage remaining TS errors in `public/app/features/plugins` workspace',
      rationale: `${cards[1].value} TS errors block strict mode adoption; aligns with flaky-test hotspots.`,
      suggestedTicket: `QUALITY-${timeframe}-204`,
    },
    {
      id: 'quarantine-tests',
      rank: 3,
      title: 'Quarantine and rewrite top flaky Playwright journeys',
      rationale: `${cards[2].value} flaky tests correlate with Explore + dashboards smoke paths.`,
      suggestedTicket: `QUALITY-${timeframe}-318`,
    },
    {
      id: 'coverage-gap',
      rank: 4,
      title: 'Backfill integration coverage for provisioning API adapters',
      rationale: `Coverage at ${cards[3].value}${cards[3].valueSuffix} trails target; prioritized files listed in demo export.`,
      suggestedTicket: `QUALITY-${timeframe}-442`,
    },
    {
      id: 'dep-bump',
      rank: 5,
      title: 'Schedule Yarn major bumps for lodash + uPlot minors',
      rationale: `${cards[4].value} outdated deps; batch upgrade reduces renovate churn.`,
      suggestedTicket: `QUALITY-${timeframe}-519`,
    },
  ];

  return { cards, severityRows, lintTrend, recommendations };
}

const FETCH_DELAY_MS = 280;

export async function fetchCodeHealthSummary(timeframe: CodeHealthTimeframe): Promise<CodeHealthViewModel> {
  if (failNextFetch) {
    failNextFetch = false;
    throw new Error('Simulated code health load failure');
  }
  await new Promise<void>((resolve) => setTimeout(resolve, FETCH_DELAY_MS));
  return buildCodeHealthViewModel(timeframe);
}

/** Test hook: next call to `fetchCodeHealthSummary` rejects once. */
let failNextFetch = false;

export function __test_simulateFetchFailureOnce(): void {
  failNextFetch = true;
}

export function __test_resetCodeHealthFetchState(): void {
  failNextFetch = false;
}
