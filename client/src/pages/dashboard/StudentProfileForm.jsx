import { useEffect, useState } from 'react';
import { studentApi, universityApi } from '../../api/profile';
import { Button, Card, Input, Select, Spinner } from '../../components/ui';

const csv = (arr) => (arr || []).join(', ');
const toArr = (str) => str.split(',').map((s) => s.trim()).filter(Boolean);

const EMPTY = {
  universityId: '',
  studentId: '',
  enrollmentYear: '',
  graduationYear: '',
  major: '',
  gpa: '',
  academicStanding: 'good',
  skills: '',
  interests: '',
  languages: '',
  desiredLocations: '',
  workAuthorization: '',
};

export default function StudentProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [cv, setCv] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, uniRes] = await Promise.all([
          studentApi.getProfile(),
          universityApi.list(),
        ]);
        setUniversities(uniRes.universities || []);
        const p = profileRes.profile;
        if (p) {
          setForm({
            universityId: p.universityId?._id || p.universityId || '',
            studentId: p.studentId || '',
            enrollmentYear: p.enrollmentYear || '',
            graduationYear: p.graduationYear || '',
            major: p.major || '',
            gpa: p.gpa ?? '',
            academicStanding: p.academicStanding || 'good',
            skills: csv(p.skills),
            interests: csv(p.interests),
            languages: csv(p.languages),
            desiredLocations: csv(p.desiredLocations),
            workAuthorization: p.workAuthorization || '',
          });
          setCv(p.cv || null);
        }
      } catch {
        /* no profile yet — start blank */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await studentApi.updateProfile({
        ...form,
        universityId: form.universityId || undefined,
        gpa: form.gpa === '' ? undefined : Number(form.gpa),
        enrollmentYear: form.enrollmentYear === '' ? undefined : Number(form.enrollmentYear),
        graduationYear: form.graduationYear === '' ? undefined : Number(form.graduationYear),
        skills: toArr(form.skills),
        interests: toArr(form.interests),
        languages: toArr(form.languages),
        desiredLocations: toArr(form.desiredLocations),
      });
      setMessage({ type: 'success', text: 'Profile saved successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not save profile.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleCv(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    try {
      const { cv: uploaded } = await studentApi.uploadCv(file);
      setCv(uploaded);
      setMessage({ type: 'success', text: 'CV uploaded successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'CV upload failed.' });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Student profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Complete your academic profile so you can apply for internships.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl px-3.5 py-2.5 text-sm ${
            message.type === 'success' ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
          <Select label="University" value={form.universityId} onChange={set('universityId')}>
            <option value="">Select your university</option>
            {universities.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </Select>
          <Input label="Student ID" value={form.studentId} onChange={set('studentId')} placeholder="UGR/0000/15" />
          <Input label="Major" value={form.major} onChange={set('major')} placeholder="Computer Science" />
          <Select label="Academic standing" value={form.academicStanding} onChange={set('academicStanding')}>
            <option value="good">Good</option>
            <option value="warning">Warning</option>
            <option value="probation">Probation</option>
          </Select>
          <Input label="Enrollment year" type="number" value={form.enrollmentYear} onChange={set('enrollmentYear')} placeholder="2022" />
          <Input label="Graduation year" type="number" value={form.graduationYear} onChange={set('graduationYear')} placeholder="2026" />
          <Input label="GPA" type="number" step="0.01" min="0" max="4" value={form.gpa} onChange={set('gpa')} placeholder="3.50" />
          <Input label="Work authorization" value={form.workAuthorization} onChange={set('workAuthorization')} placeholder="Ethiopian citizen" />
          <Input className="sm:col-span-2" label="Skills" value={form.skills} onChange={set('skills')} hint="Comma-separated" placeholder="React, Node.js, Python" />
          <Input className="sm:col-span-2" label="Interests" value={form.interests} onChange={set('interests')} hint="Comma-separated" placeholder="Web Development, AI" />
          <Input label="Languages" value={form.languages} onChange={set('languages')} hint="Comma-separated" placeholder="Amharic, English" />
          <Input label="Desired locations" value={form.desiredLocations} onChange={set('desiredLocations')} hint="Comma-separated" placeholder="Addis Ababa, Remote" />
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving}>
              Save profile
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold">
          CV / Résumé <span className="text-red-500">*</span>
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {cv ? (
            `Current: ${cv.filename} (version ${cv.version})`
          ) : (
            <span className="font-medium text-amber-700">
              No CV uploaded yet — a CV is required to complete your profile.
            </span>
          )}
        </p>
        <div className="mt-3 flex items-center gap-4">
          <label className="cursor-pointer">
            <span className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700">
              Upload CV
            </span>
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleCv} className="hidden" />
          </label>
          {cv && (
            <a
              href={cv.path}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View current CV
            </a>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-400">PDF, DOC or DOCX — max 5 MB.</p>
      </Card>
    </div>
  );
}
