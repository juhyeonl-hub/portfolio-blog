import { useState } from 'react';
import { api } from '../../services/api';

export default function AdminSettingsPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    try {
      const result = await api.put('/admin/account/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMessage(result.message);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md">
        <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Current Password</label>
            <input type="password" value={form.currentPassword}
              onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))} required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">New Password</label>
            <input type="password" value={form.newPassword}
              onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))} required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
            <input type="password" value={form.confirmPassword}
              onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {message && <p className="text-green-400 text-sm">{message}</p>}
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
