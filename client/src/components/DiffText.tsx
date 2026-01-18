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
  showingRemoved?: Set<number>;
  onToggleChange?: (index: number) => void;
}

// Group consecutive diff parts into change groups
interface ChangeGroup {
  type: 'change' | 'unchanged';
  removed: string;
  added: string;
  unchanged?: string;
}

function groupDiffParts(parts: DiffPart[]): ChangeGroup[] {
  if (parts.length === 0) return [];

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
      // Collect consecutive removed and added parts, including short unchanged parts between them
      let removed = '';
      let added = '';
      let tempUnchanged: string[] = [];

      while (i < parts.length) {
        if (parts[i].type === 'removed') {
          // Flush temporary unchanged parts into the change
          if (tempUnchanged.length > 0) {
            removed += tempUnchanged.join('');
            added += tempUnchanged.join('');
            tempUnchanged = [];
          }
          removed += parts[i].text;
          i++;
        } else if (parts[i].type === 'added') {
          // Flush temporary unchanged parts into the change
          if (tempUnchanged.length > 0) {
            removed += tempUnchanged.join('');
            added += tempUnchanged.join('');
            tempUnchanged = [];
          }
          added += parts[i].text;
          i++;
        } else if (parts[i].type === 'unchanged') {
          // Look ahead to see if there are more changes coming
          const unchangedText = parts[i].text;
          const isShortUnchanged = unchangedText.length <= 3 || /^\s+$/.test(unchangedText);

          // Check if there are more changes ahead
          let hasMoreChanges = false;
          for (let j = i + 1; j < parts.length && j < i + 3; j++) {
            if (parts[j].type === 'removed' || parts[j].type === 'added') {
              hasMoreChanges = true;
              break;
            }
          }

          if (isShortUnchanged && hasMoreChanges) {
            // Include this short unchanged part in the change group
            tempUnchanged.push(unchangedText);
            i++;
          } else {
            // This is a significant unchanged part or no more changes ahead, end the change group
            break;
          }
        } else {
          break;
        }
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

/**
 * Compute the final text with toggled changes applied
 * @param originalText - The original text
 * @param modifiedText - The modified text
 * @param showingRemoved - Set of indices where original text should be shown
 * @returns The final text with toggled changes
 */
export function computeFinalText(
  originalText: string,
  modifiedText: string,
  showingRemoved: Set<number>
): string {
  const diffParts = computeTextDiff(originalText, modifiedText);
  const changeGroups = groupDiffParts(diffParts);

  let result = '';
  changeGroups.forEach((group, index) => {
    if (group.type === 'unchanged') {
      result += group.unchanged;
    } else {
      // If showing removed for this group
      if (showingRemoved.has(index)) {
        // Use original if exists, otherwise use space (for added-only text)
        result += group.removed || ' ';
      } else if (group.added) {
        result += group.added;
      }
    }
  });

  return result;
}

export function DiffText({
  originalText,
  modifiedText,
  className = '',
  showingRemoved: externalShowingRemoved,
  onToggleChange,
}: DiffTextProps) {
  const diffParts = computeTextDiff(originalText, modifiedText);
  const changeGroups = groupDiffParts(diffParts);

  // Track which change groups are showing their removed text
  // Use external state if provided, otherwise internal state
  const [internalShowingRemoved, setInternalShowingRemoved] = useState<Set<number>>(new Set());
  const showingRemoved = externalShowingRemoved ?? internalShowingRemoved;

  const handleClickChange = (index: number) => {
    if (onToggleChange) {
      onToggleChange(index);
    } else {
      setInternalShowingRemoved(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
        return newSet;
      });
    }
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
            {isShowingRemoved ? (
              // Show original text or space (clickable to return to new version)
              <span
                onClick={() => handleClickChange(index)}
                className="cursor-pointer border-b border-muted-foreground/40"
                title="Click to show corrected version"
              >
                {group.removed || ' '}
              </span>
            ) : group.added ? (
              // Show new text with green underline (always clickable)
              <span
                onClick={() => handleClickChange(index)}
                className="cursor-pointer bg-[#0b9786]/5 dark:bg-[#0b9786]/10 border-b border-[#0b9786] rounded-sm px-0.5"
                title={group.removed ? "Click to show original text" : "Click to hide"}
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
