// DashboardLayout — shared shell for every authenticated role workspace.
// Sidebar nav is role-aware; later phases append items to NAV_BY_ROLE.
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

const dashboard = { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true };
const placements = { to: '/dashboard/placements', label: 'Placements', icon: Award };
const tasks = { to: '/dashboard/tasks', label: 'Tasks', icon: ListChecks };
const assessments = { to: '/dashboard/assessments', label: 'Assessments', icon: Star };
const reports = { to: '/dashboard/reports', label: 'Reports', icon: BarChart3 };

const NAV_BY_ROLE = {
  student: [
    dashboard,
    { to: '/dashboard/internships', label: 'Internships', icon: Briefcase },
    { to: '/dashboard/applications', label: 'My Applications', icon: ClipboardList },
    placements,
    tasks,
    assessments,
    { to: '/dashboard/profile', label: 'My Profile', icon: User },
  ],
  company: [
    dashboard,
    { to: '/dashboard/internships', label: 'My Internships', icon: Briefcase },
    { to: '/dashboard/applications', label: 'Applications', icon: ClipboardList },
    placements,
    tasks,
    assessments,
    reports,
    { to: '/dashboard/invitations', label: 'Invitations', icon: Mail },
    { to: '/dashboard/profile', label: 'Company Profile', icon: Building2 },
  ],
  university: [
    dashboard,
    { to: '/dashboard/students', label: 'Student Verification', icon: UserCheck },
    placements,
    { to: '/dashboard/partners', label: 'Partner Companies', icon: Handshake },
    reports,
    { to: '/dashboard/profile', label: 'University Profile', icon: Building2 },
  ],
  admin: [
    dashboard,
    { to: '/dashboard/users', label: 'Users', icon: Users },
    { to: '/dashboard/verification', label: 'Verification', icon: ShieldCheck },
    { to: '/dashboard/audit', label: 'Audit Log', icon: ScrollText },
    reports,
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.userType ?? user?.role ?? 'student';
  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.student;
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'there';

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* ── Sidebar ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur-glass md:flex">
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
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-6 backdrop-blur-glass">
          <span className="text-sm capitalize text-slate-400">{role} workspace</span>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="hidden text-sm font-medium text-slate-600 sm:block">{name}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {(name[0] || 'U').toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
