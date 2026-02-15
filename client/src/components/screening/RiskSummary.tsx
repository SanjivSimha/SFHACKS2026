import {
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Zap,
  Eye,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import ScoreRing from '../shared/ScoreRing';

interface RiskSummaryProps {
  decision: any;
}

export default function RiskSummary({ decision }: RiskSummaryProps) {
  if (!decision) {
    return (
      <CardShell>
        <EmptyState />
      </CardShell>
    );
  }

  const riskScore = decision.riskScore ?? decision.score ?? 0;
  const recommendation = (
    decision.recommendation ?? decision.decision ?? decision.action ?? ''
  ).toUpperCase();
  const factors = decision.factors ?? decision.contributingFactors ?? [];
  const signals = decision.signals ?? decision.fraudSignals ?? [];

  function getRecommendationConfig(rec: string) {
    switch (rec) {
      case 'APPROVE':
      case 'APPROVED':
      case 'PASS':
        return {
          label: 'APPROVE',
          icon: CheckCircle,
          bg: 'bg-green-500/10 border-green-500/30',
          text: 'text-green-400',
          glow: 'shadow-green-500/10',
        };
      case 'REVIEW':
      case 'MANUAL_REVIEW':
      case 'FLAG':
        return {
          label: 'REVIEW',
          icon: Eye,
          bg: 'bg-yellow-500/10 border-yellow-500/30',
          text: 'text-yellow-400',
          glow: 'shadow-yellow-500/10',
        };
      case 'DENY':
      case 'DENIED':
      case 'REJECT':
      case 'FAIL':
        return {
          label: 'DENY',
          icon: XCircle,
          bg: 'bg-red-500/10 border-red-500/30',
          text: 'text-red-400',
          glow: 'shadow-red-500/10',
        };
      default:
        return {
          label: rec || 'PENDING',
          icon: AlertTriangle,
          bg: 'bg-gray-500/10 border-gray-500/30',
          text: 'text-gray-400',
          glow: 'shadow-gray-500/10',
        };
    }
  }

  const recConfig = getRecommendationConfig(recommendation);
  const RecIcon = recConfig.icon;

  function getSeverityColor(severity: string): string {
    const s = (severity ?? '').toLowerCase();
    if (s === 'high' || s === 'critical') return 'text-red-400';
    if (s === 'medium' || s === 'moderate') return 'text-yellow-400';
    if (s === 'low') return 'text-green-400';
    return 'text-gray-400';
  }

  function getSeverityBg(severity: string): string {
    const s = (severity ?? '').toLowerCase();
    if (s === 'high' || s === 'critical') return 'bg-red-500/10 border-red-500/20';
    if (s === 'medium' || s === 'moderate') return 'bg-yellow-500/10 border-yellow-500/20';
    if (s === 'low') return 'bg-green-500/10 border-green-500/20';
    return 'bg-gray-500/10 border-gray-500/20';
  }

  function getImpactWidth(impact: number | string | undefined): string {
    if (impact == null) return '50%';
    const num = typeof impact === 'string' ? parseFloat(impact) : impact;
    if (isNaN(num)) return '50%';
    return `${Math.min(Math.max(num, 0), 100)}%`;
  }

  function getImpactColor(impact: number | string | undefined): string {
    if (impact == null) return 'bg-gray-500';
    const num = typeof impact === 'string' ? parseFloat(impact) : impact;
    if (isNaN(num)) return 'bg-gray-500';
    if (num >= 70) return 'bg-red-400';
    if (num >= 40) return 'bg-yellow-400';
    return 'bg-green-400';
  }

  return (
    <CardShell>
      {/* Score and recommendation row */}
      <div className="mb-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Score ring centered */}
        <div className="flex flex-col items-center">
          <ScoreRing score={riskScore} size={100} label="Risk Score" />
        </div>

        {/* Recommendation badge */}
        <div className="flex flex-1 items-center justify-center sm:justify-start">
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border px-6 py-4 shadow-lg',
              recConfig.bg,
              recConfig.glow
            )}
          >
            <RecIcon className={cn('h-7 w-7', recConfig.text)} />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Recommendation
              </p>
              <p className={cn('font-heading text-2xl font-bold', recConfig.text)}>
                {recConfig.label}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contributing factors */}
      {factors.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Contributing Factors
          </h4>
          <div className="space-y-2.5">
            {factors.map((factor: any, i: number) => {
              const category = factor.category ?? factor.type ?? factor.name ?? 'Factor';
              const description = factor.description ?? factor.message ?? factor.detail ?? '';
              const impact = factor.impact ?? factor.weight ?? factor.score;
              const severity = factor.severity ?? factor.level ?? '';

              return (
                <div
                  key={i}
                  className="rounded-lg border border-navy-600 bg-navy-700/30 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-200">{category}</span>
                    </div>
                    {severity && (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                          getSeverityBg(severity),
                          getSeverityColor(severity)
                        )}
                      >
                        {severity}
                      </span>
                    )}
                  </div>
                  {description && (
                    <p className="mb-2 text-xs text-gray-400">{description}</p>
                  )}
                  {impact != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Impact</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-600">
                        <div
                          className={cn('h-full rounded-full transition-all', getImpactColor(impact))}
                          style={{ width: getImpactWidth(impact) }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fraud signals */}
      {signals.length > 0 && (
        <div>
          <h4 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Fraud Signals
          </h4>
          <div className="space-y-2">
            {signals.map((signal: any, i: number) => {
              const type = signal.type ?? signal.category ?? 'Signal';
              const description = signal.description ?? signal.message ?? signal.detail ?? '';
              const source = signal.source ?? signal.provider ?? '';
              const severity = signal.severity ?? signal.level ?? '';

              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border px-3.5 py-2.5',
                    getSeverityBg(severity)
                  )}
                >
                  <Zap className={cn('mt-0.5 h-4 w-4 flex-shrink-0', getSeverityColor(severity))} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-200">{type}</span>
                      {source && (
                        <span className="text-xs text-gray-600">via {source}</span>
                      )}
                    </div>
                    {description && (
                      <p className="mt-0.5 text-xs text-gray-400">{description}</p>
                    )}
                  </div>
                  {severity && (
                    <span
                      className={cn(
                        'flex-shrink-0 text-xs font-medium capitalize',
                        getSeverityColor(severity)
                      )}
                    >
                      {severity}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty factors and signals */}
      {factors.length === 0 && signals.length === 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            No detailed risk factors or fraud signals were reported.
          </p>
        </div>
      )}
    </CardShell>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="rounded-lg bg-accent-green/10 p-2">
          <ShieldAlert className="h-5 w-5 text-accent-green" />
        </div>
        <div>
          <h3 className="font-heading text-sm font-semibold text-white">Risk Assessment</h3>
          <p className="text-xs text-gray-500">AI-Powered Fraud Detection</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <ShieldAlert className="mb-2 h-8 w-8 text-gray-600" />
      <p className="text-sm text-gray-500">Risk assessment data not available</p>
    </div>
  );
}
