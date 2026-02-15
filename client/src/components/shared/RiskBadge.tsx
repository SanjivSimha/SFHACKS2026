import { cn } from '../../lib/utils';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type BadgeSize = 'sm' | 'md';

interface RiskBadgeProps {
  risk: RiskLevel;
  size?: BadgeSize;
}

const riskStyles: Record<RiskLevel, string> = {
  low: 'bg-green-400/10 text-green-400 border-green-400/20',
  medium: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  high: 'bg-red-400/10 text-red-400 border-red-400/20',
  critical: 'bg-red-600/10 text-red-600 border-red-600/20',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export default function RiskBadge({ risk, size = 'md' }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium capitalize',
        riskStyles[risk],
        sizeStyles[size]
      )}
    >
      {risk}
    </span>
  );
}
