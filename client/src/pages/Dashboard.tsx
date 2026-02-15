import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import StatsGrid from '../components/dashboard/StatsGrid';
import RecentApplications from '../components/dashboard/RecentApplications';
import FraudAlertsFeed from '../components/dashboard/FraudAlertsFeed';

export default function Dashboard() {
  const analytics = useStore((s) => s.analytics);
  const applications = useStore((s) => s.applications);
  const fetchAnalytics = useStore((s) => s.fetchAnalytics);
  const fetchApplications = useStore((s) => s.fetchApplications);

  useEffect(() => {
    fetchAnalytics().catch(() => {});
    fetchApplications().catch(() => {});
  }, [fetchAnalytics, fetchApplications]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of grant application fraud prevention
          </p>
        </div>
        <Link
          to="/applications/new"
          className={cn(
            'flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent-green to-accent-teal',
            'px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-lg shadow-accent-green/20',
            'transition-all hover:brightness-110'
          )}
        >
          <PlusCircle className="h-4 w-4" />
          New Application
        </Link>
      </div>

      {/* Stats */}
      <StatsGrid stats={analytics} />

      {/* Main content: recent apps + fraud alerts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentApplications applications={applications} />
        </div>
        <div className="xl:col-span-1">
          <FraudAlertsFeed />
        </div>
      </div>
    </div>
  );
}
