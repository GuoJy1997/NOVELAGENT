interface ArcPoint {
  label: string;
  v: number;
}

interface CharacterArcChartProps {
  points: ArcPoint[];
}

export function CharacterArcChart({ points }: CharacterArcChartProps) {
  const step = points.length > 1 ? 260 / (points.length - 1) : 0;
  const coordinates = points.map((point, index) => `${20 + index * step},${110 - point.v}`).join(' ');
  return (
    <svg role="img" aria-label="人物弧光" viewBox="0 0 300 120" className="character-arc-chart">
      <polyline fill="none" stroke="var(--bixin-green-600)" strokeWidth="2" points={coordinates} />
      {points.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle cx={20 + index * step} cy={110 - point.v} r="3" fill="var(--bixin-green-600)" />
          <text x={20 + index * step} y="119" textAnchor="middle">{point.label}</text>
        </g>
      ))}
    </svg>
  );
}
