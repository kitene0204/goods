export interface MemberYearGroup {
  year: number;
  names: string[];
}

export interface MemberAgeItem {
  id: string;
  name: string;
  birthYear: number;
  currentAge: number;
  generation: string; // '70대' | '60대' | '50대' | '40대' | '30대' | '20대' | '10대'
}

// 사용자 제공 이미지 원본 데이터 (총 27개 연도, 58명)
export const HANWOOLIM_BIRTH_YEARS_DATA: MemberYearGroup[] = [
  { year: 1952, names: ['송인한', '최규성'] },
  { year: 1957, names: ['김재선', '김준관', '박공래'] },
  { year: 1958, names: ['배동연'] },
  { year: 1960, names: ['강운석', '은희광', '이계현'] },
  { year: 1962, names: ['강명규', '권용국', '조우영'] },
  { year: 1963, names: ['김일태', '장종석', '정홍모'] },
  { year: 1964, names: ['이종선'] },
  { year: 1966, names: ['고광직', '박광전', '정진안'] },
  { year: 1969, names: ['박의경'] },
  { year: 1971, names: ['김영수'] },
  { year: 1972, names: ['전훈'] },
  { year: 1975, names: ['임태승', '전민국'] },
  { year: 1976, names: ['배정민', '서재원', '정현욱', '홍성완'] },
  { year: 1977, names: ['김선경'] },
  { year: 1979, names: ['온재승', '유경일', '이병훈'] },
  { year: 1980, names: ['김태균', '신민철', '염규생', '이경훈'] },
  { year: 1982, names: ['신해련', '이충효', '임강문'] },
  { year: 1985, names: ['김요셉', '오승찬', '이성훈'] },
  { year: 1986, names: ['김진규', '이창민'] },
  { year: 1987, names: ['윤찬솔'] },
  { year: 1988, names: ['강석원', '신성화', '천승진'] },
  { year: 1989, names: ['김동찬', '김현우', '임상섭'] },
  { year: 1991, names: ['김준동', '배지혁', '송준민', '최수민'] },
  { year: 1992, names: ['문범준'] },
  { year: 1993, names: ['문현덕', '박정태'] },
  { year: 1994, names: ['정재용'] },
  { year: 1997, names: ['강전성'] },
  { year: 2007, names: ['서예찬'] },
];

export const CURRENT_YEAR = new Date().getFullYear();

export function getGeneration(age: number): string {
  if (age >= 70) return '70대 이상';
  if (age >= 60) return '60대';
  if (age >= 50) return '50대';
  if (age >= 40) return '40대';
  if (age >= 30) return '30대';
  if (age >= 20) return '20대';
  return '10대 이하';
}

// Flat array of all individual members
export function getFlatMembersList(data: MemberYearGroup[] = HANWOOLIM_BIRTH_YEARS_DATA): MemberAgeItem[] {
  const list: MemberAgeItem[] = [];
  data.forEach((group) => {
    const age = CURRENT_YEAR - group.year;
    group.names.forEach((name) => {
      list.push({
        id: `${group.year}-${name}`,
        name,
        birthYear: group.year,
        currentAge: age,
        generation: getGeneration(age),
      });
    });
  });
  return list;
}

// Quick map for lookup by member name
const MEMBER_MAP = new Map<string, { birthYear: number; age: number }>();
HANWOOLIM_BIRTH_YEARS_DATA.forEach((group) => {
  const age = CURRENT_YEAR - group.year;
  group.names.forEach((name) => {
    MEMBER_MAP.set(name.trim(), { birthYear: group.year, age });
  });
});

export function findMemberAgeInfo(name: string): { birthYear: number; age: number } | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (MEMBER_MAP.has(trimmed)) {
    return MEMBER_MAP.get(trimmed)!;
  }
  // Try partial match
  for (const [memName, info] of MEMBER_MAP.entries()) {
    if (trimmed.includes(memName) || memName.includes(trimmed)) {
      return info;
    }
  }
  return null;
}
