import { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { PortalUser } from '../types';

interface CreateForm {
  email: string;
  password: string;
  role: 'admin' | 'user';
}

interface EditState {
  id: number;
  role: 'admin' | 'user';
  password: string;
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<CreateForm>({ email: '', password: '', role: 'user' });

  useEffect(() => {
    getUsers()
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const res = await createUser(form);
      setUsers((prev) => [...prev, res.data].sort((a, b) => a.email.localeCompare(b.email)));
      setForm({ email: '', password: '', role: 'user' });
      setShowCreateForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: string[] } } })?.response?.data?.errors?.join(', ');
      setCreateError(msg || 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editState) return;
    setEditError(null);
    const payload: { role: 'admin' | 'user'; password?: string } = { role: editState.role };
    if (editState.password.trim()) payload.password = editState.password;
    try {
      const res = await updateUser(editState.id, payload);
      setUsers((prev) => prev.map((u) => (u.id === editState.id ? res.data : u)));
      setEditState(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: string[] } } })?.response?.data?.errors?.join(', ');
      setEditError(msg || 'Failed to update user.');
    }
  };

  const handleDelete = async (u: PortalUser) => {
    if (!window.confirm(`Delete ${u.email}? This cannot be undone.`)) return;
    try {
      await deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg || 'Failed to delete user.');
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <button
          onClick={() => { setShowCreateForm((v) => !v); setCreateError(null); }}
          className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">New User</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputCls}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={inputCls}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as 'admin' | 'user' }))}
                className={inputCls}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {createError && <p className="text-sm text-red-600">{createError}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User list */}
      <div className="bg-white rounded-lg shadow-md divide-y divide-gray-100">
        {users.length === 0 && (
          <p className="text-center py-8 text-gray-500">No users found.</p>
        )}
        {users.map((u) => (
          <div key={u.id}>
            {editState?.id === u.id ? (
              <form onSubmit={handleEdit} className="p-4 space-y-3">
                <p className="text-sm font-medium text-slate-800">{u.email}</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                    <select
                      value={editState.role}
                      onChange={(e) => setEditState((s) => s && ({ ...s, role: e.target.value as 'admin' | 'user' }))}
                      className={inputCls}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">New Password <span className="text-gray-400">(leave blank to keep)</span></label>
                    <input
                      type="password"
                      minLength={8}
                      value={editState.password}
                      onChange={(e) => setEditState((s) => s && ({ ...s, password: e.target.value }))}
                      className={inputCls}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                {editError && <p className="text-sm text-red-600">{editError}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setEditState(null); setEditError(null); }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {u.email}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-gray-400">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {u.role === 'admin' ? (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Admin</span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">User</span>
                    )}
                    <span className="ml-2">Joined {new Date(u.created_at).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditState({ id: u.id, role: u.role, password: '' }); setEditError(null); }}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:text-slate-800 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={u.id === currentUser?.id}
                    className="px-3 py-1.5 text-xs text-red-600 hover:text-red-800 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
