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

// 한울림 테니스클럽 73명 공식 회원 등급 및 점수 마스터 데이터
// (구글 스프레드시트 '회원명부(정회원)' 시트의 F열: 등급(점), G열: 등급(금,은,동) 공식 반영)
export const HANWOOLIM_MEMBER_GRADES: Record<string, { grade: string; score: number; division: '금배부' | '은배부' | '동배부' }> = {
  // [구글 시트 '회원명부(정회원)' 연번 1~24 확인 데이터]
  '강명규': { grade: '금E', score: 5, division: '금배부' }, // F: 5, G: 금E
  '강석원': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동 (휴면)
  '강운석': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동
  '강전성': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동
  '고광직': { grade: '은B', score: 3, division: '은배부' }, // F: 3, G: 은B
  '권용국': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동
  '김동찬': { grade: '금C', score: 7, division: '금배부' }, // F: 7, G: 금C
  '김선경': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동
  '김영수': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동
  '김영현': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동
  '김요셉': { grade: '은B', score: 3, division: '은배부' }, // F: 3, G: 은B
  '김일태': { grade: '동', score: 2, division: '동배부' },   // F: 2, G: 동
  '김재선': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동 (특별회원)
  '김준관': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동 (휴면)
  '김준동': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동
  '김진규': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동
  '김태균': { grade: '금D', score: 6, division: '금배부' }, // F: 6, G: 금D
  '김한준': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동
  '김한진': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동
  '김현우': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동
  '문범준': { grade: '은B', score: 3, division: '은배부' }, // F: 3, G: 은B
  '문현덕': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동
  '박공래': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동 (비희망)
  '박광전': { grade: '동', score: 1, division: '동배부' },   // F: 1, G: 동
  // [회원명부 25~73번]
  '박력': { grade: '동', score: 1, division: '동배부' },
  '박의경': { grade: '동', score: 1, division: '동배부' },
  '박정태': { grade: '금D', score: 6, division: '금배부' },
  '배동연': { grade: '동', score: 1, division: '동배부' },
  '배정민': { grade: '동', score: 1, division: '동배부' },
  '배지혁': { grade: '금C', score: 7, division: '금배부' },
  '서영진': { grade: '동', score: 1, division: '동배부' },
  '서예찬': { grade: '금C', score: 7, division: '금배부' },
  '서재원': { grade: '동', score: 1, division: '동배부' },
  '서재원w': { grade: '동', score: 1, division: '동배부' },
  '석영수': { grade: '동', score: 1, division: '동배부' },
  '송인한': { grade: '동', score: 1, division: '동배부' },
  '송준민': { grade: '금D', score: 6, division: '금배부' },
  '신민철': { grade: '동', score: 1, division: '동배부' },
  '신성화': { grade: '동', score: 1, division: '동배부' },
  '신해련': { grade: '동', score: 1, division: '동배부' },
  '염규생': { grade: '동', score: 1, division: '동배부' },
  '오승찬': { grade: '은B', score: 3, division: '은배부' },
  '온재승': { grade: '동', score: 1, division: '동배부' },
  '유경일': { grade: '동', score: 1, division: '동배부' },
  '유봉수': { grade: '동', score: 1, division: '동배부' },
  '윤찬솔': { grade: '금D', score: 6, division: '금배부' },
  '은희광': { grade: '동', score: 1, division: '동배부' },
  '이경훈': { grade: '동', score: 1, division: '동배부' },
  '이계현': { grade: '동', score: 1, division: '동배부' },
  '이병훈': { grade: '동', score: 1, division: '동배부' },
  '이성훈': { grade: '은B', score: 3, division: '은배부' },
  '이정식': { grade: '동', score: 1, division: '동배부' },
  '이종선': { grade: '동', score: 1, division: '동배부' },
  '이창민': { grade: '금D', score: 6, division: '금배부' },
  '이충효': { grade: '동', score: 1, division: '동배부' },
  '임강문': { grade: '동', score: 1, division: '동배부' },
  '임상섭': { grade: '은B', score: 3, division: '은배부' },
  '임태승': { grade: '동', score: 1, division: '동배부' },
  '장종석': { grade: '동', score: 1, division: '동배부' },
  '전만국': { grade: '동', score: 1, division: '동배부' },
  '전훈': { grade: '동', score: 1, division: '동배부' },
  '정재용': { grade: '금C', score: 7, division: '금배부' },
  '정진안': { grade: '동', score: 1, division: '동배부' },
  '정현욱': { grade: '동', score: 1, division: '동배부' },
  '정홍모': { grade: '동', score: 1, division: '동배부' },
  '조우영': { grade: '동', score: 1, division: '동배부' },
  '천승진': { grade: '금D', score: 6, division: '금배부' },
  '최규성': { grade: '동', score: 1, division: '동배부' },
  '최수민': { grade: '금C', score: 7, division: '금배부' },
  '편보성': { grade: '동', score: 1, division: '동배부' },
  '한언석': { grade: '동', score: 1, division: '동배부' },
  '현대삼': { grade: '동', score: 1, division: '동배부' },
  '홍성완': { grade: '동', score: 1, division: '동배부' },
};

export const AVAILABLE_GRADES = [
  { grade: '금B', defaultScore: 8, division: '금배부', label: '금B (8점)' },
  { grade: '금C', defaultScore: 7, division: '금배부', label: '금C (7점)' },
  { grade: '금D', defaultScore: 6, division: '금배부', label: '금D (6점)' },
  { grade: '금E', defaultScore: 5, division: '금배부', label: '금E (5점)' },
  { grade: '은A', defaultScore: 4, division: '은배부', label: '은A (4점)' },
  { grade: '은B', defaultScore: 3, division: '은배부', label: '은B (3점)' },
  { grade: '동', defaultScore: 1, division: '동배부', label: '동 (1점)' },
  { grade: '동', defaultScore: 2, division: '동배부', label: '동 (2점)' },
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
      // Look up member's official score first if available
      const official = HANWOOLIM_MEMBER_GRADES[name?.trim()];
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

  // 2. Lookup in default club member master map
  if (!name) return null;
  const trimmedName = name.trim();
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

  // Partial name match
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
