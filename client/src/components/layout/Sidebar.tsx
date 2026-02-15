import { NavLink } from 'react-router-dom';
import {
  Shield,
  Leaf,
  LayoutDashboard,
  FileText,
  PlusCircle,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/applications', icon: FileText, label: 'Applications' },
  { to: '/applications/new', icon: PlusCircle, label: 'New Application' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-navy-700 bg-navy-900 transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Branding */}
      <div className="flex h-16 items-center gap-3 border-b border-navy-700 px-4">
        <div className="relative flex-shrink-0">
          <Shield className="h-8 w-8 text-accent-green" />
          <Leaf className="absolute -bottom-0.5 -right-1 h-3.5 w-3.5 text-accent-teal" />
        </div>
        {!collapsed && (
          <span className="font-heading text-lg font-bold tracking-tight text-white">
            GrantShield
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-l-2 border-accent-green bg-accent-green/10 text-accent-green'
                  : 'border-l-2 border-transparent text-gray-400 hover:bg-navy-700 hover:text-gray-200'
              )
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="mx-3 mb-2 flex items-center justify-center rounded-lg border border-navy-700 py-2 text-gray-400 transition-colors hover:bg-navy-700 hover:text-gray-200"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* User info */}
      <div className="border-t border-navy-700 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent-green/20 text-sm font-semibold text-accent-green">
            {user ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase() : '?'}
          </div>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between overflow-hidden">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user?.name ?? 'Guest'}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {user?.role ?? ''}
                </p>
              </div>
              <button
                onClick={logout}
                className="ml-2 rounded-md p-1.5 text-gray-500 transition-colors hover:bg-navy-700 hover:text-gray-300"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
