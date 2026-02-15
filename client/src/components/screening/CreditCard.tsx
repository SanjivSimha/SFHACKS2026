import {
  CreditCard as CreditCardIcon,
  TrendingUp,
  FileText,
  Search,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface CreditCardProps {
  data: any;
}

export default function CreditCard({ data }: CreditCardProps) {
  if (!data) {
    return (
      <CardShell>
        <EmptyState />
      </CardShell>
    );
  }

  const raw = data.rawResponse ?? data.result ?? data;
  const creditScore = raw?.creditScore ?? raw?.score ?? null;
  const model = raw?.model ?? raw?.scoreModel ?? raw?.scoreName ?? null;
  const totalAccounts = raw?.totalAccounts ?? raw?.accounts ?? raw?.summary?.totalAccounts ?? null;
  const totalBalance = raw?.totalBalance ?? raw?.balance ?? raw?.summary?.totalBalance ?? null;
  const delinquentCount = raw?.delinquentCount ?? raw?.delinquent ?? raw?.summary?.delinquent ?? null;
  const publicRecords = raw?.publicRecords ?? raw?.publicRecordCount ?? raw?.summary?.publicRecords ?? null;
  const inquiries = raw?.inquiries ?? raw?.inquiryCount ?? raw?.summary?.inquiries ?? null;
  const notAvailable = raw?.notAvailable === true || raw?.available === false;

  if (notAvailable) {
    return (
      <CardShell>
        <div className="flex flex-col items-center py-6 text-center">
          <AlertCircle className="mb-2 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-400">Credit report not available</p>
          <p className="mt-1 text-xs text-gray-600">Only required for high-value applications</p>
        </div>
      </CardShell>
    );
  }

  function getScoreColor(score: number): string {
    if (score >= 740) return 'text-green-400';
    if (score >= 670) return 'text-yellow-400';
    if (score >= 580) return 'text-orange-400';
    return 'text-red-400';
  }

  function getScoreBg(score: number): string {
    if (score >= 740) return 'bg-green-400/10 border-green-400/20';
    if (score >= 670) return 'bg-yellow-400/10 border-yellow-400/20';
    if (score >= 580) return 'bg-orange-400/10 border-orange-400/20';
    return 'bg-red-400/10 border-red-400/20';
  }

  function getScoreLabel(score: number): string {
    if (score >= 800) return 'Exceptional';
    if (score >= 740) return 'Very Good';
    if (score >= 670) return 'Good';
    if (score >= 580) return 'Fair';
    return 'Poor';
  }

  return (
    <CardShell>
      {/* Credit score */}
      {creditScore != null && (
        <div className="mb-5 flex items-center gap-4">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-xl border',
              getScoreBg(creditScore)
            )}
          >
            <span className={cn('font-heading text-2xl font-bold', getScoreColor(creditScore))}>
              {creditScore}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-300">
              Credit Score
              <span className={cn('ml-2', getScoreColor(creditScore))}>
                {getScoreLabel(creditScore)}
              </span>
            </p>
            {model && <p className="text-xs text-gray-500">Model: {model}</p>}
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat
          icon={FileText}
          label="Total Accounts"
          value={totalAccounts}
          iconColor="text-blue-400"
        />
        <SummaryStat
          icon={TrendingUp}
          label="Total Balance"
          value={totalBalance != null ? `$${Number(totalBalance).toLocaleString()}` : null}
          iconColor="text-accent-teal"
        />
        <SummaryStat
          icon={AlertCircle}
          label="Delinquent"
          value={delinquentCount}
          iconColor={delinquentCount && Number(delinquentCount) > 0 ? 'text-red-400' : 'text-gray-400'}
          highlight={delinquentCount != null && Number(delinquentCount) > 0}
        />
        <SummaryStat
          icon={Search}
          label="Inquiries"
          value={inquiries}
          iconColor="text-gray-400"
        />
      </div>

      {/* Public records */}
      {publicRecords != null && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-navy-600 bg-navy-700/30 px-4 py-3">
          <span className="text-sm text-gray-400">Public Records</span>
          <span
            className={cn(
              'font-heading text-sm font-bold',
              Number(publicRecords) > 0 ? 'text-red-400' : 'text-green-400'
            )}
          >
            {publicRecords}
          </span>
        </div>
      )}

      {/* Note for unavailable data */}
      {creditScore == null && totalAccounts == null && (
        <div className="flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-700/30 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">
            Detailed credit data not available. Only required for high-value applications.
          </span>
        </div>
      )}
    </CardShell>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="rounded-lg bg-accent-teal/10 p-2">
          <CreditCardIcon className="h-5 w-5 text-accent-teal" />
        </div>
        <div>
          <h3 className="font-heading text-sm font-semibold text-white">Credit Report</h3>
          <p className="text-xs text-gray-500">Credit Bureau</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <CreditCardIcon className="mb-2 h-8 w-8 text-gray-600" />
      <p className="text-sm text-gray-500">Credit report data not available</p>
      <p className="mt-1 text-xs text-gray-600">Only for high-value applications</p>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  iconColor,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number | null | undefined;
  iconColor: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-3 text-center',
        highlight
          ? 'border-red-500/20 bg-red-500/5'
          : 'border-navy-600 bg-navy-700/30'
      )}
    >
      <Icon className={cn('mx-auto mb-1.5 h-4 w-4', iconColor)} />
      <p className={cn('font-heading text-lg font-bold', highlight ? 'text-red-400' : 'text-white')}>
        {value ?? '--'}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
