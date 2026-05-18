import { useEffect, useState } from 'react';
import { companyApi } from '../../api/profile';
import { Button, Card, Input, Select, Textarea, Spinner } from '../../components/ui';

const EMPTY = {
  name: '',
  industry: '',
  email: '',
  country: '',
  city: '',
  employees: '',
  founded: '',
  website: '',
  description: '',
};

const SIZE_BANDS = ['1-10', '11-50', '51-200', '201-500', '500+'];

export default function CompanyProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    (async () => {
      try {
        const { profile } = await companyApi.getProfile();
        if (profile) {
          setForm({
            name: profile.name || '',
            industry: profile.industry || '',
            email: profile.email || '',
            country: profile.country || '',
            city: profile.city || '',
            employees: profile.employees || '',
            founded: profile.founded || '',
            website: profile.website || '',
            description: profile.description || '',
          });
        }
      } catch {
        /* no profile yet */
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
      await companyApi.updateProfile({
        ...form,
        founded: form.founded === '' ? undefined : Number(form.founded),
      });
      setMessage({ type: 'success', text: 'Company profile saved successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not save profile.' });
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
        <h1 className="text-2xl font-semibold tracking-tight">Company profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tell students about your organisation. A complete profile is required to post internships.
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
          <Input className="sm:col-span-2" label="Company name" required value={form.name} onChange={set('name')} placeholder="Zemen Technologies" />
          <Input label="Industry" value={form.industry} onChange={set('industry')} placeholder="Software" />
          <Input label="Contact email" type="email" value={form.email} onChange={set('email')} placeholder="hr@company.et" />
          <Input label="Country" value={form.country} onChange={set('country')} placeholder="Ethiopia" />
          <Input label="City" value={form.city} onChange={set('city')} placeholder="Addis Ababa" />
          <Select label="Company size" value={form.employees} onChange={set('employees')}>
            <option value="">Select size</option>
            {SIZE_BANDS.map((b) => (
              <option key={b} value={b}>
                {b} employees
              </option>
            ))}
          </Select>
          <Input label="Founded" type="number" value={form.founded} onChange={set('founded')} placeholder="2015" />
          <Input className="sm:col-span-2" label="Website" value={form.website} onChange={set('website')} placeholder="https://company.et" />
          <Textarea className="sm:col-span-2" label="Description" value={form.description} onChange={set('description')} placeholder="What your company does…" />
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving}>
              Save profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
