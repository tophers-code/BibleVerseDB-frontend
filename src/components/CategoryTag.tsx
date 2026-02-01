import type { Category, ColorCode } from '../types';
import { categoryColors } from '../types';

interface CategoryTagProps {
  category: Category;
  onClick?: () => void;
  selected?: boolean;
}

export default function CategoryTag({ category, onClick, selected }: CategoryTagProps) {
  const colorClass = categoryColors[category.color_code as ColorCode] || 'bg-gray-500 text-white';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      } ${selected ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
    >
      {category.name}
    </span>
  );
}
