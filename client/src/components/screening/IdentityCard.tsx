import {
  Shield,
  Check,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface IdentityCardProps {
  data: any;
}

const VERIFICATION_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'address', label: 'Address' },
  { key: 'ssn', label: 'SSN' },
  { key: 'dob', label: 'Date of Birth' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
];

export default function IdentityCard({ data }: IdentityCardProps) {
  if (!data) {
    return (
      <CardShell>
        <EmptyState />
      </CardShell>
    );
  }

  const raw = data.rawResponse ?? data.result ?? data;
  const cvi = raw?.cviScore ?? raw?.cvi ?? raw?.score ?? null;
  const verifiedElements = raw?.verifiedElements ?? raw?.verifiedElementSummary ?? raw?.verified ?? {};
  const riskIndicators = raw?.riskIndicators ?? raw?.indicators ?? [];

  function getCVIColor(score: number): string {
    if (score >= 40) return 'text-green-400';
    if (score >= 30) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getCVIBg(score: number): string {
    if (score >= 40) return 'bg-green-400/10 border-green-400/20';
    if (score >= 30) return 'bg-yellow-400/10 border-yellow-400/20';
    return 'bg-red-400/10 border-red-400/20';
  }

  return (
    <CardShell>
      {/* CVI Score */}
      {cvi != null ? (
        <div className="mb-5 flex items-center gap-4">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-xl border',
              getCVIBg(cvi)
            )}
          >
            <span className={cn('font-heading text-2xl font-bold', getCVIColor(cvi))}>
              {cvi}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-300">CVI Score</p>
            <p className="text-xs text-gray-500">
              {cvi >= 40
                ? 'Strong identity match'
                : cvi >= 30
                  ? 'Partial match - review recommended'
                  : 'Weak match - high risk'}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-navy-600 bg-navy-700/50 px-4 py-3">
          <Loader2 className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">CVI score not available</span>
        </div>
      )}

      {/* Verified elements checklist */}
      <div className="mb-5">
        <h4 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Verified Elements
        </h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {VERIFICATION_FIELDS.map((field) => {
            const verified = verifiedElements[field.key];
            const isVerified = verified === true || verified === 'verified' || verified === 'Y';
            const isUnverified = verified === false || verified === 'unverified' || verified === 'N';
            const isUnknown = verified == null || verified === undefined;

            return (
              <div
                key={field.key}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2',
                  isVerified
                    ? 'border-green-500/20 bg-green-500/5'
                    : isUnverified
                      ? 'border-red-500/20 bg-red-500/5'
                      : 'border-navy-600 bg-navy-700/50'
                )}
              >
                {isVerified && <Check className="h-4 w-4 flex-shrink-0 text-green-400" />}
                {isUnverified && <X className="h-4 w-4 flex-shrink-0 text-red-400" />}
                {isUnknown && <div className="h-4 w-4 flex-shrink-0 rounded-full border border-gray-600" />}
                <span
                  className={cn(
                    'text-sm',
                    isVerified ? 'text-green-400' : isUnverified ? 'text-red-400' : 'text-gray-500'
                  )}
                >
                  {field.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk indicators */}
      {riskIndicators.length > 0 && (
        <div>
          <h4 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Risk Indicators
          </h4>
          <div className="space-y-2">
            {riskIndicators.map((indicator: any, i: number) => {
              const text = typeof indicator === 'string' ? indicator : indicator.description ?? indicator.message ?? indicator.code;
              const severity = typeof indicator === 'object' ? indicator.severity : null;

              return (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2.5"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-yellow-300">{text}</p>
                    {severity && (
                      <span className="mt-1 inline-block text-xs text-yellow-500">{severity}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </CardShell>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-white">Identity Verification</h3>
            <p className="text-xs text-gray-500">LexisNexis FlexID</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <Shield className="mb-2 h-8 w-8 text-gray-600" />
      <p className="text-sm text-gray-500">Identity verification data not available</p>
    </div>
  );
}
