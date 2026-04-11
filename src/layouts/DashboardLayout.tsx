import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FilePlus, Clock, FileText, Activity, Crown, Settings, LogOut, Zap, Users, ScrollText, BarChart3, MessageSquare, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user, logout, isAdmin, permissions } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: permissions?.dashboard },
    { to: '/create-invoice', label: 'Invoice — Regular', icon: FilePlus, perm: permissions?.create_invoice },
    { to: '/create-invoice-hourly', label: 'Invoice — Hourly', icon: Clock, perm: permissions?.create_invoice },
    { to: '/invoices', label: 'My Invoices', icon: FileText, perm: permissions?.my_invoices },
    { to: '/activity', label: 'Activity Logs', icon: Activity, perm: permissions?.activity_logs },
    { to: '/review-feedback', label: 'Help ChaseFlow Improve', icon: MessageSquare, perm: permissions?.review_feedback },
    { to: '/pro', label: 'Pro Plan', icon: Crown, perm: permissions?.pro_plan },
    { to: '/settings', label: 'Settings', icon: Settings, perm: permissions?.settings },
  ];

  const adminItems = [
    { to: '/admin/users', label: 'User Management', icon: Users, perm: permissions?.admin_user_management },
    { to: '/admin/system-logs', label: 'System Logs', icon: ScrollText, perm: permissions?.admin_system_logs },
    { to: '/admin/invoice-reports', label: 'Invoice Reports', icon: BarChart3, perm: permissions?.admin_invoice_reports },
    { to: '/admin/survey-reports', label: 'Survey Reports', icon: ClipboardList, perm: permissions?.admin_survey_reports },
  ];

  const visibleNav = navItems.filter(i => i.perm !== false);
  const visibleAdmin = isAdmin ? adminItems.filter(i => i.perm !== false) : [];

  const NavItem = ({ item }: { item: typeof navItems[number] }) => {
    const active = pathname === item.to;
    const link = (
      <Link
        to={item.to}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-sidebar-accent text-sidebar-primary-foreground'
            : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        } ${collapsed ? 'justify-center' : ''}`}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return link;
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-sidebar flex flex-col shrink-0 transition-all duration-200 relative`}>
        <div className={`p-6 ${collapsed ? 'px-3' : ''}`}>
          <Link to="/dashboard" className="flex items-center gap-2">
            <Zap className="h-7 w-7 text-sidebar-primary shrink-0" />
            {!collapsed && <span className="text-xl font-bold text-sidebar-primary-foreground">ChaseFlow</span>}
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 z-10 h-6 w-6 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-sidebar-muted hover:text-sidebar-foreground transition-colors shadow-sm"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        <nav className="flex-1 px-3 space-y-1">
          {visibleNav.map(item => (
            <NavItem key={item.to} item={item} />
          ))}

          {visibleAdmin.length > 0 && (
            <>
              {!collapsed && (
                <div className="pt-4 pb-1 px-3">
                  <span className="text-[10px] uppercase tracking-wider text-sidebar-muted font-semibold">Admin</span>
                </div>
              )}
              {collapsed && <div className="pt-4 border-t border-sidebar-border mx-1" />}
              {visibleAdmin.map(item => (
                <NavItem key={item.to} item={item} />
              ))}
            </>
          )}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-semibold text-sidebar-primary-foreground shrink-0">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.full_name}</p>
                <p className="text-xs text-sidebar-muted truncate">{user?.email}</p>
              </div>
            )}
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button onClick={logout} className="text-sidebar-muted hover:text-sidebar-foreground transition-colors">
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Logout</TooltipContent>
              </Tooltip>
            ) : (
              <button onClick={logout} className="text-sidebar-muted hover:text-sidebar-foreground transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
