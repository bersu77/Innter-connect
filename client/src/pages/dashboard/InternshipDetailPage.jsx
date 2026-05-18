import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Briefcase, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { internshipApi } from '../../api/internships';
import { Badge, Button, Card, Spinner } from '../../components/ui';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

export default function InternshipDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.userType ?? user?.role;

  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { internship: data } = await internshipApi.get(id);
        setInternship(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Internship not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }
  if (error || !internship) {
    return <div className="mx-auto max-w-3xl text-sm text-red-600">{error}</div>;
  }

  const req = internship.requirements || {};
  const pos = internship.position || {};

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{internship.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {internship.companyId?.name}
              {internship.companyId?.industry ? ` · ${internship.companyId.industry}` : ''}
            </p>
          </div>
          <Badge tone={internship.status === 'active' ? 'success' : 'neutral'}>
            {internship.status}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
          {internship.locations?.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {internship.locations.join(', ')}
            </span>
          )}
          {pos.type && (
            <span className="inline-flex items-center gap-1.5 capitalize">
              <Briefcase className="h-4 w-4" />
              {pos.type}
              {pos.duration ? ` · ${pos.duration}` : ''}
            </span>
          )}
          {internship.applicationDeadline && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Deadline {fmtDate(internship.applicationDeadline)}
            </span>
          )}
        </div>

        <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
          {internship.description}
        </p>

        {(req.skills?.length > 0 || req.majors?.length > 0 || req.minGPA > 0) && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h2 className="text-sm font-semibold text-slate-800">Requirements</h2>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {req.minGPA > 0 && <li>Minimum GPA: {req.minGPA}</li>}
              {req.majors?.length > 0 && <li>Majors: {req.majors.join(', ')}</li>}
              {req.skills?.length > 0 && <li>Skills: {req.skills.join(', ')}</li>}
            </ul>
          </div>
        )}

        {pos.paid && (
          <p className="mt-4 text-sm text-slate-600">
            Paid position{pos.stipend ? ` — stipend ${pos.stipend} ETB` : ''}.
          </p>
        )}

        <div className="mt-6 flex gap-3">
          {role === 'company' && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/dashboard/post-internship/${internship._id}`)}
            >
              Edit posting
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
