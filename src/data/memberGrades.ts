export interface MemberGradeData {
  name: string;
  grade: string; // '금B' | '금C' | '금D' | '금E' | '은A' | '은B' | '동'
  score: number; // 1 ~ 10
  division: '금배부' | '은배부' | '동배부';
}

export interface ResolvedMemberGrade {
  grade: string;
  score: number | string;
  label: string; // e.g. "은A(4점)"
  tier: 'gold' | 'silver' | 'bronze';
  division: '금배부' | '은배부' | '동배부' | '일반';
}

// 한울림 테니스클럽 공식 회원 등급 및 점수 마스터 데이터
// (구글 스프레드시트 '회원명부(정회원)' 시트 F열: 등급(점), G열: 등급(금,은,동) 원본 100% 공식 반영)
export const HANWOOLIM_MEMBER_GRADES: Record<string, { grade: string; score: number; division: '금배부' | '은배부' | '동배부' }> = {
  // 1~25번
  '강명규': { grade: '금E', score: 5, division: '금배부' }, // 1. F: 5, G: 금E
  '강석원': { grade: '동', score: 1, division: '동배부' },   // 2. F: 1, G: 동
  '강운석': { grade: '동', score: 1, division: '동배부' },   // 3. F: 1, G: 동
  '강전성': { grade: '동', score: 1, division: '동배부' },   // 4. F: 1, G: 동
  '고광직': { grade: '은B', score: 3, division: '은배부' }, // 5. F: 3, G: 은B
  '권용국': { grade: '동', score: 1, division: '동배부' },   // 6. F: 1, G: 동
  '김동찬': { grade: '금C', score: 7, division: '금배부' }, // 7. F: 7, G: 금C
  '김선경': { grade: '동', score: 1, division: '동배부' },   // 8. F: 1, G: 동
  '김영수': { grade: '동', score: 1, division: '동배부' },   // 9. F: 1, G: 동
  '김영현': { grade: '동', score: 1, division: '동배부' },   // 10. F/G 빈칸 (기본)
  '김요셉': { grade: '은B', score: 3, division: '은배부' }, // 11. F: 3, G: 은B
  '김일태': { grade: '동', score: 2, division: '동배부' },   // 12. F: 2, G: 동
  '김재선': { grade: '동', score: 1, division: '동배부' },   // 13. F: 1, G: 동
  '김준관': { grade: '동', score: 1, division: '동배부' },   // 14. F: 1, G: 동
  '김준동': { grade: '동', score: 1, division: '동배부' },   // 15. F: 1, G: 동
  '김진규': { grade: '동', score: 1, division: '동배부' },   // 16. F: 1, G: 동
  '김태균': { grade: '금D', score: 6, division: '금배부' }, // 17. F: 6, G: 금D
  '김한진': { grade: '동', score: 1, division: '동배부' },   // 18. F/G 빈칸 (기본)
  '김현우': { grade: '동', score: 2, division: '동배부' },   // 19. F: 2, G: 동
  '문범준': { grade: '은B', score: 3, division: '은배부' }, // 20. F: 3, G: 은B
  '문현덕': { grade: '동', score: 1, division: '동배부' },   // 21. F: 1, G: 동
  '박공래': { grade: '동', score: 1, division: '동배부' },   // 22. F: 1, G: 동
  '박광전': { grade: '동', score: 1, division: '동배부' },   // 23. F: 1, G: 동
  '박력': { grade: '동', score: 1, division: '동배부' },     // 24. F: 1, G: 동
  '박의경': { grade: '금E', score: 5, division: '금배부' }, // 25. F: 5, G: 금E

  // 26~52번
  '박정태': { grade: '동', score: 2, division: '동배부' },   // 26. F: 2, G: 동
  '배동연': { grade: '금D', score: 6, division: '금배부' }, // 27. F: 6, G: 금D
  '배정민': { grade: '금E', score: 5, division: '금배부' }, // 28. F: 5, G: 금E
  '배지혁': { grade: '동', score: 1, division: '동배부' },   // 29. F/G 빈칸 (기본)
  '서영진': { grade: '동', score: 1, division: '동배부' },   // 30. F/G 빈칸 (기본)
  '서예찬': { grade: '동', score: 2, division: '동배부' },   // 31. F: 2, G: 동
  '서재원': { grade: '동', score: 2, division: '동배부' },   // 32. F: 2, G: 동
  '석영수': { grade: '동', score: 1, division: '동배부' },   // 33. F/G 빈칸 (기본)
  '송인한': { grade: '동', score: 2, division: '동배부' },   // 34. F: 2, G: 동
  '송준민': { grade: '동', score: 1, division: '동배부' },   // 35. F: 1, G: 동
  '신민철': { grade: '동', score: 1, division: '동배부' },   // 36. F: 1, G: 동
  '신성화': { grade: '금E', score: 5, division: '금배부' }, // 37. F: 5, G: 금E
  '신해련': { grade: '금', score: 4, division: '금배부' },   // 38. F: 4, G: 금
  '염규생': { grade: '금B', score: 8, division: '금배부' }, // 39. F: 8, G: 금B
  '오승찬': { grade: '동', score: 1, division: '동배부' },   // 40. F: 1, G: 동
  '온재승': { grade: '동', score: 2, division: '동배부' },   // 41. F: 2, G: 동
  '유경일': { grade: '금E', score: 5, division: '금배부' }, // 42. F: 5, G: 금E
  '윤찬솔': { grade: '동', score: 1, division: '동배부' },   // 43. F: 1, G: 동
  '은희광': { grade: '동', score: 2, division: '동배부' },   // 44. F: 2, G: 동
  '이경훈': { grade: '동', score: 1, division: '동배부' },   // 45. F: 1, G: 동
  '이계현': { grade: '동', score: 1, division: '동배부' },   // 46. F: 1, G: 동
  '이병훈': { grade: '동', score: 1, division: '동배부' },   // 47. F: 1, G: 동
  '이성훈': { grade: '동', score: 1, division: '동배부' },   // 48. F: 1, G: 동
  '이종선': { grade: '은B', score: 3, division: '은배부' }, // 49. F: 3, G: 은B
  '이창민': { grade: '동', score: 1, division: '동배부' },   // 50. F: 1, G: 동
  '이충효': { grade: '금D', score: 6, division: '금배부' }, // 51. F: 6, G: 금D
  '임강문': { grade: '동', score: 1, division: '동배부' },   // 52. F: 1, G: 동

  // 53~68번
  '임상섭': { grade: '은A', score: 4, division: '은배부' }, // 53. F: 4, G: 은A
  '임태승': { grade: '동', score: 1, division: '동배부' },   // 54. F: 1, G: 동
  '장종석': { grade: '동', score: 1, division: '동배부' },   // 55. F: 1, G: 동
  '전만국': { grade: '금D', score: 6, division: '금배부' }, // 56. F: 6, G: 금D
  '전훈': { grade: '동', score: 1, division: '동배부' },     // 57. F: 1, G: 동
  '정재용': { grade: '은A', score: 4, division: '은배부' }, // 58. F: 4, G: 은A
  '정진안': { grade: '동', score: 1, division: '동배부' },   // 59. F: 1, G: 동
  '정현욱': { grade: '동', score: 1, division: '동배부' },   // 60. F: 1, G: 동
  '정홍모': { grade: '동', score: 1, division: '동배부' },   // 61. F: 1, G: 동
  '조우영': { grade: '은B', score: 3, division: '은배부' }, // 62. F: 3, G: 은B
  '천승진': { grade: '은A', score: 4, division: '은배부' }, // 63. F: 4, G: 은A
  '최규성': { grade: '동', score: 1, division: '동배부' },   // 64. F: 1, G: 동
  '최수민': { grade: '동', score: 2, division: '동배부' },   // 65. F: 2, G: 동
  '편보성': { grade: '동', score: 1, division: '동배부' },   // 66. F/G 빈칸 (기본)
  '현대삼': { grade: '동', score: 1, division: '동배부' },   // 67. F/G 빈칸 (기본)
  '홍성완': { grade: '동', score: 1, division: '동배부' },   // 68. F: 1, G: 동

  // 호환용 레거시 회원
  '김한준': { grade: '동', score: 1, division: '동배부' },
  '서재원w': { grade: '동', score: 2, division: '동배부' },
  '한언석': { grade: '동', score: 1, division: '동배부' },
};

