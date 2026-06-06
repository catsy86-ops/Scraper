import { useMemo } from 'react';

interface Quartiles {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

interface Props {
  prices: number[];
  quartiles: Quartiles;
  suggested?: number;
  conditionLabel?: string | null;
}

const W = 320;
const H = 140;
const PAD_X = 8;
const HIST_H = 90;
const BOX_Y = 108;
const BOX_H = 18;

function buildBins(values: number[], binCount: number) {
  if (!values.length) return [];
  const min = values[0];
  const max = values[values.length - 1];
  const range = Math.max(1, max - min);
  const step = range / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    from: min + i * step,
    to: min + (i + 1) * step,
    count: 0,
  }));
  for (const v of values) {
    let idx = Math.floor((v - min) / step);
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    bins[idx].count += 1;
  }
  return bins;
}

const PriceDistributionChart = ({ prices, quartiles, suggested, conditionLabel }: Props) => {
  const sorted = useMemo(() => [...prices].sort((a, b) => a - b), [prices]);
  const binCount = Math.min(12, Math.max(5, Math.round(Math.sqrt(sorted.length))));
  const bins = useMemo(() => buildBins(sorted, binCount), [sorted, binCount]);

  if (sorted.length < 2 || quartiles.max === quartiles.min) {
    return (
      <div className="rounded-md border border-border/50 bg-background/40 p-3 text-[11px] text-muted-foreground">
        Za mało danych, by narysować rozkład cen{conditionLabel ? ` dla stanu „${conditionLabel}"` : ''}.
      </div>
    );
  }

  const min = quartiles.min;
  const max = quartiles.max;
  const span = Math.max(1, max - min);
  const xFor = (v: number) => PAD_X + ((v - min) / span) * (W - PAD_X * 2);
  const maxCount = Math.max(...bins.map((b) => b.count), 1);

  const boxLeft = xFor(quartiles.q1);
  const boxRight = xFor(quartiles.q3);
  const medianX = xFor(quartiles.median);
  const minX = xFor(quartiles.min);
  const maxX = xFor(quartiles.max);
  const suggestedX = suggested != null && suggested >= min && suggested <= max ? xFor(suggested) : null;

  return (
    <div className="rounded-md border border-border/50 bg-background/40 p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Rozkład cen{conditionLabel ? ` · ${conditionLabel}` : ''}
        </p>
        <p className="text-[10px] text-muted-foreground">{sorted.length} ofert</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Histogram i wykres pudełkowy cen">
        {/* Histogram */}
        {bins.map((b, i) => {
          const x = xFor(b.from);
          const next = i === bins.length - 1 ? xFor(b.to) : xFor(bins[i + 1].from);
          const w = Math.max(1, next - x - 1);
          const h = (b.count / maxCount) * HIST_H;
          return (
            <g key={i}>
              <rect
                x={x}
                y={HIST_H - h + 4}
                width={w}
                height={h}
                rx={2}
                className="fill-primary/60"
              />
            </g>
          );
        })}

        {/* Suggested price marker */}
        {suggestedX != null && (
          <g>
            <line
              x1={suggestedX}
              x2={suggestedX}
              y1={0}
              y2={HIST_H + 4}
              className="stroke-foreground"
              strokeWidth={1.5}
              strokeDasharray="3 2"
            />
            <text
              x={suggestedX}
              y={10}
              textAnchor="middle"
              className="fill-foreground"
              style={{ fontSize: 9, fontWeight: 600 }}
            >
              {suggested} zł
            </text>
          </g>
        )}

        {/* Boxplot whiskers */}
        <line x1={minX} x2={boxLeft} y1={BOX_Y + BOX_H / 2} y2={BOX_Y + BOX_H / 2} className="stroke-muted-foreground" strokeWidth={1} />
        <line x1={boxRight} x2={maxX} y1={BOX_Y + BOX_H / 2} y2={BOX_Y + BOX_H / 2} className="stroke-muted-foreground" strokeWidth={1} />
        <line x1={minX} x2={minX} y1={BOX_Y + 3} y2={BOX_Y + BOX_H - 3} className="stroke-muted-foreground" strokeWidth={1} />
        <line x1={maxX} x2={maxX} y1={BOX_Y + 3} y2={BOX_Y + BOX_H - 3} className="stroke-muted-foreground" strokeWidth={1} />

        {/* Box (Q1–Q3) */}
        <rect
          x={boxLeft}
          y={BOX_Y}
          width={Math.max(2, boxRight - boxLeft)}
          height={BOX_H}
          rx={3}
          className="fill-primary/25 stroke-primary"
          strokeWidth={1}
        />
        {/* Median */}
        <line
          x1={medianX}
          x2={medianX}
          y1={BOX_Y - 1}
          y2={BOX_Y + BOX_H + 1}
          className="stroke-primary"
          strokeWidth={2}
        />

        {/* Axis labels */}
        <text x={PAD_X} y={H - 2} className="fill-muted-foreground" style={{ fontSize: 9 }}>
          {min} zł
        </text>
        <text x={W - PAD_X} y={H - 2} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 9 }}>
          {max} zł
        </text>
        <text x={medianX} y={H - 2} textAnchor="middle" className="fill-foreground" style={{ fontSize: 9, fontWeight: 600 }}>
          med {quartiles.median}
        </text>
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10px] text-muted-foreground">
        <span><span className="inline-block w-2 h-2 rounded-sm bg-primary/60 mr-1 align-middle" />Histogram</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-primary/25 border border-primary mr-1 align-middle" />Q1–Q3 (50% ofert)</span>
        <span>Q1 {quartiles.q1} · Q3 {quartiles.q3} zł</span>
      </div>
    </div>
  );
};

export default PriceDistributionChart;