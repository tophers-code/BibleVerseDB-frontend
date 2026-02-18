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
  const [showOnlyProminent, setShowOnlyProminent] = useState(false);

  // Helper to check if a verse is prominent for this category
  const isProminentForCategory = (verse: Verse) => {
    const cat = verse.categories.find((c) => c.id === parseInt(id || '0'));
    return cat?.prominent || false;
  };

  // Filter and sort verses - prominent first
  const displayedVerses = verses
    .filter((v) => !showOnlyProminent || isProminentForCategory(v))
    .sort((a, b) => {
      const aProminent = isProminentForCategory(a);
      const bProminent = isProminentForCategory(b);
      if (aProminent && !bProminent) return -1;
      if (!aProminent && bProminent) return 1;
      return 0;
    });

  const prominentCount = verses.filter(isProminentForCategory).length;

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
        {category.description && (
          <div className="mt-4">
            <h2 className="text-sm font-medium text-gray-700 mb-1">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{category.description}</p>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Verses</h2>
          {prominentCount > 0 && (
            <button
              onClick={() => setShowOnlyProminent(!showOnlyProminent)}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-colors ${
                showOnlyProminent
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {showOnlyProminent ? `Showing ${prominentCount} prominent` : `${prominentCount} prominent`}
            </button>
          )}
        </div>
        {verses.length === 0 ? (
          <p className="text-gray-500">No verses in this category yet.</p>
        ) : displayedVerses.length === 0 ? (
          <p className="text-gray-500">No prominent verses. <button onClick={() => setShowOnlyProminent(false)} className="text-blue-600 hover:underline">Show all verses</button></p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedVerses.map((verse) => (
              <div key={verse.id} className={isProminentForCategory(verse) ? 'ring-2 ring-yellow-400 rounded-lg' : ''}>
                <VerseCard verse={verse} />
              </div>
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
