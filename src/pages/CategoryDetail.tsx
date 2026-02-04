import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCategory, getVerses, deleteCategory } from '../api/client';
import type { Category, Verse } from '../types';
import CategoryTag from '../components/CategoryTag';
import VerseCard from '../components/VerseCard';

export default function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      Promise.all([
        getCategory(parseInt(id)),
        getVerses({ category_id: parseInt(id) }),
      ])
        .then(([catRes, verseRes]) => {
          setCategory(catRes.data);
          setVerses(verseRes.data);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const handleDelete = async () => {
    if (!category) return;

    if (verses.length > 0) {
      if (!window.confirm(`This category has ${verses.length} verse(s) associated with it. The verses will not be deleted, but they will no longer be in this category. Continue?`)) {
        return;
      }
    } else if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await deleteCategory(category.id);
      navigate('/categories');
    } catch (err) {
      const error = err as { response?: { data?: { errors?: string[] } } };
      setError(error.response?.data?.errors?.join(', ') || 'Failed to delete category');
    }
  };

  if (!category) {
    return <div className="text-center py-8">Category not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div>
            <CategoryTag category={category} />
            <h1 className="text-2xl font-bold text-slate-800 mt-2">{category.name}</h1>
            <p className="text-gray-600 mt-1">{category.meaning}</p>
            <p className="text-sm text-gray-500 mt-3">
              {verses.length} {verses.length === 1 ? 'verse' : 'verses'} in this category
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/categories/${category.id}/edit`}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Delete
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Verses</h2>
        {verses.length === 0 ? (
          <p className="text-gray-500">No verses in this category yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {verses.map((verse) => (
              <VerseCard key={verse.id} verse={verse} />
            ))}
          </div>
        )}
      </div>

      <Link to="/categories" className="text-blue-600 hover:text-blue-800">
        &larr; Back to categories
      </Link>
    </div>
  );
}
