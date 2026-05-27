import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTag, getVerses, deleteTag } from '../api/client';
import type { Tag, Verse } from '../types';
import VerseCard from '../components/VerseCard';
import Markdown from '../components/Markdown';
import { useAuth } from '../contexts/AuthContext';

export default function TagDetail() {
  const { isAdmin } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [tag, setTag] = useState<Tag | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      Promise.all([
        getTag(parseInt(id)),
        getVerses({ tag_id: parseInt(id) }),
      ])
        .then(([tagRes, verseRes]) => {
          setTag(tagRes.data);
          setVerses(verseRes.data);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const handleDelete = async () => {
    if (!tag) return;

    if (verses.length > 0) {
      if (!window.confirm(`This tag has ${verses.length} verse(s) associated with it. The verses will not be deleted, but they will no longer have this tag. Continue?`)) {
        return;
      }
    } else if (!window.confirm('Are you sure you want to delete this tag?')) {
      return;
    }

    try {
      await deleteTag(tag.id);
      navigate('/tags');
    } catch (err) {
      const error = err as { response?: { data?: { errors?: string[] } } };
      setError(error.response?.data?.errors?.join(', ') || 'Failed to delete tag');
    }
  };

  if (!tag) {
    return <div className="text-center py-8">Tag not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{tag.name}</h1>
            {tag.definition && (
              <p className="text-gray-600 mt-1">{tag.definition}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {verses.length} {verses.length === 1 ? 'verse' : 'verses'} with this tag
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Link
                to={`/tags/${tag.id}/edit`}
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
          )}
        </div>
        {tag.description && (
          <div className="mt-4">
            <h2 className="text-sm font-medium text-gray-700 mb-1">Description</h2>
            <Markdown>{tag.description}</Markdown>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Verses</h2>
        {verses.length === 0 ? (
          <p className="text-gray-500">No verses with this tag yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {verses.map((verse) => (
              <VerseCard
                key={verse.id}
                verse={verse}
                linkState={{
                  backPath: `/tags/${tag.id}`,
                  backLabel: tag.name,
                  verseIds: verses.map((v) => v.id),
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Link to="/tags" className="text-blue-600 hover:text-blue-800">
        &larr; Back to tags
      </Link>
    </div>
  );
}
