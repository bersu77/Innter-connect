import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { accountApi } from '../../api/account';
import { Button, Card, Input } from '../../components/ui';

export default function AccountPage() {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setMessage(null);

    const payload = {};
    if (username && username.toLowerCase() !== (user?.username || '')) {
      payload.username = username;
    }
    if (newPassword) {
      if (newPassword !== confirm) {
        setMessage({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }
    if (Object.keys(payload).length === 0) {
      setMessage({ type: 'error', text: 'Nothing to update.' });
      return;
    }

    setSaving(true);
    try {
      await accountApi.updateCredentials(payload);
      setMessage({
        type: 'success',
        text: 'Account updated. Use your new credentials the next time you log in.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not update account.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Change the username and password you use to sign in.
        </p>
      </div>

      <Card className="p-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">Name</dt>
            <dd className="font-medium text-slate-800">
              {user?.firstName} {user?.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Email</dt>
            <dd className="font-medium text-slate-800">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Current username</dt>
            <dd className="font-medium text-slate-800">{user?.username || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Role</dt>
            <dd className="font-medium capitalize text-slate-800">
              {(user?.roles || []).includes('supervisor') ? 'supervisor' : user?.userType}
            </dd>
          </div>
        </dl>
      </Card>

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
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your-username"
            hint="Used to sign in. Lowercase, no spaces."
          />
          <div className="border-t border-slate-100 pt-4">
            <h2 className="text-sm font-semibold text-slate-800">Change password</h2>
            <p className="mt-0.5 text-xs text-slate-400">Leave blank to keep your current password.</p>
            <div className="mt-3 space-y-4">
              <Input
                label="Current password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <Input
                label="Confirm new password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
          </div>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
