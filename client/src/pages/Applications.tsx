import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, Search, Eye, Archive } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatDate, formatCurrency, PROGRAM_LABELS } from '../lib/utils';
import { STATUS_LABELS, STATUS_COLORS } from '../lib/constants';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'SCREENING', label: 'Screening' },
  { key: 'REVIEWED', label: 'Reviewed' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'DENIED', label: 'Denied' },
  { key: 'ARCHIVED', label: 'Archived' },
];
import ScoreRing from '../components/shared/ScoreRing';

export default function Applications() {
  const navigate = useNavigate();
  const { applications, fetchApplications, updateApplication, loading } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (statusFilter) filters.status = statusFilter;
    if (programFilter) filters.programType = programFilter;
    if (search) filters.search = search;
    fetchApplications(filters);
  }, [statusFilter, programFilter, search, fetchApplications]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Applications</h1>
          <p className="text-gray-400 mt-1">Manage and review grant applications</p>
        </div>
        <Link
          to="/applications/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-green to-accent-teal text-white rounded-lg font-semibold hover:opacity-90 transition"
        >
          <PlusCircle className="w-4 h-4" />
          New Application
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-navy-700 bg-navy-800 p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              statusFilter === tab.key
                ? 'bg-accent-green/20 text-accent-green'
                : 'text-gray-400 hover:bg-navy-700 hover:text-gray-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Program Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20"
          />
        </div>
        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="px-3 py-2 bg-navy-700 border border-navy-600 rounded-lg text-gray-200 focus:outline-none focus:border-accent-green/50"
        >
          <option value="">All Programs</option>
          <option value="SOLAR_REBATE">Solar Rebate</option>
          <option value="EV_CREDIT">EV Credit</option>
          <option value="WEATHERIZATION">Weatherization</option>
          <option value="CLEAN_ENERGY_BUSINESS">Clean Energy Business</option>
          <option value="HEAT_PUMP">Heat Pump</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Applicant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Program</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-navy-700/50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-navy-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    No applications found
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    className="border-b border-navy-700/50 hover:bg-navy-700/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-200">
                        {app.applicantFirstName} {app.applicantLastName}
                      </div>
                      <div className="text-xs text-gray-500">{app.applicantEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {PROGRAM_LABELS[app.programType] || app.programType}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {app.requestedAmount ? formatCurrency(app.requestedAmount) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {app.fraudDecision ? (
                        <div className="flex justify-center">
                          <ScoreRing score={app.fraudDecision.overallScore} size={36} />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border',
                          STATUS_COLORS[app.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        )}
                      >
                        {STATUS_LABELS[app.status] || app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/applications/${app.id}`);
                          }}
                          className="p-1.5 rounded-lg hover:bg-navy-600 text-gray-400 hover:text-gray-200 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {app.status !== 'ARCHIVED' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await updateApplication(app.id, { status: 'ARCHIVED' });
                              fetchApplications(
                                Object.fromEntries(
                                  Object.entries({ status: statusFilter, programType: programFilter, search }).filter(([, v]) => v)
                                )
                              );
                            }}
                            className="p-1.5 rounded-lg hover:bg-navy-600 text-gray-400 hover:text-yellow-400 transition-colors"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
