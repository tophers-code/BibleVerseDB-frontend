import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCategory, getVerses } from '../api/client';
import type { Category, Verse } from '../types';
import CategoryTag from '../components/CategoryTag';
import VerseCard from '../components/VerseCard';

export default function CategoryDetail() {
  const { id } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (!category) {
    return <div className="text-center py-8">Category not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <CategoryTag category={category} />
        <h1 className="text-2xl font-bold text-slate-800 mt-2">{category.name}</h1>
        <p className="text-gray-600 mt-1">Study of {category.meaning}</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
          Verses in this Category ({verses.length})
        </h2>
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
