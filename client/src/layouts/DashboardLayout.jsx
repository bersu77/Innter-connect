// DashboardLayout — shared shell for every authenticated role workspace.
// Nav is keyed by an effective role: a company user with the 'supervisor'
// sub-role gets the supervisor workspace, not the manager one.
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

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

function SidebarBody({ navItems, onNavigate, onLogout }) {
  return (
    <>
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-semibold tracking-tight">
          <span className="text-brand-600">Intern</span>Connect
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
              ].join(' ')
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200/70 p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Log out
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

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur-glass md:flex">
        <SidebarBody navItems={navItems} onLogout={handleLogout} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-soft-lg">
            <SidebarBody
              navItems={navItems}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-glass sm:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex flex-col leading-tight">
              {user?.organizationName && (
                <span className="text-sm font-semibold text-slate-700">
                  {user.organizationName}
                </span>
              )}
              <span className="text-xs capitalize text-slate-400">{role} workspace</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="hidden text-sm font-medium text-slate-600 sm:block">{name}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {(name[0] || 'U').toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
