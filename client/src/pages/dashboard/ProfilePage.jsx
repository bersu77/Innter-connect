// ProfilePage — routes to the role-specific profile form (UC002).
import { useAuth } from '../../context/AuthContext';
import StudentProfileForm from './StudentProfileForm';
import CompanyProfileForm from './CompanyProfileForm';
import UniversityProfileForm from './UniversityProfileForm';

export default function ProfilePage() {
  const { user } = useAuth();
  const role = user?.userType ?? user?.role;

  if (role === 'student') return <StudentProfileForm />;
  if (role === 'company') return <CompanyProfileForm />;
  if (role === 'university') return <UniversityProfileForm />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        Administrator accounts do not have an editable profile.
      </p>
    </div>
  );
}
