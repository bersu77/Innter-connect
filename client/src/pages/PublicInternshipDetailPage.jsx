// PublicInternshipDetailPage — anonymous internship detail.
//
// Anyone can read the posting. Clicking "Apply" either:
//   • forwards to /dashboard/internships/:id (the full apply flow) if the
//     visitor is already a logged-in student;
//   • redirects to /login with state.from set to the dashboard detail page,
//     so the user lands directly on the apply form after signing in.
//
// Non-student roles (company / university / admin) that visit here can still
// read the posting; the Apply CTA tells them they're signed in as the wrong
// role rather than redirecting blindly.

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Calendar, Briefcase, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { internshipApi } from '../api/internships';
import { Badge, Button, Card, Spinner } from '../components/ui';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

export default function PublicInternshipDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { internship: it } = await internshipApi.get(id);
        setInternship(it);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load this internship.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function onApply() {
    if (!user) {
      // Not logged in — bounce to /login, then back here. The login page
      // honours location.state.from.pathname after a successful sign-in.
      navigate('/login', {
        state: { from: { pathname: `/dashboard/internships/${id}` } },
      });
      return;
    }
    if ((user.userType ?? user.role) !== 'student') {
      // Wrong role — show a hint via apply panel, no redirect.
      return;
    }
    navigate(`/dashboard/internships/${id}`);
  }

  if (loading) {
    return (
      <div
        className="flex justify-center"
        style={{ background: 'var(--bg-paper)', minHeight: '100vh', paddingTop: 120 }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div
        style={{
          background: 'var(--bg-paper)',
          minHeight: '100vh',
          paddingTop: 96,
          textAlign: 'center',
        }}
      >
        <p className="t-body-md" style={{ color: 'var(--danger-600)' }}>
          {error || 'Internship not found.'}
        </p>
        <Link to="/internships" className="mt-4 inline-block text-sm" style={{ color: 'var(--brand-600)' }}>
          ← Back to internships
        </Link>
      </div>
    );
  }

  const role = user?.userType ?? user?.role;
  const pos = internship.position || {};
  const req = internship.requirements || {};
  const company = internship.companyId || {};

  return (
    <div style={{ background: 'var(--bg-paper)', minHeight: '100vh', paddingTop: 64 }}>
      <div
        className="mx-auto"
        style={{
          maxWidth: 'var(--content-max)',
          padding: 'clamp(32px, 5vw, 56px) var(--content-pad-x)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm"
          style={{
            color: 'var(--text-tertiary)',
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mt-3 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Detail */}
          <div>
            <Card style={{ padding: 24 }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="t-eyebrow">{company.industry || 'Engineering'}</span>
                  <h1
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(28px, 4vw, 42px)',
                      lineHeight: 1.05,
                      letterSpacing: '-0.02em',
                      margin: '6px 0 0',
                      fontWeight: 400,
                    }}
                  >
                    {internship.title}
                  </h1>
                  <p
                    className="t-body-md"
                    style={{ color: 'var(--text-secondary)', marginTop: 4 }}
                  >
                    {company.name || 'Company'}
                    {company.city ? ` · ${company.city}` : ''}
                  </p>
                </div>
                <Badge
                  tone={internship.status === 'active' ? 'success' : 'neutral'}
                >
                  {internship.status}
                </Badge>
              </div>

              <div
                className="mt-4 flex flex-wrap"
                style={{ gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}
              >
                {internship.locations?.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} strokeWidth={1.6} />
                    {internship.locations.join(', ')}
                  </span>
                )}
                {pos.type && (
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <Briefcase size={14} strokeWidth={1.6} />
                    {pos.type}
                    {pos.duration ? ` · ${pos.duration}` : ''}
                  </span>
                )}
                {internship.applicationDeadline && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={14} strokeWidth={1.6} />
                    Deadline {fmtDate(internship.applicationDeadline)}
                  </span>
                )}
              </div>

              {internship.description && (
                <>
                  <p
                    className="t-eyebrow"
                    style={{ marginTop: 20, marginBottom: 6 }}
                  >
                    About the role
                  </p>
                  <p
                    className="t-body-lg"
                    style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line', margin: 0 }}
                  >
                    {internship.description}
                  </p>
                </>
              )}

              {req.skills?.length > 0 && (
                <>
                  <p
                    className="t-eyebrow"
                    style={{ marginTop: 20, marginBottom: 6 }}
                  >
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {req.skills.map((s) => (
                      <Badge key={s} tone="neutral">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </>
              )}

              {req.qualifications?.length > 0 && (
                <>
                  <p
                    className="t-eyebrow"
                    style={{ marginTop: 20, marginBottom: 6 }}
                  >
                    Qualifications
                  </p>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      color: 'var(--text-secondary)',
                      fontSize: 14,
                      lineHeight: 1.7,
                    }}
                  >
                    {req.qualifications.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </>
              )}

              {company.description && (
                <>
                  <p
                    className="t-eyebrow"
                    style={{ marginTop: 20, marginBottom: 6 }}
                  >
                    About {company.name}
                  </p>
                  <p
                    className="t-body-md"
                    style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '60ch' }}
                  >
                    {company.description}
                  </p>
                </>
              )}
            </Card>
          </div>

          {/* Apply card */}
          <aside>
            <Card elevated style={{ padding: 20, position: 'sticky', top: 88 }}>
              <p className="t-eyebrow">Apply</p>
              {!user ? (
                <>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      lineHeight: 1.2,
                      margin: '6px 0 12px',
                      fontWeight: 400,
                    }}
                  >
                    Sign in to apply for this internship.
                  </p>
                  <p
                    className="t-body-sm"
                    style={{ color: 'var(--text-secondary)', marginBottom: 16 }}
                  >
                    You can browse freely — applying needs a student account so the
                    company can see your profile and the university can verify you.
                  </p>
                  <Button
                    onClick={onApply}
                    size="lg"
                    leading={<LogIn size={16} strokeWidth={1.8} />}
                    className="w-full"
                  >
                    Sign in to apply
                  </Button>
                  <p
                    className="t-caption"
                    style={{ marginTop: 12, textAlign: 'center' }}
                  >
                    New here?{' '}
                    <Link
                      to="/register"
                      style={{
                        color: 'var(--brand-600)',
                        fontWeight: 500,
                        borderBottom: 'none',
                      }}
                    >
                      Create a student account
                    </Link>
                  </p>
                </>
              ) : role === 'student' ? (
                <>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      lineHeight: 1.2,
                      margin: '6px 0 12px',
                      fontWeight: 400,
                    }}
                  >
                    You're signed in — continue to the apply form.
                  </p>
                  <Button onClick={onApply} size="lg" className="w-full">
                    Continue to apply
                  </Button>
                </>
              ) : (
                <>
                  <p
                    className="t-body-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    You're signed in as a <strong>{role}</strong>. Only students can
                    apply. Sign out and sign in with a student account if you want to
                    submit an application.
                  </p>
                </>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
