import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  children: string;
  className?: string;
}

export default function Markdown({ children, className = '' }: MarkdownProps) {
  return (
    <div className={`prose prose-sm prose-slate max-w-none ${className}`}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
