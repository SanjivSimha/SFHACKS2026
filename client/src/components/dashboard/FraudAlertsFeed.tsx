import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, XCircle, AlertOctagon, ArrowRight } from 'lucide-react';
import { cn, formatDateTime } from '../../lib/utils';

type Severity = 'warning' | 'danger' | 'critical';

interface FraudAlert {
  id: string;
  severity: Severity;
  description: string;
  applicationId?: string;
  timestamp: string;
}

interface FraudAlertsFeedProps {
  alerts?: FraudAlert[];
}

const severityConfig: Record<Severity, { icon: React.ElementType; color: string; bgColor: string }> = {
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
  },
  danger: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
  critical: {
    icon: AlertOctagon,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
};

const mockAlerts: FraudAlert[] = [
  {
    id: 'alert-1',
    severity: 'critical',
    description: 'Duplicate SSN detected across 3 applications',
    applicationId: '5',
    timestamp: '2026-02-14T09:15:00Z',
  },
  {
    id: 'alert-2',
    severity: 'danger',
    description: 'VPN/proxy IP address flagged during submission',
    applicationId: '4',
    timestamp: '2026-02-14T08:42:00Z',
  },
  {
    id: 'alert-3',
    severity: 'critical',
    description: 'Identity verification failed - name mismatch',
    applicationId: '5',
    timestamp: '2026-02-13T22:10:00Z',
  },
  {
    id: 'alert-4',
    severity: 'warning',
    description: 'Prepaid phone number detected on application',
    applicationId: '7',
    timestamp: '2026-02-13T17:30:00Z',
  },
  {
    id: 'alert-5',
    severity: 'danger',
    description: 'Address does not match property records',
    applicationId: '10',
    timestamp: '2026-02-13T14:20:00Z',
  },
  {
    id: 'alert-6',
    severity: 'warning',
    description: 'Multiple applications from same household',
    applicationId: '9',
    timestamp: '2026-02-13T11:05:00Z',
  },
  {
    id: 'alert-7',
    severity: 'danger',
    description: 'Synthetic identity pattern detected',
    applicationId: '4',
    timestamp: '2026-02-12T19:45:00Z',
  },
  {
    id: 'alert-8',
    severity: 'warning',
    description: 'Requested amount exceeds program maximum by 40%',
    applicationId: '3',
    timestamp: '2026-02-12T16:00:00Z',
  },
];

export default function FraudAlertsFeed({ alerts }: FraudAlertsFeedProps) {
  const data = alerts && alerts.length > 0 ? alerts.slice(0, 8) : mockAlerts;

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-navy-700 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-5 w-5 text-accent-green" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
            </span>
          </div>
          <h3 className="font-heading text-lg font-semibold text-white">Fraud Alerts</h3>
        </div>
        <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
          {data.length} active
        </span>
      </div>

      {/* Alert list */}
      <div className="divide-y divide-navy-700/50">
        {data.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-navy-700/30"
            >
              <div className={cn('mt-0.5 flex-shrink-0 rounded-lg p-1.5', config.bgColor)}>
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-300">{alert.description}</p>
                <p className="mt-0.5 text-xs text-gray-600">{formatDateTime(alert.timestamp)}</p>
              </div>
              {alert.applicationId && (
                <Link
                  to={`/applications/${alert.applicationId}`}
                  className="flex-shrink-0 rounded-md p-1 text-gray-600 transition-colors hover:text-gray-400"
                  aria-label="View application"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-navy-700 px-5 py-3">
        <Link
          to="/alerts"
          className="flex items-center justify-center gap-1 text-xs font-medium text-accent-green transition-colors hover:text-accent-teal"
        >
          View all alerts
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
