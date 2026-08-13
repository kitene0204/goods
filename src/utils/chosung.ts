// Korean Hangul Chosung (Initial Consonants) utility

const CHOSUNG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * Extracts Korean Chosung (initial consonants) from a string.
 * Non-Hangul syllables remain as they are.
 */
export function getChosung(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Hangul Syllables: 0xAC00 ~ 0xD7A3 (가 ~ 힣)
    if (code >= 0xac00 && code <= 0xd7a3) {
      const chosungIndex = Math.floor((code - 0xac00) / (21 * 28));
      result += CHOSUNG_LIST[chosungIndex];
    } else {
      result += text.charAt(i);
    }
  }
  return result;
}

/**
 * Checks if search query matches target text by normal substring or Korean Chosung match.
 */
export function matchesChosungOrText(target: string, query: string): boolean {
  if (!query.trim()) return true;
  
  const normalizedTarget = target.toLowerCase().replace(/\s+/g, '');
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, '');

  // 1. Direct substring match
  if (normalizedTarget.includes(normalizedQuery)) {
    return true;
  }

  // 2. Chosung match
  const targetChosung = getChosung(normalizedTarget);
  return targetChosung.includes(normalizedQuery);
}
