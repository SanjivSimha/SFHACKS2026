import { useEffect, useState } from 'react';
import { getScoreColor } from '../../lib/utils';

interface ScoreRingProps {
  score: number;
  size?: number;
  label?: string;
}

export default function ScoreRing({ score, size = 80, label }: ScoreRingProps) {
  const [animatedOffset, setAnimatedOffset] = useState(283);

  const strokeWidth = size >= 80 ? 6 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  const center = size / 2;
  const fontSize = size >= 80 ? 'text-xl' : 'text-sm';

  useEffect(() => {
    // Trigger animation after mount
    const timer = requestAnimationFrame(() => {
      setAnimatedOffset(targetOffset);
    });
    return () => cancelAnimationFrame(timer);
  }, [targetOffset]);

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1A2235"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-heading font-bold ${fontSize}`} style={{ color }}>
            {score}
          </span>
        </div>
      </div>

      {label && (
        <span className="text-xs text-gray-500">{label}</span>
      )}
    </div>
  );
}
