import { useState, useMemo, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

type SortDir = 'asc' | 'desc' | null;

const PAGE_SIZES = [10, 25, 50];

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data to display',
  loading = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  function handleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') {
        setSortKey(null);
        setSortDir(null);
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  }

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const pagedData = sortedData.slice(page * pageSize, (page + 1) * pageSize);

  // Skeleton rows for loading state
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-navy-700 bg-navy-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy-700">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium text-gray-400">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-navy-700/50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-navy-700" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-navy-700 bg-navy-800 py-16 text-gray-500">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-navy-700 bg-navy-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy-700">
              {columns.map((col) => {
                const sortable = col.sortable !== false;
                const isActive = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 font-medium text-gray-400',
                      sortable && 'cursor-pointer select-none hover:text-gray-200'
                    )}
                    onClick={sortable ? () => handleSort(col.key) : undefined}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {sortable && (
                        <span className="text-gray-600">
                          {isActive && sortDir === 'asc' ? (
                            <ChevronUp className="h-3.5 w-3.5 text-accent-green" />
                          ) : isActive && sortDir === 'desc' ? (
                            <ChevronDown className="h-3.5 w-3.5 text-accent-green" />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pagedData.map((row, i) => (
              <tr
                key={row.id ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-navy-700/50 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-navy-700/50'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-300">
                    {col.render ? col.render(row) : (row[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-navy-700 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="rounded border border-navy-600 bg-navy-700 px-2 py-1 text-xs text-gray-300 focus:border-accent-green/50 focus:outline-none"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>
            {page * pageSize + 1}--{Math.min((page + 1) * pageSize, sortedData.length)} of{' '}
            {sortedData.length}
          </span>
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-navy-600 px-2 py-1 text-gray-400 transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-navy-600 px-2 py-1 text-gray-400 transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
