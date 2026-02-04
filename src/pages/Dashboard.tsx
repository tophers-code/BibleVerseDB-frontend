import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getVerses } from '../api/client';
import type { Category, Verse } from '../types';
import CategoryTag from '../components/CategoryTag';

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentVerses, setRecentVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCategories(), getVerses()])
      .then(([catRes, verseRes]) => {
        setCategories(catRes.data);
        // Sort by created_at descending (newest first) and take the first 5
        const sortedVerses = [...verseRes.data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecentVerses(sortedVerses.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Bible Verse Database</h1>
        <p className="mt-2 text-gray-600">
          Organize your Bible verses into theological categories
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/verses/new"
              className="block w-full px-4 py-3 bg-blue-600 text-white rounded-md text-center hover:bg-blue-700 transition-colors"
            >
              Add New Verse
            </Link>
            <Link
              to="/verses"
              className="block w-full px-4 py-3 bg-slate-600 text-white rounded-md text-center hover:bg-slate-700 transition-colors"
            >
              View All Verses
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link key={category.id} to={`/categories/${category.id}`}>
                <CategoryTag category={category} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Recent Verses</h2>
          <Link to="/verses" className="text-blue-600 hover:text-blue-800 text-sm">
            View all
          </Link>
        </div>
        {recentVerses.length === 0 ? (
          <p className="text-gray-500">No verses yet. Add your first verse!</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {recentVerses.map((verse) => (
              <li key={verse.id} className="py-3">
                <Link
                  to={`/verses/${verse.id}`}
                  className="font-medium text-slate-800 hover:text-blue-600"
                >
                  {verse.reference}
                </Link>
                <div className="mt-1 flex flex-wrap gap-1">
                  {verse.categories.map((cat) => (
                    <CategoryTag key={cat.id} category={cat} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
