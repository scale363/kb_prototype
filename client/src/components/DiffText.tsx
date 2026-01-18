/**
 * Component for displaying text differences with highlighting
 * Similar to Grammarly's change visualization
 */

import { useState } from 'react';
import { computeTextDiff, type DiffPart } from '@/utils/textDiff';

interface DiffTextProps {
  originalText: string;
  modifiedText: string;
  className?: string;
}

// Group consecutive diff parts into change groups
interface ChangeGroup {
  type: 'change' | 'unchanged';
  removed: string;
  added: string;
  unchanged?: string;
}

function groupDiffParts(parts: DiffPart[]): ChangeGroup[] {
  const groups: ChangeGroup[] = [];
  let i = 0;

  while (i < parts.length) {
    const part = parts[i];

    if (part.type === 'unchanged') {
      groups.push({
        type: 'unchanged',
        removed: '',
        added: '',
        unchanged: part.text,
      });
      i++;
    } else {
      // Collect consecutive removed and added parts
      let removed = '';
      let added = '';

      // Collect all removed parts
      while (i < parts.length && parts[i].type === 'removed') {
        removed += parts[i].text;
        i++;
      }

      // Collect all added parts
      while (i < parts.length && parts[i].type === 'added') {
        added += parts[i].text;
        i++;
      }

      if (removed || added) {
        groups.push({
          type: 'change',
          removed,
          added,
        });
      }
    }
  }

  return groups;
}

export function DiffText({ originalText, modifiedText, className = '' }: DiffTextProps) {
  const diffParts = computeTextDiff(originalText, modifiedText);
  const changeGroups = groupDiffParts(diffParts);

  // Track which change groups are showing their removed text
  const [showingRemoved, setShowingRemoved] = useState<Set<number>>(new Set());

  const handleClickChange = (index: number) => {
    setShowingRemoved(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className={`text-sm text-foreground leading-relaxed whitespace-pre-wrap ${className}`}>
      {changeGroups.map((group, index) => {
        if (group.type === 'unchanged') {
          return <span key={index}>{group.unchanged}</span>;
        }

        // Change group - show added text with underline, optionally show removed text
        const isShowingRemoved = showingRemoved.has(index);

        return (
          <span key={index}>
            {isShowingRemoved && group.removed && (
              <span
                className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through rounded px-0.5 opacity-60"
                title="Removed text (click green text to hide)"
              >
                {group.removed}
              </span>
            )}
            {group.added && (
              <span
                onClick={() => group.removed && handleClickChange(index)}
                className={`bg-[#0b9786]/10 dark:bg-[#0b9786]/20 text-[#0b9786] dark:text-[#0b9786] border-b-2 border-[#0b9786] rounded-sm px-0.5 ${group.removed ? 'cursor-pointer' : ''}`}
                title={group.removed ? "Click to show/hide removed text" : "Added text"}
              >
                {group.added}
              </span>
            )}
            {!group.added && group.removed && (
              <span
                className="opacity-0"
                title="Text was removed"
              >

              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
