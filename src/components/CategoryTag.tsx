import { useState } from 'react';
import type { Category, ColorCode } from '../types';
import { categoryColors } from '../types';

interface CategoryTagProps {
  category: Category;
  onClick?: () => void;
  selected?: boolean;
  showTooltip?: boolean;
}

export default function CategoryTag({ category, onClick, selected, showTooltip = true }: CategoryTagProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colorClass = categoryColors[category.color_code as ColorCode] || 'bg-gray-500 text-white';
  const hasNote = category.category_note && showTooltip;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        onClick={onClick}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${
          onClick ? 'cursor-pointer hover:opacity-80' : ''
        } ${selected ? 'ring-2 ring-offset-1 ring-blue-500' : ''} ${hasNote ? 'pr-1.5' : ''}`}
      >
        {category.name}
        {hasNote && (
          <svg className="ml-1 w-3 h-3 opacity-70" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )}
      </span>

      {/* Tooltip */}
      {hasNote && isHovered && (
        <span className="absolute z-50 left-0 top-full mt-1 px-2 py-1 text-xs text-white bg-slate-800 rounded shadow-lg min-w-48 max-w-xs">
          {category.category_note}
        </span>
      )}
    </span>
  );
}
