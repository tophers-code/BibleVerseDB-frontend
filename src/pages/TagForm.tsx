import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTag, createTag, updateTag } from '../api/client';

export default function TagForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [definition, setDefinition] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  useEffect(() => {
    if (id) {
      getTag(parseInt(id))
        .then((res) => {
          setName(res.data.name);
          setDefinition(res.data.definition || '');
          setDescription(res.data.description || '');
        })
        .catch(() => setError('Failed to load tag'))
        .finally(() => setInitialLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing && id) {
        await updateTag(parseInt(id), { name, definition, description });
        navigate(`/tags/${id}`);
      } else {
        const res = await createTag({ name, definition, description });
        navigate(`/tags/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.join(', ') || 'Failed to save tag');
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        {isEditing ? 'Edit Tag' : 'New Tag'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., atonement"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Definition
          </label>
          <input
            type="text"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="e.g., The reconciliation of God and humankind through Christ"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
            <span className="ml-2 text-xs font-normal text-gray-400">Supports Markdown</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Long-form doctrinal description..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Tag' : 'Create Tag'}
          </button>
          <Link
            to={isEditing ? `/tags/${id}` : '/tags'}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