export const AVAILABLE_GRADES = [
  { grade: '금B', defaultScore: 8, division: '금배부', label: '금B (8점)' },
  { grade: '금C', defaultScore: 7, division: '금배부', label: '금C (7점)' },
  { grade: '금D', defaultScore: 6, division: '금배부', label: '금D (6점)' },
  { grade: '금E', defaultScore: 5, division: '금배부', label: '금E (5점)' },
  { grade: '금', defaultScore: 4, division: '금배부', label: '금 (4점)' },
  { grade: '은A', defaultScore: 4, division: '은배부', label: '은A (4점)' },
  { grade: '은B', defaultScore: 3, division: '은배부', label: '은B (3점)' },
  { grade: '동', defaultScore: 2, division: '동배부', label: '동 (2점)' },
  { grade: '동', defaultScore: 1, division: '동배부', label: '동 (1점)' },
] as const;

export function getTierCategory(grade: string): 'gold' | 'silver' | 'bronze' {
  if (!grade) return 'silver';
  if (grade.startsWith('금')) return 'gold';
  if (grade.startsWith('은')) return 'silver';
  if (grade.startsWith('동')) return 'bronze';
  return 'silver';
}

export function formatGradeLabel(grade?: string, score?: number | string): string {
  if (!grade) return '';
  const cleanGrade = grade.trim();
  if (score !== undefined && score !== null && String(score).trim() !== '') {
    const cleanScore = String(score).replace(/[^0-9]/g, '');
    if (cleanScore) {
      return `${cleanGrade}(${cleanScore}점)`;
    }
  }
  // If grade already includes (X점)
  if (cleanGrade.includes('점')) {
    return cleanGrade;
  }
  return cleanGrade;
}

