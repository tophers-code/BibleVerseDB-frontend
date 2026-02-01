import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getVerse, deleteVerse } from '../api/client';
import type { Verse } from '../types';
import CategoryTag from '../components/CategoryTag';

export default function VerseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getVerse(parseInt(id))
        .then((res) => setVerse(res.data))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleDelete = async () => {
    if (verse && window.confirm('Are you sure you want to delete this verse?')) {
      await deleteVerse(verse.id);
      navigate('/verses');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!verse) {
    return <div className="text-center py-8">Verse not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-slate-800">{verse.reference}</h1>
          <div className="flex gap-2">
            <Link
              to={`/verses/${verse.id}/edit`}
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

        <div className="mb-4">
          <span className="text-sm text-gray-500">
            {verse.bible_book.testament === 'old_testament' ? 'Old Testament' : 'New Testament'}
          </span>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {verse.categories.length > 0 ? (
              verse.categories.map((category) => (
                <Link key={category.id} to={`/categories/${category.id}`}>
                  <CategoryTag category={category} />
                </Link>
              ))
            ) : (
              <span className="text-gray-500 text-sm">No categories assigned</span>
            )}
          </div>
        </div>

        {verse.notes && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Notes</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{verse.notes}</p>
          </div>
        )}

        {verse.referenced_verses && verse.referenced_verses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-2">References</h2>
            <ul className="space-y-1">
              {verse.referenced_verses.map((ref) => (
                <li key={ref.id}>
                  <Link
                    to={`/verses/${ref.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {ref.reference}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {verse.referencing_verses && verse.referencing_verses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Referenced By</h2>
            <ul className="space-y-1">
              {verse.referencing_verses.map((ref) => (
                <li key={ref.id}>
                  <Link
                    to={`/verses/${ref.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {ref.reference}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <Link to="/verses" className="text-blue-600 hover:text-blue-800">
            &larr; Back to all verses
          </Link>
        </div>
      </div>
    </div>
  );
}
