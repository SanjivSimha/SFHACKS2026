import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  ShieldAlert,
  DollarSign,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { cn, formatCurrency } from '../lib/utils';
import { useStore } from '../store/useStore';
import api from '../api/client';

// ----- Risk distribution mock data -----
const riskDistribution = [
  { bucket: '0-25', count: 520, fill: '#22C55E' },
  { bucket: '26-50', count: 340, fill: '#EAB308' },
  { bucket: '51-75', count: 180, fill: '#F97316' },
  { bucket: '76-100', count: 95, fill: '#EF4444' },
];

// ----- Applications over time (last 30 days) -----
function generateTimeSeriesData() {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    data.push({
      date: label,
      applications: Math.floor(Math.random() * 30) + 20,
      flagged: Math.floor(Math.random() * 8) + 2,
    });
  }
  return data;
}
const timeSeriesData = generateTimeSeriesData();

// ----- Program breakdown -----
const programBreakdown = [
  { name: 'Solar Rebate', value: 420, fill: '#22C55E' },
  { name: 'EV Credit', value: 285, fill: '#14B8A6' },
  { name: 'Weatherization', value: 210, fill: '#3B82F6' },
  { name: 'Clean Energy Biz', value: 165, fill: '#8B5CF6' },
  { name: 'Heat Pump', value: 135, fill: '#F59E0B' },
];

// ----- Top fraud signals -----
const topFraudSignals = [
  { signal: 'Duplicate SSN across applications', count: 47, severity: 'critical' },
  { signal: 'VPN/proxy IP address detected', count: 38, severity: 'high' },
  { signal: 'Identity verification mismatch', count: 31, severity: 'critical' },
  { signal: 'Synthetic identity pattern', count: 24, severity: 'high' },
  { signal: 'Address does not match records', count: 22, severity: 'medium' },
  { signal: 'Prepaid phone number', count: 18, severity: 'medium' },
  { signal: 'Multiple apps from same household', count: 15, severity: 'low' },
  { signal: 'Requested amount exceeds max', count: 12, severity: 'low' },
];

const severityColors: Record<string, string> = {
  critical: 'text-red-500',
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-green-400',
};

const severityBg: Record<string, string> = {
  critical: 'bg-red-500/10',
  high: 'bg-red-400/10',
  medium: 'bg-yellow-400/10',
  low: 'bg-green-400/10',
};

// ----- Custom Recharts Tooltip -----
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs font-medium text-gray-400">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const fetchAnalytics = useStore((s) => s.fetchAnalytics);
  const analytics = useStore((s) => s.analytics);
  const [apiAnalytics, setApiAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics().catch(() => {});

    // Attempt to fetch more detailed analytics
    api
      .get('/analytics/detailed')
      .then(({ data }) => setApiAnalytics(data))
      .catch(() => {});
  }, [fetchAnalytics]);

  const estimatedSavings = apiAnalytics?.estimatedSavings ?? 2_847_500;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fraud detection metrics and application insights
        </p>
      </div>

      {/* Top row: Risk distribution + Applications over time */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Risk Distribution */}
        <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent-green" />
            <h3 className="font-heading text-base font-semibold text-white">
              Risk Score Distribution
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={riskDistribution} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#243049" vertical={false} />
              <XAxis
                dataKey="bucket"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: '#243049' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34,197,94,0.05)' }} />
              <Bar dataKey="count" name="Applications" radius={[6, 6, 0, 0]}>
                {riskDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Applications over time */}
        <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent-teal" />
            <h3 className="font-heading text-base font-semibold text-white">
              Applications Over Time
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243049" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                axisLine={{ stroke: '#243049' }}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="applications"
                name="Total"
                stroke="#22C55E"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#22C55E' }}
              />
              <Line
                type="monotone"
                dataKey="flagged"
                name="Flagged"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#EF4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second row: Program breakdown + Savings card */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Program Breakdown (pie/donut) */}
        <div className="rounded-xl border border-navy-700 bg-navy-800 p-5 xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-blue-400" />
            <h3 className="font-heading text-base font-semibold text-white">
              Breakdown by Program
            </h3>
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={programBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {programBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-400">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estimated savings card */}
        <div className="flex flex-col rounded-xl border border-navy-700 bg-navy-800 p-5">
          <div className="mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-accent-green" />
            <h3 className="font-heading text-base font-semibold text-white">Fraud Prevention</h3>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center py-6">
            <p className="mb-2 text-sm text-gray-500">Estimated fraud prevented</p>
            <p className="font-heading text-4xl font-bold text-accent-green">
              {formatCurrency(estimatedSavings)}
            </p>
            <p className="mt-1 text-xs text-gray-600">based on flagged and denied applications</p>
          </div>
          <div className="mt-auto space-y-3 border-t border-navy-700 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total screened</span>
              <span className="font-medium text-white">
                {analytics?.totalApplications?.toLocaleString() ?? '1,284'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Detection rate</span>
              <span className="font-medium text-accent-green">
                {analytics?.fraudDetectionRate ?? 94.2}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Avg risk score</span>
              <span className="font-medium text-yellow-400">
                {analytics?.averageRiskScore ?? 34.7}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top fraud signals table */}
      <div className="rounded-xl border border-navy-700 bg-navy-800">
        <div className="flex items-center gap-2 border-b border-navy-700 px-5 py-4">
          <ShieldAlert className="h-5 w-5 text-red-400" />
          <h3 className="font-heading text-base font-semibold text-white">Top Fraud Signals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-700">
                <th className="px-5 py-3 font-medium text-gray-400">Signal</th>
                <th className="px-5 py-3 font-medium text-gray-400">Occurrences</th>
                <th className="px-5 py-3 font-medium text-gray-400">Severity</th>
              </tr>
            </thead>
            <tbody>
              {topFraudSignals.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-navy-700/50 transition-colors hover:bg-navy-700/30"
                >
                  <td className="px-5 py-3 text-gray-300">{row.signal}</td>
                  <td className="px-5 py-3">
                    <span className="font-heading font-semibold text-white">{row.count}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
                        severityBg[row.severity],
                        severityColors[row.severity],
                        `border-${row.severity === 'critical' ? 'red-500' : row.severity === 'high' ? 'red-400' : row.severity === 'medium' ? 'yellow-400' : 'green-400'}/20`
                      )}
                    >
                      {row.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