export const CUSTOM_GRADES_KEY = 'tennis_custom_member_grades_v1';

export function getCustomMemberGrades(): Record<string, { grade: string; score: number; division: '금배부' | '은배부' | '동배부' }> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(CUSTOM_GRADES_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (e) {
    console.error('Failed to read custom member grades:', e);
  }
  return {};
}

export function saveCustomMemberGrade(name: string, grade: string, score: number, division?: '금배부' | '은배부' | '동배부') {
  if (!name) return;
  const trimmed = name.trim();
  const cleanGrade = grade.trim();
  const div: '금배부' | '은배부' | '동배부' = division || (cleanGrade.startsWith('금') ? '금배부' : cleanGrade.startsWith('은') ? '은배부' : '동배부');
  try {
    const current = getCustomMemberGrades();
    current[trimmed] = { grade: cleanGrade, score, division: div };
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(CUSTOM_GRADES_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.error('Failed to save custom member grade:', e);
  }
}

export function saveBulkCustomMemberGrades(list: Array<{ name: string; grade: string; score: number | string; division?: string }>) {
  if (!Array.isArray(list) || list.length === 0) return;
  try {
    const current = getCustomMemberGrades();
    list.forEach((item) => {
      if (!item.name) return;
      const cleanName = item.name.trim();
      const cleanGrade = (item.grade || '동').trim();
      const numScore = typeof item.score === 'number' ? item.score : parseInt(String(item.score).replace(/[^0-9]/g, ''), 10) || 1;
      const div: '금배부' | '은배부' | '동배부' = (item.division && (item.division === '금배부' || item.division === '은배부' || item.division === '동배부'))
        ? item.division
        : (cleanGrade.startsWith('금') ? '금배부' : cleanGrade.startsWith('은') ? '은배부' : '동배부');
      current[cleanName] = { grade: cleanGrade, score: numScore, division: div };
    });
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(CUSTOM_GRADES_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.error('Failed to bulk save custom member grades:', e);
  }
}

export function findMemberGradeInfo(
  name: string,
  explicitGrade?: string,
  explicitScore?: number | string
): ResolvedMemberGrade | null {
  // 1. If explicit grade is set on participant
  if (explicitGrade && explicitGrade.trim()) {
    const grade = explicitGrade.trim();
    let score = explicitScore;
    if (score === undefined || score === null || String(score).trim() === '') {
      // Look up custom grade or member's official score first if available
      const custom = getCustomMemberGrades()[name?.trim()];
      const official = custom || HANWOOLIM_MEMBER_GRADES[name?.trim()];
      if (official && official.grade === grade) {
        score = official.score;
      } else {
        const match = AVAILABLE_GRADES.find((g) => g.grade === grade);
        score = match ? match.defaultScore : (grade.startsWith('금') ? 6 : grade.startsWith('은') ? 3 : 1);
      }
    }
    const scoreNum = typeof score === 'string' ? parseInt(score.replace(/[^0-9]/g, ''), 10) || 1 : score;
    const tier = getTierCategory(grade);
    const div = grade.startsWith('금') ? '금배부' : grade.startsWith('은') ? '은배부' : grade.startsWith('동') ? '동배부' : '일반';
    return {
      grade,
      score: scoreNum,
      label: formatGradeLabel(grade, scoreNum),
      tier,
      division: div,
    };
  }

  if (!name) return null;
  const trimmedName = name.trim();

  // 2. Check dynamically saved custom member grades (from sheet paste or edit)
  const customGrades = getCustomMemberGrades();
  if (customGrades[trimmedName]) {
    const found = customGrades[trimmedName];
    const tier = getTierCategory(found.grade);
    return {
      grade: found.grade,
      score: found.score,
      label: formatGradeLabel(found.grade, found.score),
      tier,
      division: found.division,
    };
  }

  // 3. Lookup in default club member master map
  const found = HANWOOLIM_MEMBER_GRADES[trimmedName];
  if (found) {
    const tier = getTierCategory(found.grade);
    return {
      grade: found.grade,
      score: found.score,
      label: formatGradeLabel(found.grade, found.score),
      tier,
      division: found.division,
    };
  }

  // Partial name match in custom grades
  for (const [memName, info] of Object.entries(customGrades)) {
    if (trimmedName.includes(memName) || memName.includes(trimmedName)) {
      const tier = getTierCategory(info.grade);
      return {
        grade: info.grade,
        score: info.score,
        label: formatGradeLabel(info.grade, info.score),
        tier,
        division: info.division,
      };
    }
  }

  // Partial name match in default master
  for (const [memName, info] of Object.entries(HANWOOLIM_MEMBER_GRADES)) {
    if (trimmedName.includes(memName) || memName.includes(trimmedName)) {
      const tier = getTierCategory(info.grade);
      return {
        grade: info.grade,
        score: info.score,
        label: formatGradeLabel(info.grade, info.score),
        tier,
        division: info.division,
      };
    }
  }

  return null;
}

/**
 * Convenient alias for findMemberGradeInfo
 */
export const resolveMemberGrade = findMemberGradeInfo;

/**
 * Returns Tailwind CSS styling classes for grade badge based on tier and card checked state
 */
export function getGradeBadgeStyle(tier: 'gold' | 'silver' | 'bronze', isChecked: boolean = false): string {
  if (isChecked) {
    // When parent card is checked (lime-500 vibrant background)
    switch (tier) {
      case 'gold':
        return 'bg-amber-950/75 text-amber-200 border border-amber-400/50 shadow-xs';
      case 'silver':
        return 'bg-slate-900/75 text-slate-100 border border-slate-300/45 shadow-xs';
      case 'bronze':
        return 'bg-orange-950/75 text-orange-200 border border-orange-400/50 shadow-xs';
      default:
        return 'bg-slate-900/75 text-white border border-white/30 shadow-xs';
    }
  }

  // Normal state on white background card
  switch (tier) {
    case 'gold':
      return 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 shadow-2xs';
    case 'silver':
      return 'bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 shadow-2xs';
    case 'bronze':
      return 'bg-orange-50 text-orange-900 border border-orange-300 hover:bg-orange-100 shadow-2xs';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs';
  }
}
