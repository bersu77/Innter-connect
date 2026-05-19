// DashboardLayout — design-system v2 shell.
// 264px sidebar · 72px glass header · brand-tinted active nav with left bar ·
// mobile drawer with scrim + slide-in. Role-keyed nav (a company user with the
// 'supervisor' sub-role gets the supervisor workspace).
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  User,
  Building2,
  Users,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Mail,
  Handshake,
  ClipboardList,
  Award,
  ListChecks,
  Star,
  BarChart3,
  ScrollText,
  Settings,
  Gavel,
  MessageSquare,
  UserPlus,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';

const dashboard = { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true };
const account = { to: '/dashboard/account', label: 'Account', icon: Settings };
const appeals = { to: '/dashboard/appeals', label: 'Appeals', icon: Gavel };
const messages = { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare };
const reports = { to: '/dashboard/reports', label: 'Reports', icon: BarChart3 };

const NAV_BY_ROLE = {
  student: [
    dashboard,
    { to: '/dashboard/internships', label: 'Internships', icon: Briefcase },
    { to: '/dashboard/applications', label: 'My Applications', icon: ClipboardList },
    { to: '/dashboard/placements', label: 'Placements', icon: Award },
    { to: '/dashboard/tasks', label: 'Tasks', icon: ListChecks },
    { to: '/dashboard/assessments', label: 'Assessments', icon: Star },
    messages,
    appeals,
    { to: '/dashboard/profile', label: 'My Profile', icon: User },
    account,
  ],
  company: [
    dashboard,
    { to: '/dashboard/internships', label: 'My Internships', icon: Briefcase },
    { to: '/dashboard/applications', label: 'Applications', icon: ClipboardList },
    { to: '/dashboard/placements', label: 'Placements', icon: Award },
    { to: '/dashboard/supervisors', label: 'Supervisors', icon: UserPlus },
    { to: '/dashboard/invitations', label: 'Invitations', icon: Mail },
    reports,
    appeals,
    { to: '/dashboard/profile', label: 'Company Profile', icon: Building2 },
    account,
  ],
  supervisor: [
    dashboard,
    { to: '/dashboard/placements', label: 'My Interns', icon: Award },
    { to: '/dashboard/tasks', label: 'Tasks', icon: ListChecks },
    { to: '/dashboard/assessments', label: 'Assessments', icon: Star },
    messages,
    account,
  ],
  university: [
    dashboard,
    { to: '/dashboard/students', label: 'Student Verification', icon: UserCheck },
    { to: '/dashboard/application-verification', label: 'Applications', icon: ClipboardList },
    { to: '/dashboard/placements', label: 'Placements', icon: Award },
    { to: '/dashboard/partners', label: 'Partner Companies', icon: Handshake },
    reports,
    appeals,
    { to: '/dashboard/profile', label: 'University Profile', icon: Building2 },
    account,
  ],
  admin: [
    dashboard,
    { to: '/dashboard/users', label: 'Users', icon: Users },
    { to: '/dashboard/verification', label: 'Verification', icon: ShieldCheck },
    appeals,
    { to: '/dashboard/audit', label: 'Audit Log', icon: ScrollText },
    reports,
    account,
  ],
};

// A company user with the 'supervisor' sub-role uses the supervisor workspace.
export function effectiveRole(user) {
  const type = user?.userType ?? user?.role ?? 'student';
  if (type === 'company' && (user?.roles || []).includes('supervisor')) return 'supervisor';
  return type;
}

function SidebarBody({ navItems, onNavigate, onLogout, onClose }) {
  return (
    <>
      <div className="flex items-center justify-between" style={{ padding: '0 8px 14px' }}>
        <Logo />
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="btn btn-ghost btn-sm"
            style={{ width: 32, padding: 0 }}
          >
            <X size={16} strokeWidth={1.6} />
          </button>
        )}
      </div>
      <nav
        className="flex-1 overflow-y-auto"
        style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}
      >
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
          >
            <Icon size={18} strokeWidth={1.6} />
            <span style={{ flex: 1 }}>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
        <button onClick={onLogout} className="nav-item" style={{ width: '100%' }}>
          <LogOut size={18} strokeWidth={1.6} />
          <span>Log out</span>
        </button>
      </div>
    </>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = effectiveRole(user);
  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.student;
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'there';
  const initial = (name[0] || 'U').toUpperCase();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-paper)', color: 'var(--text-primary)' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex shrink-0 flex-col"
        style={{
          width: 'var(--sidebar-w)',
          background: 'var(--bg-raised)',
          borderRight: '1px solid var(--border-subtle)',
          padding: '20px 16px',
        }}
      >
        <SidebarBody navItems={navItems} onLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0"
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'rgba(20,17,14,.40)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />
          <aside
            className="absolute left-0 top-0 flex h-full flex-col"
            style={{
              width: 280,
              background: 'var(--bg-raised)',
              boxShadow: 'var(--shadow-4)',
              padding: '20px 16px',
              animation: 'drawer-in 320ms var(--ease-soft)',
            }}
          >
            <SidebarBody
              navItems={navItems}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
          <style>{`@keyframes drawer-in { from { transform: translateX(-12px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center sticky top-0 z-30"
          style={{
            height: 'var(--header-h)',
            background: 'color-mix(in srgb, var(--bg-raised) 80%, transparent)',
            backdropFilter: 'blur(var(--blur-md)) saturate(140%)',
            WebkitBackdropFilter: 'blur(var(--blur-md)) saturate(140%)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 24px',
            gap: 18,
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="btn btn-ghost btn-sm md:hidden"
            style={{ width: 36, padding: 0 }}
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={1.6} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            {user?.organizationName ? (
              <>
                <span className="t-heading-md">{user.organizationName}</span>
                <span
                  className="t-mono"
                  style={{
                    fontSize: 10.5,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                    marginTop: 2,
                  }}
                >
                  {role} workspace
                </span>
              </>
            ) : (
              <span
                className="t-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                }}
              >
                {role} workspace
              </span>
            )}
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ThemeToggle />
            <NotificationBell />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingLeft: 12,
                marginLeft: 4,
                borderLeft: '1px solid var(--border-subtle)',
                height: 36,
              }}
            >
              <span
                className="t-body-md hidden sm:inline"
                style={{ color: 'var(--text-secondary)' }}
              >
                {name}
              </span>
              <span
                aria-hidden
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: 'var(--brand-100)',
                  color: 'var(--brand-700)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {initial}
              </span>
            </div>
          </div>
        </header>
        <main
          className="flex-1"
          style={{
            padding: 'var(--content-pad-y) var(--content-pad-x)',
            maxWidth: '100%',
          }}
        >
          <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
