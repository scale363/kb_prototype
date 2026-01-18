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

        // Change group - toggle between showing new (added) or original (removed) text
        const isShowingRemoved = showingRemoved.has(index);

        return (
          <span key={index}>
            {isShowingRemoved && group.removed ? (
              // Show original text (clickable to return to new version)
              <span
                onClick={() => handleClickChange(index)}
                className="cursor-pointer"
                title="Click to show corrected version"
              >
                {group.removed}
              </span>
            ) : group.added ? (
              // Show new text with green underline (clickable to show original if removed exists)
              <span
                onClick={() => group.removed && handleClickChange(index)}
                className={`bg-[#0b9786]/10 dark:bg-[#0b9786]/20 text-[#0b9786] dark:text-[#0b9786] border-b-2 border-[#0b9786] rounded-sm px-0.5 ${group.removed ? 'cursor-pointer' : ''}`}
                title={group.removed ? "Click to show original text" : "Added text"}
              >
                {group.added}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
