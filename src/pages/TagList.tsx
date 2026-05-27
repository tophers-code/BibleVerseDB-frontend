import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTags } from '../api/client';
import type { Tag } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function TagList() {
  const { isAdmin } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTags()
      .then((res) => setTags(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? tags.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.definition?.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
      )
    : tags;

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Tags</h1>
        {isAdmin && (
          <Link
            to="/tags/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + New Tag
          </Link>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tags..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg
          className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">
          {search ? `No tags match "${search}".` : 'No tags yet. Create one to get started.'}
        </p>
      ) : (
        <>
          {search && (
            <p className="text-sm text-gray-500">{filtered.length} of {tags.length} tags</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tag) => (
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
        </>
      )}
    </div>
  );
}
