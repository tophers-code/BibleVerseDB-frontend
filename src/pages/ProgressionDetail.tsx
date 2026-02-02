import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProgression, deleteProgression, getVerseText, getVerse } from '../api/client';
import type { VerseProgression, Verse } from '../types';

const VERSIONS = [
  { id: 'en-bsb', name: 'Berean Study Bible' },
  { id: 'en-asv', name: 'American Standard Version' },
  { id: 'en-web', name: 'World English Bible' },
  { id: 'en-t4t', name: 'Translation for Translators' },
];

export default function ProgressionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [progression, setProgression] = useState<VerseProgression | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState('en-bsb');
  const [verseTexts, setVerseTexts] = useState<Record<number, string>>({});
  const [loadingTexts, setLoadingTexts] = useState(false);
  const [verseDetails, setVerseDetails] = useState<Record<number, Verse>>({});
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;

    getProgression(parseInt(id))
      .then((res) => setProgression(res.data))
      .catch(() => setError('Failed to load progression'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch verse texts when progression loads or version changes
  useEffect(() => {
    if (!progression || progression.steps.length === 0) return;

    const fetchTexts = async () => {
      setLoadingTexts(true);
      const texts: Record<number, string> = {};

      for (const step of progression.steps) {
        try {
          const res = await getVerseText(step.verse.id, selectedVersion);
          texts[step.verse.id] = res.data.text;
        } catch {
          texts[step.verse.id] = '';
        }
      }

      setVerseTexts(texts);
      setLoadingTexts(false);
    };

    fetchTexts();
  }, [progression, selectedVersion]);

  // Fetch verse details (notes, references) when progression loads
  useEffect(() => {
    if (!progression || progression.steps.length === 0) return;

    const fetchDetails = async () => {
      const details: Record<number, Verse> = {};

      for (const step of progression.steps) {
        try {
          const res = await getVerse(step.verse.id);
          details[step.verse.id] = res.data;
        } catch {
          // Skip if fetch fails
        }
      }

      setVerseDetails(details);
    };

    fetchDetails();
  }, [progression]);

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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Progression Steps ({progression.steps.length})
          </h2>
          {progression.steps.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Translation:</label>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VERSIONS.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

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
              {progression.steps.map((step, index) => {
                const details = verseDetails[step.verse.id];
                const hasNotes = details?.notes;
                const hasReferences = details?.referenced_verses && details.referenced_verses.length > 0;
                const hasTooltipContent = hasNotes || hasReferences;

                return (
                <div key={step.id} className="relative flex items-start gap-4">
                  {/* Step number circle with tooltip */}
                  <div
                    className="relative z-10"
                    onMouseEnter={() => setHoveredStep(step.verse.id)}
                    onMouseLeave={() => setHoveredStep(null)}
                  >
                    <div className={`w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full text-sm font-medium shrink-0 ${hasTooltipContent ? 'cursor-help ring-2 ring-blue-300' : ''}`}>
                      {index + 1}
                    </div>

                    {/* Tooltip */}
                    {hoveredStep === step.verse.id && hasTooltipContent && (
                      <div className="absolute left-10 top-0 z-20 w-64 bg-slate-800 text-white text-sm rounded-lg shadow-lg p-3">
                        {/* Arrow */}
                        <div className="absolute left-0 top-3 -translate-x-full border-8 border-transparent border-r-slate-800" />

                        {hasNotes && (
                          <div className="mb-2">
                            <p className="text-blue-300 font-medium text-xs uppercase mb-1">Notes</p>
                            <p className="text-gray-200">{details.notes}</p>
                          </div>
                        )}

                        {hasReferences && (
                          <div>
                            <p className="text-blue-300 font-medium text-xs uppercase mb-1">Cross-References</p>
                            <ul className="space-y-1">
                              {details.referenced_verses?.map((ref) => (
                                <li key={ref.id} className="text-gray-200">
                                  {ref.reference}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <Link
                      to={`/verses/${step.verse.id}`}
                      className="text-lg font-medium text-blue-600 hover:text-blue-800"
                    >
                      {step.verse.reference}
                    </Link>

                    {/* Verse text */}
                    <div className="mt-2">
                      {loadingTexts ? (
                        <p className="text-gray-400 text-sm italic">Loading...</p>
                      ) : verseTexts[step.verse.id] ? (
                        <p className="text-gray-700 italic leading-relaxed">
                          "{verseTexts[step.verse.id]}"
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm">No text available</p>
                      )}
                    </div>

                    {/* Arrow indicator for flow */}
                    {index < progression.steps.length - 1 && (
                      <div className="mt-3 text-gray-400 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        <span>flows to</span>
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
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
