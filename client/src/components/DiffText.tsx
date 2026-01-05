/**
 * Component for displaying text differences with highlighting
 * Similar to Grammarly's change visualization
 */

import { computeTextDiff, type DiffPart } from '@/utils/textDiff';

interface DiffTextProps {
  originalText: string;
  modifiedText: string;
  className?: string;
}

export function DiffText({ originalText, modifiedText, className = '' }: DiffTextProps) {
  const diffParts = computeTextDiff(originalText, modifiedText);

  return (
    <div className={`text-sm text-foreground leading-relaxed whitespace-pre-wrap ${className}`}>
      {diffParts.map((part, index) => {
        switch (part.type) {
          case 'added':
            return (
              <span
                key={index}
                className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded px-0.5"
                title="Added text"
              >
                {part.text}
              </span>
            );
          case 'removed':
            return (
              <span
                key={index}
                className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through rounded px-0.5 opacity-60"
                title="Removed text"
              >
                {part.text}
              </span>
            );
          case 'unchanged':
            return <span key={index}>{part.text}</span>;
          default:
            return null;
        }
      })}
    </div>
  );
}
