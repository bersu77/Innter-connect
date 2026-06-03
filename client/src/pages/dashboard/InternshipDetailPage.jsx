import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Calendar, Briefcase, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { internshipApi } from '../../api/internships';
import { applicationApi } from '../../api/applications';
import { studentApi, universityApi } from '../../api/profile';
import { Badge, Button, Card, Select, Spinner, Textarea } from '../../components/ui';
import ProfileHighlightsPicker from '../../components/ProfileHighlightsPicker';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

export default function InternshipDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.userType ?? user?.role;

  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Apply (student)
  const [coverLetter, setCoverLetter] = useState('');
  const [universities, setUniversities] = useState([]);
  const [universityId, setUniversityId] = useState('');
  const [profile, setProfile] = useState(null);
  // Highlights chosen for this application. Array of { kind, index, key, title, detail }.
  const [highlights, setHighlights] = useState([]);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState(null);
  const [applied, setApplied] = useState(false);

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

  // A student picks the university they are enrolled at — pre-filled from their
  // profile. That university verifies the application before the company acts.
  useEffect(() => {
    if (role !== 'student') return;
    (async () => {
      try {
        const [uniRes, profileRes] = await Promise.all([
          universityApi.list(),
          studentApi.getProfile(),
        ]);
        setUniversities(uniRes.universities || []);
        setProfile(profileRes.profile || null);
        setUniversityId(profileRes.profile?.universityId || '');
      } catch {
        /* non-fatal — the student can still pick a university below */
      }
    })();
  }, [role]);

  async function handleApply() {
    if (!universityId) {
      setApplyMessage({ type: 'error', text: 'Select the university you are enrolled at.' });
      return;
    }
    setApplying(true);
    setApplyMessage(null);
    try {
      await applicationApi.apply(id, {
        coverLetter,
        universityId,
        selectedItems: highlights.map((h) => ({ kind: h.kind, index: h.index })),
        files: uploadFiles,
      });
      setApplied(true);
      setApplyMessage({ type: 'success', text: 'Application submitted successfully.' });
    } catch (err) {
      setApplyMessage({ type: 'error', text: err.response?.data?.message || 'Could not apply.' });
    } finally {
      setApplying(false);
    }
  }

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
  const canApply = role === 'student' && internship.status === 'active';
  // Students must have a CV on file before they can apply. Server enforces
  // this too (applicationController), so this client gate is just for a
  // clearer UI message + Apply-disabled state.
  const hasCv = !!profile?.cv?.path;

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


        {role === 'company' && (
          <div className="mt-6">
            <Button
              variant="secondary"
              onClick={() => navigate(`/dashboard/post-internship/${internship._id}`)}
            >
              Edit posting
            </Button>
          </div>
        )}
      </Card>

      {canApply && (
        <Card className="p-6">
          <h2 className="text-base font-semibold">Apply for this internship</h2>
          {applyMessage && (
            <div
              className={`mt-3 rounded-xl px-3.5 py-2.5 text-sm ${
                applyMessage.type === 'success'
                  ? 'bg-brand-50 text-brand-800'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {applyMessage.text}
            </div>
          )}
          {!applied && !hasCv && (
            <div className="mt-3 rounded-xl bg-amber-50 px-3.5 py-3 text-sm">
              <p className="font-semibold text-amber-800">
                Upload your CV before you can apply.
              </p>
              <p className="mt-1 text-amber-800/80">
                Companies need at least your résumé to evaluate your application.
                Add it on your{' '}
                <Link
                  to="/dashboard/profile"
                  className="font-semibold text-brand-600 hover:underline"
                >
                  profile page
                </Link>
                , then come back here.
              </p>
            </div>
          )}

          {!applied && (
            <>
              <Select
                className="mt-3"
                label="Your university"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                hint="This university will verify your enrolment and documents before the company reviews your application."
              >
                <option value="">Select your university</option>
                {universities.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </Select>
              <Textarea
                className="mt-3"
                label="Cover letter"
                rows={5}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell the company why you are a great fit…"
              />

              <div className="mt-4">
                <ProfileHighlightsPicker
                  profile={profile}
                  selected={highlights}
                  onChange={setHighlights}
                />
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Or upload files (optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setUploadFiles([...e.target.files])}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>

              <Button
                className="mt-3"
                loading={applying}
                onClick={handleApply}
                disabled={!hasCv}
                title={!hasCv ? 'Upload your CV on your profile to apply' : undefined}
              >
                Submit application
              </Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
