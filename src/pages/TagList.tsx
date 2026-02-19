import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTags } from '../api/client';
import type { Tag } from '../types';

export default function TagList() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTags()
      .then((res) => setTags(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Tags</h1>
        <Link
          to="/tags/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + New Tag
        </Link>
      </div>

      {tags.length === 0 ? (
        <p className="text-gray-500">No tags yet. Create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              to={`/tags/${tag.id}`}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                  {tag.name}
                </span>
                <span className="text-xs text-gray-500">
                  {tag.verses_count || 0} {tag.verses_count === 1 ? 'verse' : 'verses'}
                </span>
              </div>
              {tag.definition && (
                <p className="text-gray-600 text-sm">{tag.definition}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
