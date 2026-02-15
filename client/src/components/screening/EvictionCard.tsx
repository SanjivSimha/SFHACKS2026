import {
  Home,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn, formatDate, formatCurrency } from '../../lib/utils';

interface EvictionCardProps {
  data: any;
}

export default function EvictionCard({ data }: EvictionCardProps) {
  if (!data) {
    return (
      <CardShell>
        <EmptyState />
      </CardShell>
    );
  }

  const raw = data.rawResponse ?? data.result ?? data;
  const records = raw?.records ?? raw?.evictions ?? raw?.results ?? [];
  const recordCount = records.length;

  return (
    <CardShell>
      {/* Record count badge */}
      <div className="mb-4 flex items-center gap-3">
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold',
            recordCount > 0
              ? 'border-red-500/20 bg-red-500/10 text-red-400'
              : 'border-green-500/20 bg-green-500/10 text-green-400'
          )}
        >
          {recordCount} {recordCount === 1 ? 'Record' : 'Records'} Found
        </span>
      </div>

      {recordCount === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-4">
          <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-400" />
          <div>
            <p className="text-sm font-medium text-green-400">No Records Found</p>
            <p className="text-xs text-gray-500">No eviction records were found for this applicant.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-600">
                <th className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Court
                </th>
                <th className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Filing Date
                </th>
                <th className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Case Number
                </th>
                <th className="pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Judgment Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record: any, i: number) => (
                <tr
                  key={i}
                  className="border-b border-navy-700/50 last:border-0"
                >
                  <td className="py-2.5 pr-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                      <span className="text-gray-200">
                        {record.court ?? record.courtName ?? 'Unknown court'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-400">
                    {record.filingDate ?? record.filing_date ?? record.date
                      ? formatDate(record.filingDate ?? record.filing_date ?? record.date)
                      : '--'}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-gray-400">
                    {record.caseNumber ?? record.case_number ?? record.caseId ?? '--'}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={cn(
                        'font-heading font-semibold',
                        record.judgmentAmount || record.judgment_amount
                          ? 'text-red-400'
                          : 'text-gray-500'
                      )}
                    >
                      {record.judgmentAmount ?? record.judgment_amount
                        ? formatCurrency(Number(record.judgmentAmount ?? record.judgment_amount))
                        : '--'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardShell>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="rounded-lg bg-yellow-500/10 p-2">
          <Home className="h-5 w-5 text-yellow-400" />
        </div>
        <div>
          <h3 className="font-heading text-sm font-semibold text-white">Eviction Records</h3>
          <p className="text-xs text-gray-500">National Eviction Database</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <Home className="mb-2 h-8 w-8 text-gray-600" />
      <p className="text-sm text-gray-500">Eviction records data not available</p>
    </div>
  );
}
