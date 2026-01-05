/**
 * Text diff utility for highlighting changes between two texts
 * Similar to Grammarly's diff highlighting
 */

export type DiffType = 'added' | 'removed' | 'unchanged';

export interface DiffPart {
  type: DiffType;
  text: string;
}

/**
 * Computes the diff between two texts at word level
 * Returns an array of diff parts with their types
 */
export function computeTextDiff(original: string, modified: string): DiffPart[] {
  // Split texts into words while preserving whitespace
  const originalWords = tokenize(original);
  const modifiedWords = tokenize(modified);

  // Compute LCS (Longest Common Subsequence)
  const lcs = computeLCS(originalWords, modifiedWords);

  // Build diff result
  const result: DiffPart[] = [];
  let origIndex = 0;
  let modIndex = 0;
  let lcsIndex = 0;

  while (origIndex < originalWords.length || modIndex < modifiedWords.length) {
    if (lcsIndex < lcs.length) {
      const lcsWord = lcs[lcsIndex];

      // Find the word in both sequences
      const origWordIndex = originalWords.indexOf(lcsWord, origIndex);
      const modWordIndex = modifiedWords.indexOf(lcsWord, modIndex);

      // Add removed words from original
      while (origIndex < origWordIndex) {
        if (result.length > 0 && result[result.length - 1].type === 'removed') {
          result[result.length - 1].text += originalWords[origIndex];
        } else {
          result.push({ type: 'removed', text: originalWords[origIndex] });
        }
        origIndex++;
      }

      // Add added words from modified
      while (modIndex < modWordIndex) {
        if (result.length > 0 && result[result.length - 1].type === 'added') {
          result[result.length - 1].text += modifiedWords[modIndex];
        } else {
          result.push({ type: 'added', text: modifiedWords[modIndex] });
        }
        modIndex++;
      }

      // Add unchanged word
      if (result.length > 0 && result[result.length - 1].type === 'unchanged') {
        result[result.length - 1].text += lcsWord;
      } else {
        result.push({ type: 'unchanged', text: lcsWord });
      }

      origIndex++;
      modIndex++;
      lcsIndex++;
    } else {
      // No more LCS matches, add remaining as removed/added
      while (origIndex < originalWords.length) {
        if (result.length > 0 && result[result.length - 1].type === 'removed') {
          result[result.length - 1].text += originalWords[origIndex];
        } else {
          result.push({ type: 'removed', text: originalWords[origIndex] });
        }
        origIndex++;
      }

      while (modIndex < modifiedWords.length) {
        if (result.length > 0 && result[result.length - 1].type === 'added') {
          result[result.length - 1].text += modifiedWords[modIndex];
        } else {
          result.push({ type: 'added', text: modifiedWords[modIndex] });
        }
        modIndex++;
      }
    }
  }

  return result;
}

/**
 * Tokenize text into words while preserving whitespace
 */
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let isWhitespace = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charIsWhitespace = /\s/.test(char);

    if (charIsWhitespace !== isWhitespace && current.length > 0) {
      tokens.push(current);
      current = char;
      isWhitespace = charIsWhitespace;
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Compute Longest Common Subsequence of two word arrays
 */
function computeLCS(arr1: string[], arr2: string[]): string[] {
  const m = arr1.length;
  const n = arr2.length;

  // Create DP table
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift(arr1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}
