import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProgression, deleteProgression } from '../api/client';
import type { VerseProgression } from '../types';

export default function ProgressionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [progression, setProgression] = useState<VerseProgression | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    getProgression(parseInt(id))
      .then((res) => setProgression(res.data))
      .catch(() => setError('Failed to load progression'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!progression) return;
    if (!window.confirm('Are you sure you want to delete this progression?')) return;

    try {
      await deleteProgression(progression.id);
      navigate('/progressions');
    } catch (err) {
      setError('Failed to delete progression');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error || !progression) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || 'Progression not found'}</p>
        <Link to="/progressions" className="text-blue-600 hover:underline">
          Back to Progressions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{progression.name}</h1>
          {progression.description && (
            <p className="text-gray-600 mt-2">{progression.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            to={`/progressions/${progression.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Progression Steps ({progression.steps.length})
        </h2>

        {progression.steps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No steps in this progression yet.</p>
            <Link
              to={`/progressions/${progression.id}/edit`}
              className="text-blue-600 hover:underline"
            >
              Add verses to this progression
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line connecting steps */}
            <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-blue-200" />

            <div className="space-y-4">
              {progression.steps.map((step, index) => (
                <div key={step.id} className="relative flex items-start gap-4">
                  {/* Step number circle */}
                  <div className="relative z-10 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full text-sm font-medium shrink-0">
                    {index + 1}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <Link
                      to={`/verses/${step.verse.id}`}
                      className="text-lg font-medium text-blue-600 hover:text-blue-800"
                    >
                      {step.verse.reference}
                    </Link>

                    {/* Arrow indicator for flow */}
                    {index < progression.steps.length - 1 && (
                      <div className="mt-2 text-gray-400 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        <span>flows to</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link
          to="/progressions"
          className="text-blue-600 hover:underline"
        >
          &larr; Back to All Progressions
        </Link>
      </div>
    </div>
  );
}
