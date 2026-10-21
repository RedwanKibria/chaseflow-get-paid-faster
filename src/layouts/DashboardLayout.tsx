import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FilePlus, Clock, FileText, Activity, Crown, Settings, LogOut, Zap, Users, ScrollText, BarChart3, MessageSquare, ClipboardList, ChevronLeft, ChevronRight, Mail, CalendarClock, Menu } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import BrandingOnboarding from '@/components/BrandingOnboarding';

const SIDEBAR_KEY = 'chaseflow_sidebar_collapsed';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user, logout, isAdmin, permissions } = useApp();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === 'true'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch {}
  };

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: permissions?.dashboard },
    { to: '/create-invoice', label: 'Invoice — Regular', icon: FilePlus, perm: permissions?.create_invoice },
    { to: '/create-invoice-hourly', label: 'Invoice — Hourly', icon: Clock, perm: permissions?.create_invoice },
    { to: '/invoices', label: 'My Invoices', icon: FileText, perm: permissions?.my_invoices },
    { to: '/email-delivery', label: 'Email Delivery', icon: Mail, perm: permissions?.my_invoices },
    { to: '/activity', label: 'Activity Logs', icon: Activity, perm: permissions?.activity_logs },
    { to: '/review-feedback', label: 'Help ChaseFlow Improve', icon: MessageSquare, perm: permissions?.review_feedback },
    { to: '/settings', label: 'Settings', icon: Settings, perm: permissions?.settings },
  ];

  const adminItems = [
    { to: '/admin/users', label: 'User Management', icon: Users, perm: permissions?.admin_user_management },
    { to: '/admin/system-logs', label: 'System Logs', icon: ScrollText, perm: permissions?.admin_system_logs },
    { to: '/admin/invoice-reports', label: 'Invoice Reports', icon: BarChart3, perm: permissions?.admin_invoice_reports },
    { to: '/admin/email-delivery', label: 'Email Delivery (All)', icon: Mail, perm: permissions?.admin_invoice_reports },
    { to: '/admin/scheduler', label: 'Scheduler Report', icon: CalendarClock, perm: permissions?.admin_system_logs },
    { to: '/admin/survey-reports', label: 'Survey Reports', icon: ClipboardList, perm: permissions?.admin_survey_reports },
  ];

  const visibleNav = navItems.filter(i => i.perm !== false);
  const visibleAdmin = isAdmin ? adminItems.filter(i => i.perm !== false) : [];

  const NavItem = ({ item, forceLabel = false }: { item: typeof navItems[number]; forceLabel?: boolean }) => {
    const active = pathname === item.to;
    const showLabel = forceLabel || !collapsed;
    const link = (
      <Link
        to={item.to}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-sidebar-accent text-sidebar-primary-foreground'
            : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        } ${!showLabel ? 'justify-center' : ''}`}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {showLabel && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (!showLabel) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return link;
  };

  const SidebarBody = ({ inDrawer = false }: { inDrawer?: boolean }) => {
    const expanded = inDrawer || !collapsed;
    return (
      <>
        <div className={`p-6 ${!expanded ? 'px-3' : ''}`}>
          <Link to="/dashboard" className="flex items-center gap-2">
            <Zap className="h-7 w-7 text-sidebar-primary shrink-0" />
            {expanded && <span className="text-xl font-bold text-sidebar-primary-foreground">ChaseFlow</span>}
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {visibleNav.map(item => (<NavItem key={item.to} item={item} forceLabel={inDrawer} />))}

          {visibleAdmin.length > 0 && (
            <>
              {expanded ? (
                <div className="pt-4 pb-1 px-3">
                  <span className="text-[10px] uppercase tracking-wider text-sidebar-muted font-semibold">Admin</span>
                </div>
              ) : (
                <div className="pt-4 border-t border-sidebar-border mx-1" />
              )}
              {visibleAdmin.map(item => (<NavItem key={item.to} item={item} forceLabel={inDrawer} />))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className={`flex items-center gap-3 px-3 py-2 ${!expanded ? 'justify-center' : ''}`}>
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-semibold text-sidebar-primary-foreground shrink-0">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.full_name}</p>
                <p className="text-xs text-sidebar-muted truncate">{user?.email}</p>
              </div>
            )}
            {!expanded ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button onClick={logout} className="text-sidebar-muted hover:text-sidebar-foreground transition-colors">
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Logout</TooltipContent>
              </Tooltip>
            ) : (
              <button onClick={logout} className="text-sidebar-muted hover:text-sidebar-foreground transition-colors" aria-label="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <BrandingOnboarding />
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-sidebar flex flex-col shrink-0 transition-all duration-200 relative`}>
          <button
            onClick={toggleCollapsed}
            className="absolute -right-3 top-16 z-10 h-6 w-6 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-sidebar-muted hover:text-sidebar-foreground transition-colors shadow-sm"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
          <SidebarBody />
        </aside>
      )}

      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile header */}
        {isMobile && (
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 h-14 bg-sidebar border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-sidebar-primary" />
              <span className="text-base font-bold text-sidebar-primary-foreground">ChaseFlow</span>
            </Link>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-sidebar flex flex-col border-sidebar-border">
                <SidebarBody inDrawer />
              </SheetContent>
            </Sheet>
          </header>
        )}

        <div className="p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
