import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getProgression,
  createProgression,
  updateProgression,
  getVerses,
  addProgressionStep,
  removeProgressionStep,
  updateProgressionStep,
} from '../api/client';
import type { Verse, VerseProgression, ProgressionStep } from '../types';

export default function ProgressionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<ProgressionStep[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [selectedVerseId, setSelectedVerseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressionId, setProgressionId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const versesRes = await getVerses();
        setVerses(versesRes.data);

        if (isEdit && id) {
          const progressionRes = await getProgression(parseInt(id));
          const progression = progressionRes.data;
          setName(progression.name);
          setDescription(progression.description || '');
          setSteps(progression.steps);
          setProgressionId(progression.id);
        }
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEdit && id) {
        await updateProgression(parseInt(id), { name, description: description || undefined });
        navigate(`/progressions/${id}`);
      } else {
        const res = await createProgression({ name, description: description || undefined });
        // Navigate to detail page to add steps
        navigate(`/progressions/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.join(', ') || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = async () => {
    if (!selectedVerseId || !progressionId) return;

    try {
      const nextOrder = steps.length + 1;
      const res = await addProgressionStep(progressionId, parseInt(selectedVerseId), nextOrder);
      setSteps([...steps, res.data]);
      setSelectedVerseId('');
    } catch (err: any) {
      setError(err.response?.data?.errors?.join(', ') || 'Failed to add step');
    }
  };

  const handleRemoveStep = async (stepId: number) => {
    if (!progressionId) return;

    try {
      await removeProgressionStep(progressionId, stepId);
      const remainingSteps = steps.filter((s) => s.id !== stepId);
      // Reorder remaining steps
      for (let i = 0; i < remainingSteps.length; i++) {
        if (remainingSteps[i].step_order !== i + 1) {
          await updateProgressionStep(progressionId, remainingSteps[i].id, i + 1);
          remainingSteps[i] = { ...remainingSteps[i], step_order: i + 1 };
        }
      }
      setSteps(remainingSteps);
    } catch (err: any) {
      setError(err.response?.data?.errors?.join(', ') || 'Failed to remove step');
    }
  };

  const handleMoveStep = async (stepIndex: number, direction: 'up' | 'down') => {
    if (!progressionId) return;

    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    try {
      const newSteps = [...steps];
      const [movedStep] = newSteps.splice(stepIndex, 1);
      newSteps.splice(newIndex, 0, movedStep);

      // Update orders in backend
      for (let i = 0; i < newSteps.length; i++) {
        if (newSteps[i].step_order !== i + 1) {
          await updateProgressionStep(progressionId, newSteps[i].id, i + 1);
          newSteps[i] = { ...newSteps[i], step_order: i + 1 };
        }
      }

      setSteps(newSteps);
    } catch (err: any) {
      setError(err.response?.data?.errors?.join(', ') || 'Failed to reorder steps');
    }
  };

  // Get verses that aren't already in the progression
  const availableVerses = verses.filter(
    (v) => !steps.some((s) => s.verse.id === v.id)
  );

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        {isEdit ? 'Edit Progression' : 'Create Progression'}
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., The Gospel Progression"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the theme or purpose of this progression..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isEdit && progressionId && (
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Progression Steps
            </h2>

            {steps.length > 0 ? (
              <div className="space-y-2 mb-4">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-md"
                  >
                    <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="flex-1 font-medium">{step.verse.reference}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveStep(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        title="Move up"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(index, 'down')}
                        disabled={index === steps.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        title="Move down"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(step.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Remove step"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-4">
                No steps yet. Add verses below to build your progression.
              </p>
            )}

            <div className="flex gap-2">
              <select
                value={selectedVerseId}
                onChange={(e) => setSelectedVerseId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a verse to add...</option>
                {availableVerses.map((verse) => (
                  <option key={verse.id} value={verse.id}>
                    {verse.reference}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddStep}
                disabled={!selectedVerseId}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Add Step
              </button>
            </div>

            {availableVerses.length === 0 && verses.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                All verses are already in this progression.
              </p>
            )}

            {verses.length === 0 && (
              <p className="text-sm text-amber-600 mt-2">
                No verses in database. <a href="/verses/new" className="underline">Add some verses</a> first.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Progression' : 'Create Progression'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
