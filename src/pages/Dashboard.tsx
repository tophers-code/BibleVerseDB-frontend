import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getVerses, getTags, getProgressions } from '../api/client';
import type { Category, Verse } from '../types';
import CategoryTag from '../components/CategoryTag';

const colorCodeToHex: Record<string, string> = {
  'yellow': '#f59e0b',
  'purple': '#8b5cf6',
  'orange': '#f97316',
  'blue': '#3b82f6',
  'teal': '#14b8a6',
  'pink': '#ec4899',
  'pink-black': '#831843',
  'red-black': '#7f1d1d',
  'black': '#1f2937',
  'red': '#ef4444',
  'green': '#22c55e',
  'light-green': '#86efac',
  'brown': '#92400e',
  'light-orange': '#fdba74',
  'light-red': '#fca5a5',
};

function PieChart({ categories }: { categories: Category[] }) {
  const data = categories
    .filter((c) => (c.verses_count || 0) > 0)
    .sort((a, b) => (b.verses_count || 0) - (a.verses_count || 0));

  const total = data.reduce((sum, c) => sum + (c.verses_count || 0), 0);

  if (total === 0) {
    return <p className="text-gray-500 text-sm">No verses yet.</p>;
  }

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 80;

  let cumulativeAngle = -Math.PI / 2; // start at top
  const slices = data.map((cat) => {
    const fraction = (cat.verses_count || 0) / total;
    const startAngle = cumulativeAngle;
    const sliceAngle = fraction * 2 * Math.PI;
    cumulativeAngle += sliceAngle;
    const endAngle = cumulativeAngle;
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const d =
      data.length === 1
        ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy - radius} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const fill = colorCodeToHex[cat.color_code] || '#6b7280';

    return { cat, d, fill, fraction };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map(({ cat, d, fill }) => (
          <path key={cat.id} d={d} fill={fill} stroke="white" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
        {slices.map(({ cat, fill }) => (
          <div key={cat.id} className="flex items-center gap-1.5 text-xs text-gray-700">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: fill }}
            />
            <span>{cat.name}</span>
            <span className="text-gray-400">({cat.verses_count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentVerses, setRecentVerses] = useState<Verse[]>([]);
  const [stats, setStats] = useState({ verses: 0, tags: 0, progressions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCategories(), getVerses(), getTags(), getProgressions()])
      .then(([catRes, verseRes, tagRes, progRes]) => {
        setCategories(catRes.data);
        setStats({
          verses: verseRes.data.length,
          tags: tagRes.data.length,
          progressions: progRes.data.length,
        });
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

      <div className="bg-white rounded-lg shadow-md">
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {[
            { label: 'Verses', value: stats.verses, to: '/verses' },
            { label: 'Tags', value: stats.tags, to: '/tags' },
            { label: 'Progressions', value: stats.progressions, to: '/progressions' },
          ].map(({ label, value, to }) => (
            <Link key={label} to={to} className="flex flex-col items-center py-6 hover:bg-gray-50 transition-colors rounded-lg">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
              <span className="text-4xl font-bold text-slate-800 mt-1">{value}</span>
            </Link>
          ))}
        </div>
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
            <Link
              to="/progressions/new"
              className="block w-full px-4 py-3 bg-teal-600 text-white rounded-md text-center hover:bg-teal-700 transition-colors"
            >
              Add a Progression
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Categories</h2>
          <PieChart categories={categories} />
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
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
                  {verse.tags?.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs"
                    >
                      {tag.name}
                    </span>
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
