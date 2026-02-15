import {
  FileWarning,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';

interface CriminalCardProps {
  data: any;
}

export default function CriminalCard({ data }: CriminalCardProps) {
  if (!data) {
    return (
      <CardShell>
        <EmptyState />
      </CardShell>
    );
  }

  const raw = data.rawResponse ?? data.result ?? data;
  const records = raw?.records ?? raw?.offenses ?? raw?.results ?? [];
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
            <p className="text-xs text-gray-500">No criminal records were found for this applicant.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-600">
                <th className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Offense
                </th>
                <th className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Statute
                </th>
                <th className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date
                </th>
                <th className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Disposition
                </th>
                <th className="pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Court
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
                        {record.description ?? record.offense ?? record.charge ?? 'Unknown offense'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-gray-400">
                    {record.statute ?? record.code ?? '--'}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-400">
                    {record.date ?? record.offenseDate
                      ? formatDate(record.date ?? record.offenseDate)
                      : '--'}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                        record.disposition?.toLowerCase()?.includes('convicted') ||
                        record.disposition?.toLowerCase()?.includes('guilty')
                          ? 'bg-red-500/10 text-red-400'
                          : record.disposition?.toLowerCase()?.includes('dismissed') ||
                            record.disposition?.toLowerCase()?.includes('acquit')
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-gray-500/10 text-gray-400'
                      )}
                    >
                      {record.disposition ?? '--'}
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-400">
                    {record.court ?? record.jurisdiction ?? '--'}
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
        <div className="rounded-lg bg-orange-500/10 p-2">
          <FileWarning className="h-5 w-5 text-orange-400" />
        </div>
        <div>
          <h3 className="font-heading text-sm font-semibold text-white">Criminal Background</h3>
          <p className="text-xs text-gray-500">National Criminal Database</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <FileWarning className="mb-2 h-8 w-8 text-gray-600" />
      <p className="text-sm text-gray-500">Criminal background data not available</p>
    </div>
  );
}
