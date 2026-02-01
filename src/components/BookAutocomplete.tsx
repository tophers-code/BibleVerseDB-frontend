import { useState, useRef, useEffect } from 'react';
import type { BibleBook } from '../types';

interface BookAutocompleteProps {
  books: BibleBook[];
  value: BibleBook | null;
  onChange: (book: BibleBook | null) => void;
  workingBook?: BibleBook | null;
  disabled?: boolean;
}

export default function BookAutocomplete({
  books,
  value,
  onChange,
  workingBook,
  disabled,
}: BookAutocompleteProps) {
  const [query, setQuery] = useState(value?.name || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredBooks = query
    ? books.filter(
        (book) =>
          book.name.toLowerCase().includes(query.toLowerCase()) ||
          book.abbreviation.toLowerCase().includes(query.toLowerCase())
      )
    : books;

  useEffect(() => {
    if (value) {
      setQuery(value.name);
    } else if (workingBook) {
      setQuery(workingBook.name);
      onChange(workingBook);
    }
  }, [value, workingBook]);

  const handleSelect = (book: BibleBook) => {
    onChange(book);
    setQuery(book.name);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredBooks.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Tab':
      case 'Enter':
        e.preventDefault();
        if (filteredBooks[highlightedIndex]) {
          handleSelect(filteredBooks[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(0);
          if (!e.target.value) {
            onChange(null);
          }
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type book name..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
      />

      {isOpen && filteredBooks.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredBooks.map((book, index) => (
            <li
              key={book.id}
              onClick={() => handleSelect(book)}
              className={`px-3 py-2 cursor-pointer ${
                index === highlightedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              <span className="font-medium">{book.name}</span>
              <span className="text-gray-500 text-sm ml-2">({book.abbreviation})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
