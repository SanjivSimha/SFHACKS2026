import { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';

export default function Header() {
  const user = useStore((s) => s.user);
  const [searchValue, setSearchValue] = useState('');

  const initials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-navy-700 bg-navy-800 px-6">
      {/* Search */}
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search applications, applicants..."
          className={cn(
            'w-full rounded-lg border border-navy-600 bg-navy-700 py-2 pl-10 pr-4 text-sm text-gray-200',
            'placeholder:text-gray-500 focus:border-accent-green/50 focus:outline-none focus:ring-1 focus:ring-accent-green/50',
            'transition-colors'
          )}
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-navy-700 hover:text-gray-200"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
          </span>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-green to-accent-teal text-sm font-semibold text-navy-900">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">{user?.name ?? 'Guest'}</p>
            <p className="text-xs text-gray-500">{user?.role ?? ''}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
