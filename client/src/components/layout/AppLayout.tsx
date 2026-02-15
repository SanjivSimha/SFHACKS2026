import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const checkAuth = useStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');

    function handleChange(e: MediaQueryListEvent | MediaQueryList) {
      if (e.matches && !sidebarCollapsed) {
        toggleSidebar();
      }
    }

    handleChange(mql);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
    // Only run on mount to set initial state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen bg-navy-900 font-body text-gray-100">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-[68px]' : 'ml-[240px]'
        )}
      >
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
