import { useEffect, useState, useCallback, useMemo } from 'react';
import { getVerses, getCategories, getVerseTexts } from '../api/client';
import type { Verse, Category } from '../types';

type QuizMode = 1 | 2 | 3 | 4;

interface Mode1Question {
  type: 1;
  category: Category;
  options: Verse[];
  correctVerseId: number;
}

interface Mode2Question {
  type: 2;
  verse: Verse;
  text: string;
}

interface Mode3Question {
  type: 3;
  verse: Verse;
  correctCategoryIds: number[];
}

type QuizQuestion = Mode1Question | Mode2Question | Mode3Question;

// --- Mode 4 (Flashcards) — self-contained component ---
function Mode4View({ verses }: { verses: Verse[] }) {
  const [deck] = useState<Verse[]>(() => shuffle(verses));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  const verse = deck[index];

  useEffect(() => {
    setText(null);
    setLoadingText(true);
    getVerseTexts(verse.id)
      .then((res) => {
        const texts = res.data.texts || [];
        const withText = texts.find((t: { text?: string }) => t.text);
        setText(withText?.text ?? null);
      })
      .catch(() => setText(null))
      .finally(() => setLoadingText(false));
  }, [verse.id]);

  const go = (delta: number) => {
    setFlipped(false);
    setTimeout(() => setIndex((i) => Math.min(Math.max(i + delta, 0), deck.length - 1)), 200);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
        <span>{index + 1} / {deck.length}</span>
        <span className="text-xs text-gray-400">Click card to flip</span>
      </div>

      {/* Flip card */}
      <div
        className="cursor-pointer select-none"
        style={{ perspective: '1200px', height: '320px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s ease',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Front — reference */}
          <div
            style={{ backfaceVisibility: 'hidden' }}
            className="absolute inset-0 bg-slate-50 border-2 border-slate-200 rounded-xl flex flex-col items-center justify-center p-6"
          >
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Verse Reference</p>
            <p className="text-3xl font-bold text-slate-800 text-center">{verse.reference}</p>
            <p className="text-sm text-gray-400 mt-4">
              {verse.bible_book.testament === 'old_testament' ? 'Old Testament' : 'New Testament'}
            </p>
          </div>

          {/* Back — details */}
          <div
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 bg-white border-2 border-blue-200 rounded-xl flex flex-col p-5 overflow-y-auto"
          >
            <p className="text-sm font-bold text-slate-800 mb-3">{verse.reference}</p>

            {loadingText ? (
              <p className="text-xs text-gray-400 italic mb-3">Loading text...</p>
            ) : text ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex-shrink-0">
                <p className="text-sm text-gray-800 leading-relaxed italic">"{text}"</p>
              </div>
            ) : null}

            {verse.notes && (
              <p className="text-sm text-gray-600 mb-3">{verse.notes}</p>
            )}

            {verse.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {verse.categories.map((cat) => (
                  <span key={cat.id} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            {verse.tags && verse.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {verse.tags.map((tag) => (
                  <span key={tag.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => go(1)}
          disabled={index === deck.length - 1}
          className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Mode 1 sub-component ---
function Mode1View({ question, selectedVerseId, onSelect, answered }: {
  question: Mode1Question;
  selectedVerseId: number | null;
  onSelect: (id: number) => void;
  answered: boolean;
}) {
  return (
    <div>
      <div className="mb-6 p-4 bg-slate-50 rounded-lg text-center">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Category</p>
        <p className="text-2xl font-bold text-slate-800">{question.category.name}</p>
        {question.category.meaning && (
          <p className="text-sm text-gray-500 mt-1">{question.category.meaning}</p>
        )}
      </div>
      <p className="text-sm font-medium text-gray-700 mb-3">Which verse belongs to this category?</p>
      <div className="space-y-2">
        {question.options.map((verse) => {
          const isSelected = selectedVerseId === verse.id;
          const isCorrect = verse.id === question.correctVerseId;
          let cls = 'w-full text-left px-4 py-3 rounded-md border text-sm transition-colors ';
          if (answered) {
            if (isCorrect) cls += 'bg-green-100 border-green-400 text-green-800 font-medium';
            else if (isSelected) cls += 'bg-red-100 border-red-400 text-red-800';
            else cls += 'bg-gray-50 border-gray-200 text-gray-400';
          } else {
            cls += isSelected
              ? 'bg-blue-50 border-blue-400 text-blue-800'
              : 'bg-white border-gray-200 hover:bg-gray-50 text-slate-700 cursor-pointer';
          }
          return (
            <div key={verse.id}>
              <button onClick={() => !answered && onSelect(verse.id)} disabled={answered} className={cls}>
                {verse.reference}
              </button>
              {answered && isCorrect && verse.notes && (
                <p className="mt-1 mb-2 px-4 text-xs text-green-700 italic">{verse.notes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Mode 2 sub-component ---
function Mode2View({ question, selectedBook, setSelectedBook, selectedChapter, setSelectedChapter, selectedVerse, setSelectedVerse, bookOptions, chapterOptions, verseOptions, answered }: {
  question: Mode2Question;
  selectedBook: string;
  setSelectedBook: (v: string) => void;
  selectedChapter: string;
  setSelectedChapter: (v: string) => void;
  selectedVerse: string;
  setSelectedVerse: (v: string) => void;
  bookOptions: string[];
  chapterOptions: number[];
  verseOptions: number[];
  answered: boolean;
}) {
  const selectCls = 'px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400';
  return (
    <div>
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-gray-800 leading-relaxed italic text-center">"{question.text}"</p>
      </div>
      <p className="text-sm font-medium text-gray-700 mb-3">Which verse is this? Select the book, chapter, and starting verse.</p>
      <div className="flex gap-3">
        <select value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)} disabled={answered} className={`flex-1 ${selectCls}`}>
          <option value="">Book...</option>
          {bookOptions.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={selectedChapter} onChange={(e) => setSelectedChapter(e.target.value)} disabled={answered || !selectedBook} className={`w-24 ${selectCls}`}>
          <option value="">Ch...</option>
          {chapterOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={selectedVerse} onChange={(e) => setSelectedVerse(e.target.value)} disabled={answered || !selectedChapter} className={`w-24 ${selectCls}`}>
          <option value="">Vs...</option>
          {verseOptions.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      {answered && (
        <div className="mt-3 p-3 bg-slate-50 rounded-md text-sm">
          <span className="font-medium text-slate-700">Correct answer: </span>
          <span className="text-slate-800">{question.verse.reference}</span>
        </div>
      )}
    </div>
  );
}

// --- Mode 3 sub-component ---
function Mode3View({ question, allCategories, selectedCategoryIds, setSelectedCategoryIds, answered }: {
  question: Mode3Question;
  allCategories: Category[];
  selectedCategoryIds: Set<number>;
  setSelectedCategoryIds: (ids: Set<number>) => void;
  answered: boolean;
}) {
  const correctSet = new Set(question.correctCategoryIds);

  const toggle = (id: number) => {
    if (answered) return;
    const next = new Set(selectedCategoryIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCategoryIds(next);
  };

  return (
    <div>
      <div className="mb-6 p-4 bg-slate-50 rounded-lg text-center">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Verse</p>
        <p className="text-2xl font-bold text-slate-800">{question.verse.reference}</p>
        {question.verse.notes && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{question.verse.notes}</p>
        )}
      </div>
      <p className="text-sm font-medium text-gray-700 mb-3">Select all categories this verse belongs to:</p>
      <div className="grid grid-cols-2 gap-2">
        {allCategories.map((cat) => {
          const isSelected = selectedCategoryIds.has(cat.id);
          const isCorrect = correctSet.has(cat.id);
          let cls = 'flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors text-left ';
          if (answered) {
            if (isCorrect && isSelected) cls += 'bg-green-100 border-green-400 text-green-800';
            else if (isCorrect && !isSelected) cls += 'bg-yellow-100 border-yellow-400 text-yellow-800';
            else if (!isCorrect && isSelected) cls += 'bg-red-100 border-red-400 text-red-800';
            else cls += 'bg-gray-50 border-gray-200 text-gray-400';
          } else {
            cls += isSelected
              ? 'bg-blue-50 border-blue-400 text-blue-800 cursor-pointer'
              : 'bg-white border-gray-200 hover:bg-gray-50 text-slate-700 cursor-pointer';
          }
          return (
            <button key={cat.id} onClick={() => toggle(cat.id)} disabled={answered} className={cls}>
              <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {cat.name}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className="mt-3 text-xs text-gray-400">
          Green = correct · Yellow = missed · Red = incorrect selection
        </p>
      )}
    </div>
  );
}

// --- Main Quiz component ---
export default function Quiz() {
  const [mode, setMode] = useState<QuizMode>(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [generating, setGenerating] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Mode 1
  const [selectedVerseId, setSelectedVerseId] = useState<number | null>(null);
  // Mode 2
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedVerse, setSelectedVerse] = useState('');
  // Mode 3
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all([getVerses(), getCategories()])
      .then(([versesRes, catsRes]) => {
        setVerses(versesRes.data);
        setAllCategories(catsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Mode 2 dropdown options derived from loaded verses
  const bookOptions = useMemo(() =>
    [...new Set(verses.map((v) => v.bible_book.name))].sort(),
    [verses]
  );
  const chapterOptions = useMemo(() =>
    selectedBook
      ? [...new Set(verses.filter((v) => v.bible_book.name === selectedBook).map((v) => v.chapter))].sort((a, b) => a - b)
      : [],
    [verses, selectedBook]
  );
  const verseOptions = useMemo(() =>
    selectedBook && selectedChapter
      ? [...new Set(verses.filter((v) => v.bible_book.name === selectedBook && v.chapter === parseInt(selectedChapter)).map((v) => v.verse_start))].sort((a, b) => a - b)
      : [],
    [verses, selectedBook, selectedChapter]
  );

  const resetAnswerState = () => {
    setAnswered(false);
    setIsCorrect(false);
    setSelectedVerseId(null);
    setSelectedBook('');
    setSelectedChapter('');
    setSelectedVerse('');
    setSelectedCategoryIds(new Set());
  };

  const generateMode1 = useCallback((): Mode1Question | null => {
    const catMap = new Map<number, { cat: Category; verses: Verse[] }>();
    verses.forEach((v) => {
      v.categories.forEach((c) => {
        if (!catMap.has(c.id)) catMap.set(c.id, { cat: c, verses: [] });
        catMap.get(c.id)!.verses.push(v);
      });
    });
    const valid = Array.from(catMap.values()).filter((e) => e.verses.length >= 1);
    if (valid.length === 0 || verses.length < 4) return null;

    const entry = pickRandom(valid);
    const correct = pickRandom(entry.verses);
    const distractors = shuffle(
      verses.filter((v) => !v.categories.some((c) => c.id === entry.cat.id))
    ).slice(0, 3);
    if (distractors.length < 3) return null;

    return {
      type: 1,
      category: entry.cat,
      options: shuffle([correct, ...distractors]),
      correctVerseId: correct.id,
    };
  }, [verses]);

  const generateMode2 = useCallback(async (): Promise<Mode2Question | null> => {
    for (const verse of shuffle(verses).slice(0, 15)) {
      try {
        const res = await getVerseTexts(verse.id);
        const texts = res.data.texts || [];
        const withText = texts.find((t: { text?: string }) => t.text);
        if (withText) return { type: 2, verse, text: withText.text };
      } catch {
        // try next verse
      }
    }
    return null;
  }, [verses]);

  const generateMode3 = useCallback((): Mode3Question | null => {
    const withCats = verses.filter((v) => v.categories.length > 0);
    if (withCats.length === 0) return null;
    const verse = pickRandom(withCats);
    return { type: 3, verse, correctCategoryIds: verse.categories.map((c) => c.id) };
  }, [verses]);

  const nextQuestion = useCallback(async () => {
    setGenerating(true);
    resetAnswerState();
    let q: QuizQuestion | null = null;
    if (mode === 1) q = generateMode1();
    else if (mode === 2) q = await generateMode2();
    else q = generateMode3();
    setQuestion(q);
    setGenerating(false);
  }, [mode, generateMode1, generateMode2, generateMode3]);

  useEffect(() => {
    if (!loading && verses.length > 0) nextQuestion();
  }, [loading, mode]);

  const submitAnswer = () => {
    if (!question) return;
    let correct = false;

    if (question.type === 1) {
      correct = selectedVerseId === question.correctVerseId;
    } else if (question.type === 2) {
      correct =
        selectedBook === question.verse.bible_book.name &&
        parseInt(selectedChapter) === question.verse.chapter &&
        parseInt(selectedVerse) === question.verse.verse_start;
    } else if (question.type === 3) {
      const correctSet = new Set(question.correctCategoryIds);
      correct =
        selectedCategoryIds.size === correctSet.size &&
        Array.from(selectedCategoryIds).every((id) => correctSet.has(id));
    }

    setIsCorrect(correct);
    setAnswered(true);
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  };

  const canSubmit =
    !answered &&
    question !== null &&
    (question.type === 1
      ? selectedVerseId !== null
      : question.type === 2
      ? selectedBook !== '' && selectedChapter !== '' && selectedVerse !== ''
      : selectedCategoryIds.size > 0);

  const modeConfig: Record<QuizMode, { label: string; description: string }> = {
    1: { label: 'Verse by Category', description: 'Given a category, identify which verse belongs to it.' },
    2: { label: 'Locate the Verse', description: 'Given the verse text, identify the book, chapter, and starting verse.' },
    3: { label: 'Categorize the Verse', description: 'Given a verse reference, select all categories it belongs to.' },
    4: { label: 'Flashcards', description: 'Click a card to reveal the verse text, notes, categories, and tags. Click again to flip back.' },
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Quiz</h1>
        {mode !== 4 && (
          <span className="text-sm text-gray-500">
            {score.total > 0 ? `${score.correct} / ${score.total} correct` : ''}
          </span>
        )}
      </div>

      {/* Mode tabs */}
      <div className="bg-white rounded-lg shadow-md p-1 grid grid-cols-2 gap-1">
        {([1, 2, 3, 4] as QuizMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setScore({ correct: 0, total: 0 }); }}
            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === m ? 'bg-slate-800 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {modeConfig[m].label}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-xs text-gray-400 mb-5">{modeConfig[mode].description}</p>

        {mode === 4 ? (
          <Mode4View verses={verses} />
        ) : generating ? (
          <div className="text-center py-12 text-gray-400">Generating question...</div>
        ) : !question ? (
          <div className="text-center py-12 text-gray-500">
            {mode === 2
              ? 'No verse texts have been fetched yet. Fetch some verse texts first, then try this mode.'
              : 'Not enough data to generate a question.'}
          </div>
        ) : question.type === 1 ? (
          <Mode1View question={question} selectedVerseId={selectedVerseId} onSelect={setSelectedVerseId} answered={answered} />
        ) : question.type === 2 ? (
          <Mode2View
            question={question}
            selectedBook={selectedBook}
            setSelectedBook={(b) => { setSelectedBook(b); setSelectedChapter(''); setSelectedVerse(''); }}
            selectedChapter={selectedChapter}
            setSelectedChapter={(c) => { setSelectedChapter(c); setSelectedVerse(''); }}
            selectedVerse={selectedVerse}
            setSelectedVerse={setSelectedVerse}
            bookOptions={bookOptions}
            chapterOptions={chapterOptions}
            verseOptions={verseOptions}
            answered={answered}
          />
        ) : (
          <Mode3View
            question={question}
            allCategories={allCategories}
            selectedCategoryIds={selectedCategoryIds}
            setSelectedCategoryIds={setSelectedCategoryIds}
            answered={answered}
          />
        )}

        {/* Result banner */}
        {mode !== 4 && answered && (
          <div className={`mt-5 p-3 rounded-md text-sm font-medium ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            {!isCorrect && question?.type === 1 && (
              <span className="ml-2 font-normal">
                Correct answer: <strong>{verses.find((v) => v.id === (question as Mode1Question).correctVerseId)?.reference}</strong>
              </span>
            )}
            {!isCorrect && question?.type === 2 && (
              <span className="ml-2 font-normal">
                Correct answer: <strong>{(question as Mode2Question).verse.reference}</strong>
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        {mode !== 4 && (
          <div className="mt-5 flex justify-end gap-3">
            {!answered ? (
              <button
                onClick={submitAnswer}
                disabled={!canSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Next Question →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
