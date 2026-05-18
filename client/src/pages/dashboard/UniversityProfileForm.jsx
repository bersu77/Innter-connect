import { useEffect, useState } from 'react';
import { universityApi } from '../../api/profile';
import { Button, Card, Input, Spinner } from '../../components/ui';

const csv = (arr) => (arr || []).join(', ');
const toArr = (str) => str.split(',').map((s) => s.trim()).filter(Boolean);

const EMPTY = {
  name: '',
  email: '',
  domain: '',
  country: '',
  city: '',
  phone: '',
  address: '',
  website: '',
  accreditationCode: '',
  departments: '',
};

export default function UniversityProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    (async () => {
      try {
        const { profile } = await universityApi.getProfile();
        if (profile) {
          setForm({
            name: profile.name || '',
            email: profile.email || '',
            domain: profile.domain || '',
            country: profile.country || '',
            city: profile.city || '',
            phone: profile.phone || '',
            address: profile.address || '',
            website: profile.website || '',
            accreditationCode: profile.accreditationCode || '',
            departments: csv(profile.departments),
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
      await universityApi.updateProfile({ ...form, departments: toArr(form.departments) });
      setMessage({ type: 'success', text: 'University profile saved successfully.' });
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
        <h1 className="text-2xl font-semibold tracking-tight">University profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Maintain your institution&apos;s details and departments.
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
          <Input className="sm:col-span-2" label="University name" required value={form.name} onChange={set('name')} placeholder="Addis Ababa University" />
          <Input label="Contact email" type="email" value={form.email} onChange={set('email')} placeholder="coordinator@university.edu.et" />
          <Input label="Email domain" value={form.domain} onChange={set('domain')} placeholder="aau.edu.et" />
          <Input label="Country" value={form.country} onChange={set('country')} placeholder="Ethiopia" />
          <Input label="City" value={form.city} onChange={set('city')} placeholder="Addis Ababa" />
          <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+251 11 000 0000" />
          <Input label="Accreditation code" value={form.accreditationCode} onChange={set('accreditationCode')} placeholder="ET-AAU-001" />
          <Input className="sm:col-span-2" label="Address" value={form.address} onChange={set('address')} placeholder="Street, city" />
          <Input className="sm:col-span-2" label="Website" value={form.website} onChange={set('website')} placeholder="https://university.edu.et" />
          <Input className="sm:col-span-2" label="Departments" value={form.departments} onChange={set('departments')} hint="Comma-separated" placeholder="Computer Science, Software Engineering" />
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
