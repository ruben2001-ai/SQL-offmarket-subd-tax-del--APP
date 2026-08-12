export default function CircleStat({
  percent,
  color,
  label,
  sublabel,
  secondary,
  size = 84,
}: {
  percent: number;
  color: string;
  label: string;
  sublabel?: string;
  secondary?: string;
  size?: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
  const dash = (clamped / 100) * circumference;

  return (
    <div className="flex w-20 shrink-0 flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold tabular-nums text-slate-900">
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
      <div className="text-center leading-tight">
        <div className="text-[11px] font-medium text-slate-600">{label}</div>
        {sublabel && <div className="text-[10px] text-slate-400">{sublabel}</div>}
        {secondary && <div className="text-[10px] text-slate-400">{secondary}</div>}
      </div>
    </div>
  );
}
