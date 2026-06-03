import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { internshipApi } from '../../api/internships';
import { Button, Card, Input, Select, Textarea, Spinner } from '../../components/ui';

const csv = (arr) => (arr || []).join(', ');
const toArr = (str) => str.split(',').map((s) => s.trim()).filter(Boolean);
const dateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const EMPTY = {
  title: '',
  description: '',
  locations: '',
  tags: '',
  type: 'onsite',
  duration: '',
  applicationDeadline: '',
  totalPositions: 1,
  minGPA: '',
  skills: '',
  majors: '',
};

export default function PostInternshipPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) return;
    (async () => {
      try {
        const { internship: it } = await internshipApi.get(id);
        setForm({
          title: it.title || '',
          description: it.description || '',
          locations: csv(it.locations),
          tags: csv(it.tags),
          type: it.position?.type || 'onsite',
          duration: it.position?.duration || '',
          applicationDeadline: dateInput(it.applicationDeadline),
          totalPositions: it.totalPositions || 1,
          minGPA: it.requirements?.minGPA || '',
          skills: csv(it.requirements?.skills),
          majors: csv(it.requirements?.majors),
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load internship.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, editing]);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  function buildPayload(status) {
    return {
      title: form.title,
      description: form.description,
      locations: toArr(form.locations),
      tags: toArr(form.tags),
      totalPositions: Number(form.totalPositions) || 1,
      applicationDeadline: form.applicationDeadline || undefined,
      position: {
        type: form.type,
        duration: form.duration,
      },
      requirements: {
        minGPA: form.minGPA === '' ? 0 : Number(form.minGPA),
        skills: toArr(form.skills),
        majors: toArr(form.majors),
      },
      ...(status ? { status } : {}),
    };
  }

  async function submit(status) {
    setError('');
    if (!form.title || !form.description) {
      setError('Title and description are required.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await internshipApi.update(id, buildPayload());
        if (status) await internshipApi.updateStatus(id, status);
      } else {
        await internshipApi.create(buildPayload(status));
      }
      navigate('/dashboard/internships');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save internship.');
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-semibold tracking-tight">
          {editing ? 'Edit internship' : 'Post an internship'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Describe the opportunity so students can find and apply for it.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
      )}

      <Card className="p-6">
        <form onSubmit={(e) => e.preventDefault()} className="grid gap-4 sm:grid-cols-2">
          <Input className="sm:col-span-2" label="Title" required value={form.title} onChange={set('title')} placeholder="Frontend Developer Intern" />
          <Textarea className="sm:col-span-2" label="Description" required value={form.description} onChange={set('description')} rows={5} placeholder="Role overview, responsibilities…" />
          <Input label="Locations" value={form.locations} onChange={set('locations')} hint="Comma-separated" placeholder="Addis Ababa, Remote" />
          <Input label="Tags" value={form.tags} onChange={set('tags')} hint="Comma-separated" placeholder="frontend, react" />
          <Select label="Work type" value={form.type} onChange={set('type')}>
            <option value="onsite">On-site</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </Select>
          <Input label="Duration" value={form.duration} onChange={set('duration')} placeholder="3 months" />
          <Input label="Application deadline" type="date" min={new Date().toISOString().split('T')[0]} value={form.applicationDeadline} onChange={set('applicationDeadline')} />
          <Input label="Total positions" type="number" min="1" value={form.totalPositions} onChange={set('totalPositions')} />
          <Input label="Minimum GPA" type="number" step="0.01" min="0" max="4" value={form.minGPA} onChange={set('minGPA')} placeholder="3.00" />
          <Input label="Required skills" value={form.skills} onChange={set('skills')} hint="Comma-separated" placeholder="React, JavaScript" />
          <Input label="Eligible majors" value={form.majors} onChange={set('majors')} hint="Comma-separated" placeholder="Computer Science" />
          <div className="flex gap-3 sm:col-span-2">
            <Button type="button" loading={saving} onClick={() => submit('active')}>
              {editing ? 'Save & publish' : 'Publish internship'}
            </Button>
            <Button type="button" variant="secondary" loading={saving} onClick={() => submit(editing ? undefined : 'draft')}>
              Save as draft
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
