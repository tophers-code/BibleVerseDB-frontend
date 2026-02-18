import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCategory, createCategory, updateCategory } from '../api/client';
import { categoryColors, type ColorCode } from '../types';

const COLOR_OPTIONS: { id: ColorCode; name: string }[] = [
  { id: 'yellow', name: 'Yellow' },
  { id: 'purple', name: 'Purple' },
  { id: 'orange', name: 'Orange' },
  { id: 'blue', name: 'Blue' },
  { id: 'teal', name: 'Teal' },
  { id: 'pink', name: 'Pink' },
  { id: 'pink-black', name: 'Dark Pink' },
  { id: 'red-black', name: 'Dark Red' },
  { id: 'black', name: 'Black' },
  { id: 'red', name: 'Red' },
  { id: 'green', name: 'Green' },
  { id: 'light-green', name: 'Light Green' },
  { id: 'brown', name: 'Brown' },
  { id: 'light-orange', name: 'Light Orange' },
];

export default function CategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [meaning, setMeaning] = useState('');
  const [description, setDescription] = useState('');
  const [colorCode, setColorCode] = useState<ColorCode>('blue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  useEffect(() => {
    if (id) {
      getCategory(parseInt(id))
        .then((res) => {
          setName(res.data.name);
          setMeaning(res.data.meaning);
          setDescription(res.data.description || '');
          setColorCode(res.data.color_code as ColorCode);
        })
        .catch(() => setError('Failed to load category'))
        .finally(() => setInitialLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing && id) {
        await updateCategory(parseInt(id), { name, meaning, description, color_code: colorCode });
        navigate(`/categories/${id}`);
      } else {
        const res = await createCategory({ name, meaning, description, color_code: colorCode });
        navigate(`/categories/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.join(', ') || 'Failed to save category');
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        {isEditing ? 'Edit Category' : 'New Category'}
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
            placeholder="e.g., Ouranology"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meaning
          </label>
          <input
            type="text"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            required
            placeholder="e.g., Study of Heaven"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setColorCode(color.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  colorCode === color.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-transparent hover:border-gray-300'
                }`}
                title={color.name}
              >
                <div className={`w-full h-6 rounded ${categoryColors[color.id].split(' ')[0]}`} />
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Selected: <span className={`px-2 py-0.5 rounded ${categoryColors[colorCode]}`}>{name || 'Preview'}</span>
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
          </button>
          <Link
            to={isEditing ? `/categories/${id}` : '/categories'}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
