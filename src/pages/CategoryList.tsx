import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../api/client';
import type { Category } from '../types';
import CategoryTag from '../components/CategoryTag';

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Theological Categories</h1>
        <Link
          to="/categories/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + New Category
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/categories/${category.id}`}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <CategoryTag category={category} />
              <span className="text-xs text-gray-500">
                {category.verses_count || 0} {category.verses_count === 1 ? 'verse' : 'verses'}
              </span>
            </div>
            <p className="text-gray-600 text-sm">{category.meaning}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
