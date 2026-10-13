import { EventConfig, Participant, ClubMember, SyncHistoryEntry } from '../types';
import { findMemberGradeInfo, saveBulkCustomMemberGrades } from '../data/memberGrades';

const STORAGE_KEYS = {
  EVENT_CONFIG: 'tennis_checkin_event_config_v3',
  PARTICIPANTS: 'tennis_checkin_participants_v3',
  CLUB_MEMBERS: 'tennis_checkin_club_members_v3',
  SYNC_HISTORY: 'tennis_checkin_sync_history',
};

export const DEFAULT_GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzb9ZQbZUuQVD-EjM_TZ3R2LSaIZPcpMmZDpizbcR0YKNLm8i7bIPiXVUCtvAVA8NryfQ/exec';

export const INITIAL_EVENT_CONFIG: EventConfig = {
  id: 'event-2026-08',
  title: '2026년 한울림',
  clubName: '한울림 테니스클럽',
  date: '2026-08-16',
  location: '완산체련공원',
  primaryItemName: '한울림 단체티',
  items: [],
  multiItemMode: false, // Default is simple fast single-tap mode
  gasWebhookUrl: DEFAULT_GAS_WEBHOOK_URL,
  googleSheetUrl: '',
  theme: 'outdoor-court',
  fontSize: 'xlarge',
};

// 한울림 테니스클럽 전체 회원 DB (구글 시트 '회원명부(정회원)' 68명 원본 100% 반영)
const RAW_HANWOOLIM_CLUB_MEMBERS: ClubMember[] = [
  { id: 'm-1', name: '강명규', phone: '010-7569-1939', division: '금배부', memberNumber: '001', notes: '62.11.19 / 효자동' },
  { id: 'm-2', name: '강석원', phone: '010-2252-2214', division: '동배부', memberNumber: '002', notes: '88.01.16 / 효자동' },
  { id: 'm-3', name: '강운석', phone: '010-3689-1407', division: '동배부', memberNumber: '003', notes: '60.02.25 / 모악산자락길' },
  { id: 'm-4', name: '강전성', phone: '010-2280-1939', division: '동배부', memberNumber: '004', notes: '97.04.20 / 효자동' },
  { id: 'm-5', name: '고광직', phone: '010-8645-7155', division: '은배부', memberNumber: '005', notes: '66.01.22 / 삼천동' },
  { id: 'm-6', name: '권용국', phone: '010-6375-0436', division: '동배부', memberNumber: '006', notes: '62.09.03 / 삼천동' },
  { id: 'm-7', name: '김동찬', phone: '010-6423-0780', division: '금배부', memberNumber: '007', notes: '89.12.22 / 세병로' },
  { id: 'm-8', name: '김선경', phone: '010-2657-6545', division: '동배부', memberNumber: '008', notes: '77.07.11 / 효천중앙로' },
  { id: 'm-9', name: '김영수', phone: '010-5088-0507', division: '동배부', memberNumber: '009', notes: '71.01.10 / 우전로' },
  { id: 'm-10', name: '김영현', phone: '', division: '동배부', memberNumber: '010' },
  { id: 'm-11', name: '김요셉', phone: '010-6484-5778', division: '은배부', memberNumber: '011', notes: '85.12.23 / 효자동' },
  { id: 'm-12', name: '김일태', phone: '010-3673-3295', division: '동배부', memberNumber: '012', notes: '63.12.28 / 용머리로' },
  { id: 'm-13', name: '김재선', phone: '010-5155-5597', division: '동배부', memberNumber: '013', notes: '57.07.14 / 평화동' },
  { id: 'm-14', name: '김준관', phone: '010-2408-7242', division: '동배부', memberNumber: '014', notes: '57.08.06 / 수송동' },
  { id: 'm-15', name: '김준동', phone: '010-7676-6189', division: '동배부', memberNumber: '015', notes: '91.01.22 / 중화산동' },
  { id: 'm-16', name: '김진규', phone: '010-8470-3397', division: '동배부', memberNumber: '016', notes: '86.10.06 / 효자동' },
  { id: 'm-17', name: '김태균', phone: '010-4652-0872', division: '금배부', memberNumber: '017', notes: '80.10.02 / 효자동' },
  { id: 'm-18', name: '김한진', phone: '', division: '동배부', memberNumber: '018' },
  { id: 'm-19', name: '김현우', phone: '010-4291-1151', division: '동배부', memberNumber: '019', notes: '89.06.20 / 효자동' },
  { id: 'm-20', name: '문범준', phone: '010-4118-2385', division: '은배부', memberNumber: '020', notes: '92.05.22 / 삼례읍' },
  { id: 'm-21', name: '문현덕', phone: '010-4930-6343', division: '동배부', memberNumber: '021', notes: '93.12.22 / 효자동' },
  { id: 'm-22', name: '박공래', phone: '010-9557-8301', division: '동배부', memberNumber: '022', notes: '57.08.06 / 봉남면' },
  { id: 'm-23', name: '박광전', phone: '010-9557-8301', division: '동배부', memberNumber: '023', notes: '66.11.20' },
  { id: 'm-24', name: '박력', phone: '010-2955-0560', division: '동배부', memberNumber: '024', notes: '평화동' },
  { id: 'm-25', name: '박의경', phone: '010-3713-1235', division: '금배부', memberNumber: '025', notes: '69.04.29 / 삼천동' },
  { id: 'm-26', name: '박정태', phone: '010-9366-6550', division: '동배부', memberNumber: '026', notes: '93.08.11 / 송천동' },
  { id: 'm-27', name: '배동연', phone: '010-2684-1508', division: '금배부', memberNumber: '027', notes: '58.04.14 / 효자동' },
  { id: 'm-28', name: '배정민', phone: '010-4059-0021', division: '금배부', memberNumber: '028', notes: '76.09.23 / 삼천동' },
  { id: 'm-29', name: '배지혁', phone: '010-5199-7538', division: '동배부', memberNumber: '029', notes: '91.12.14' },
  { id: 'm-30', name: '서영진', phone: '010-5024-1507', division: '동배부', memberNumber: '030' },
  { id: 'm-31', name: '서예찬', phone: '010-8363-0275', division: '동배부', memberNumber: '031', notes: '07.03.18 / 만성동' },
  { id: 'm-32', name: '서재원', phone: '010-4654-9081', division: '동배부', memberNumber: '032', notes: '76.11.21 / 만성동' },
  { id: 'm-33', name: '석영수', phone: '', division: '동배부', memberNumber: '033' },
  { id: 'm-34', name: '송인한', phone: '010-3650-9524', division: '동배부', memberNumber: '034', notes: '52.03.25 / 서완산동' },
  { id: 'm-35', name: '송준민', phone: '010-3369-8775', division: '동배부', memberNumber: '035', notes: '91.08.09 / 송천동' },
  { id: 'm-36', name: '신민철', phone: '010-4599-6960', division: '동배부', memberNumber: '036', notes: '80.07.29 / 완산구' },
  { id: 'm-37', name: '신성화', phone: '010-8644-2546', division: '금배부', memberNumber: '037', notes: '88.05.25 / 효자동' },
  { id: 'm-38', name: '신해련', phone: '010-8742-6113', division: '금배부', memberNumber: '038', notes: '82.02.10' },
  { id: 'm-39', name: '염규생', phone: '010-7170-6595', division: '금배부', memberNumber: '039', notes: '80.09.13 / 삼천동' },
  { id: 'm-40', name: '오승찬', phone: '010-3857-1032', division: '동배부', memberNumber: '040', notes: '85.12.23 / 효자동' },
  { id: 'm-41', name: '온재승', phone: '010-4105-3256', division: '동배부', memberNumber: '041', notes: '79.06.26 / 만성동' },
  { id: 'm-42', name: '유경일', phone: '010-3583-2133', division: '금배부', memberNumber: '042', notes: '79.06.06 / 만성동' },
  { id: 'm-43', name: '윤찬솔', phone: '010-3369-8775', division: '동배부', memberNumber: '043', notes: '87.03.26 / 안행로' },
  { id: 'm-44', name: '은희광', phone: '010-2621-6732', division: '동배부', memberNumber: '044', notes: '60.07.05 / 삼천동' },
  { id: 'm-45', name: '이경훈', phone: '010-3675-0854', division: '동배부', memberNumber: '045', notes: '80.04.03 / 평화동' },
  { id: 'm-46', name: '이계현', phone: '010-2042-1777', division: '동배부', memberNumber: '046', notes: '60.03.16 / 평화동' },
  { id: 'm-47', name: '이병훈', phone: '010-3190-6959', division: '동배부', memberNumber: '047', notes: '79.11.23 / 평화동' },
  { id: 'm-48', name: '이성훈', phone: '010-4548-3938', division: '동배부', memberNumber: '048', notes: '85.04.23 / 효자동' },
  { id: 'm-49', name: '이종선', phone: '010-3653-3917', division: '은배부', memberNumber: '049', notes: '64.04.05 / 삼천동' },
  { id: 'm-50', name: '이창민', phone: '010-8613-9653', division: '동배부', memberNumber: '050', notes: '86.02.04 / 효자동' },
  { id: 'm-51', name: '이충효', phone: '010-6635-4757', division: '금배부', memberNumber: '051', notes: '82.12.16 / 장동' },
  { id: 'm-52', name: '임강문', phone: '010-6297-2004', division: '동배부', memberNumber: '052', notes: '82.10.21 / 효자동' },
  { id: 'm-53', name: '임상섭', phone: '010-6653-0028', division: '은배부', memberNumber: '053', notes: '89.06.29 / 백구면' },
  { id: 'm-54', name: '임태승', phone: '010-2070-6359', division: '동배부', memberNumber: '054', notes: '75.12.24 / 이서면' },
  { id: 'm-55', name: '장종석', phone: '010-3678-0847', division: '동배부', memberNumber: '055', notes: '63.04.28 / 삼천동' },
  { id: 'm-56', name: '전만국', phone: '010-4406-7503', division: '금배부', memberNumber: '056', notes: '75.05.24 / 서신동' },
  { id: 'm-57', name: '전훈', phone: '010-3680-2416', division: '동배부', memberNumber: '057', notes: '72.06.06 / 세내로' },
  { id: 'm-58', name: '정재용', phone: '010-5101-9252', division: '은배부', memberNumber: '058', notes: '94.01.16 / 송천동' },
  { id: 'm-59', name: '정진안', phone: '010-2057-5422', division: '동배부', memberNumber: '059', notes: '66.06.10 / 서신동' },
  { id: 'm-60', name: '정현욱', phone: '010-5002-7007', division: '동배부', memberNumber: '060', notes: '76.10.11 / 호암로' },
  { id: 'm-61', name: '정홍모', phone: '010-2484-8431', division: '동배부', memberNumber: '061', notes: '63.06.23 / 효자동' },
  { id: 'm-62', name: '조우영', phone: '010-9476-8380', division: '은배부', memberNumber: '062', notes: '62.04.07 / 서신동' },
  { id: 'm-63', name: '천승진', phone: '010-9616-3933', division: '은배부', memberNumber: '063', notes: '88.09.24 / 서신동' },
  { id: 'm-64', name: '최규성', phone: '010-8640-8828', division: '동배부', memberNumber: '064', notes: '52.05.20 / 삼천동' },
  { id: 'm-65', name: '최수민', phone: '010-6632-8366', division: '동배부', memberNumber: '065', notes: '91.03.02 / 삼천동' },
  { id: 'm-66', name: '편보성', phone: '010-8626-9899', division: '동배부', memberNumber: '066' },
  { id: 'm-67', name: '현대삼', phone: '', division: '동배부', memberNumber: '067' },
  { id: 'm-68', name: '홍성완', phone: '010-6366-1832', division: '동배부', memberNumber: '068', notes: '76.01.06 / 덕진동' },
];

export const HANWOOLIM_CLUB_MEMBERS: ClubMember[] = RAW_HANWOOLIM_CLUB_MEMBERS.map((m) => {
  const g = findMemberGradeInfo(m.name);
  return {
    ...m,
    grade: g?.grade,
    score: g?.score,
    division: g?.division || m.division,
  };
});

export const SAMPLE_CLUB_MEMBERS = HANWOOLIM_CLUB_MEMBERS;

// 한울림 구글 시트 '회원명부(정회원)' 공식 미수령 7명 (김영현, 김한진, 배지혁, 서영진, 석영수, 편보성, 현대삼)
// 나머지 59명은 물품(단체티) 수령 완료로 구글 시트 원본 연두색 표시 반영
export const UNRECEIVED_NAMES = new Set([
  '김영현', '김한진', '배지혁', '서영진', '석영수', '편보성', '현대삼'
]);

// 한울림 회원 명부 기반 기본 대회 참석자 68명 전체 (구글 시트 연두색 수령 59명 100% 반영)
const RAW_INITIAL_PARTICIPANTS: Participant[] = RAW_HANWOOLIM_CLUB_MEMBERS.map((m, idx) => {
  const g = findMemberGradeInfo(m.name);
  const isChecked = !UNRECEIVED_NAMES.has(m.name);
  return {
    id: `p-${idx + 1}`,
    name: m.name,
    phone: m.phone || '',
    division: g?.division || m.division || '동배부',
    group: '',
    checked: isChecked,
    checkedAt: isChecked ? '수령완료' : null,
    items: {},
    notes: m.notes || '',
    grade: g?.grade || '동',
    score: g?.score ?? 1,
  };
});

export const INITIAL_PARTICIPANTS: Participant[] = RAW_INITIAL_PARTICIPANTS.map((p) => {
  const g = findMemberGradeInfo(p.name);
  return {
    ...p,
    grade: g?.grade || p.grade || '동',
    score: g?.score ?? p.score ?? 1,
    division: g?.division || p.division || '동배부',
  };
});

// Helper functions for LocalStorage
export function loadEventConfig(): EventConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENT_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      const location = (!parsed.location || parsed.location === '올림픽공원 테니스장 1~4번 코트')
        ? '완산체련공원'
        : parsed.location;
      const primaryItemName = (!parsed.primaryItemName || parsed.primaryItemName === '참가 웰컴 패키지 (테니스 타월 & 댐프너)')
        ? '한울림 단체티'
        : parsed.primaryItemName;
      const title = (!parsed.title || parsed.title === '2026년 한울림 테니스클럽 정기 월례대회')
        ? '2026년 한울림'
        : parsed.title;

      return {
        ...INITIAL_EVENT_CONFIG,
        ...parsed,
        title,
        location,
        primaryItemName,
        gasWebhookUrl: parsed.gasWebhookUrl || DEFAULT_GAS_WEBHOOK_URL,
      };
    }
  } catch (e) {
    console.error('Failed to load event config:', e);
  }
  return INITIAL_EVENT_CONFIG;
}

export function saveEventConfig(config: EventConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENT_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save event config:', e);
  }
}

export function loadParticipants(): Participant[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);

    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sanitize legacy mock data (gift, lunch, fee) if present from previous samples
        let cleaned = parsed.map((p: any) => {
          let items = p.items || {};
          const keys = Object.keys(items);
          const isLegacyDefaultItems =
            keys.length > 0 && keys.every((k) => ['gift', 'lunch', 'fee', 'prize'].includes(k));
          if (isLegacyDefaultItems) {
            items = {};
          }

          let notes = p.notes || '';
          if (notes === '참가비 현금 납부 완료' || notes === '9시 30분 도착 예정') {
            notes = '';
          }

          let group = p.group || '';
          if (group.includes('코트') || group.includes('조')) {
            group = '';
          }

          // ★ 구글 시트 '회원명부(정회원)' 공식 마스터 등급/점수/부수 100% 매핑
          const official = findMemberGradeInfo(p.name);
          const finalGrade = official?.grade || p.grade || '동';
          const finalScore = official?.score ?? p.score ?? 1;
          const finalDivision = official?.division || (p.division && p.division !== '일반' ? p.division : '동배부');
          const clubMember = RAW_HANWOOLIM_CLUB_MEMBERS.find((m) => m.name === p.name);
          const finalPhone = p.phone || clubMember?.phone || '';

          // 수령완료(연두색) 상태 유지
          const finalChecked = !!p.checked;
          const finalCheckedAt = p.checkedAt || (finalChecked ? '수령완료' : null);

          return {
            ...p,
            checked: finalChecked,
            checkedAt: finalCheckedAt,
            phone: finalPhone,
            group,
            items,
            notes: p.notes || clubMember?.notes || '',
            grade: finalGrade,
            score: finalScore,
            division: finalDivision,
          };
        });

        // 만약 전체 회원의 수령 체크가 0명이면 구글 시트 원본 연두색 수령 현황(59명) 자동 복구
        const isAllUnchecked = cleaned.every((p) => !p.checked);
        if (isAllUnchecked) {
          cleaned = cleaned.map((p) => {
            const isGreen = !UNRECEIVED_NAMES.has(p.name);
            return {
              ...p,
              checked: isGreen,
              checkedAt: isGreen ? '수령완료' : null,
            };
          });
        }

        localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(cleaned));
        return [...cleaned].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
      }
    }
  } catch (e) {
    console.error('Failed to load participants:', e);
  }
  
  return [...INITIAL_PARTICIPANTS].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
}

/**
 * 구글 시트 '회원명부(정회원)'에서 가져온 등급 및 점수를 전체 참가자 목록에 즉시 일괄 적용
 */
export function syncParticipantsWithSheetGrades(
  participants: Participant[],
  gradeData: Array<{ name: string; grade: string; score: number | string; division?: string }>
): Participant[] {
  const gradeMap = new Map<string, { grade: string; score: number; division: string }>();
  gradeData.forEach((item) => {
    if (!item.name) return;
    const cleanName = item.name.trim();
    const cleanGrade = (item.grade || '동').trim();
    const numScore = typeof item.score === 'number' ? item.score : parseInt(String(item.score).replace(/[^0-9]/g, ''), 10) || 1;
    const div = item.division || (cleanGrade.startsWith('금') ? '금배부' : cleanGrade.startsWith('은') ? '은배부' : '동배부');
    gradeMap.set(cleanName, { grade: cleanGrade, score: numScore, division: div });
  });

  const updated = participants.map((p) => {
    const match = gradeMap.get(p.name.trim());
    if (match) {
      return {
        ...p,
        grade: match.grade,
        score: match.score,
        division: match.division,
      };
    }
    return p;
  });

  saveBulkCustomMemberGrades(gradeData);
  saveParticipants(updated);
  return updated;
}

export function saveParticipants(participants: Participant[]): void {
  try {
    const sorted = Array.isArray(participants)
      ? [...participants].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'))
      : [];
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(sorted));
  } catch (e) {
    console.error('Failed to save participants:', e);
  }
}

export function loadClubMembers(): ClubMember[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CLUB_MEMBERS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return [...parsed].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
      }
    }
  } catch (e) {
    console.error('Failed to load club members:', e);
  }
  return [...HANWOOLIM_CLUB_MEMBERS].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
}

export function saveClubMembers(members: ClubMember[]): void {
  try {
    const sorted = Array.isArray(members)
      ? [...members].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'))
      : [];
    localStorage.setItem(STORAGE_KEYS.CLUB_MEMBERS, JSON.stringify(sorted));
  } catch (e) {
    console.error('Failed to save club members:', e);
  }
}

export function loadSyncHistory(): SyncHistoryEntry[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SYNC_HISTORY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load sync history:', e);
  }
  return [];
}

export function saveSyncHistory(history: SyncHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SYNC_HISTORY, JSON.stringify(history.slice(-50)));
  } catch (e) {
    console.error('Failed to save sync history:', e);
  }
}

/**
 * Helper to format badge notes (e.g. "100 (L)" -> { icon: "🎁", text: "L" }, "105 (XL)" -> { icon: "🎁", text: "XL" })
 */
export function formatBadgeNote(notes?: string): { icon: string; text: string } | null {
  if (!notes || !notes.trim()) return null;
  const trimmed = notes.trim();

  // If note has parenthesis e.g. "100 (L)" or "105(XL)" or "110 (2XL)" -> extract "L", "XL", "2XL"
  const parenMatch = trimmed.match(/\(([A-Za-z0-9]+)\)/);
  if (parenMatch) {
    return { icon: '🎁', text: parenMatch[1].trim() };
  }

  // If e.g. "L(100)" -> extract "L"
  const prefixMatch = trimmed.match(/^([A-Za-z0-9]+)\s*\(/);
  if (prefixMatch) {
    return { icon: '🎁', text: prefixMatch[1].trim() };
  }

  return { icon: '🎁', text: trimmed };
}

/**
 * Smart Roster Parser
 * Converts various text formats into structured Participant objects:
 * - "이름사이즈강명규100 (L)강석원100 (L)..." (continuous string or table paste)
 * - "1. 홍길동(금배) 010-1234-5678 100(L)"
 * - "홍길동, 김철수, 박영희"
 * - "홍길동 / 은배 / 1코트"
 * - Tab-separated lines from spreadsheets
 */
export function parsePastedRoster(rawText: string, membersMaster: ClubMember[] = []): Participant[] {
  if (!rawText || !rawText.trim()) return [];
  const masterList = Array.isArray(membersMaster) ? membersMaster.filter(Boolean) : [];

  // 1. Strip top-level table header tokens
  let cleanedText = rawText
    .replace(/^(?:이름\s*사이즈|이름\s*비고|순번\s*이름\s*사이즈|참가자|참석자|명단|번호\s*이름\s*사이즈|순번\s*이름|이름\s*전화번호\s*사이즈|이름)[\s\:\t\-]*/gi, '')
    .trim();

  // 2. If the text has no newlines or is a single concatenated block with repetitive name+size patterns
  // (e.g. "강명규100 (L)강석원100 (L)강운석100 (L)..." or "강명규 100(L) 강석원 100(L)")
  if (!cleanedText.includes('\n') || cleanedText.includes('(L)') || cleanedText.includes('(XL)') || cleanedText.includes('(2XL)')) {
    // Insert newlines between concatenated name+size entries
    cleanedText = cleanedText.replace(/(\([A-Za-z0-9]+\)|(?:2XL|3XL|XL|XXL|L|M|S))(?=[가-힣]{2,4})/g, '$1\n');
  }

  const lines = cleanedText
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      // Skip pure header lines
      if (/^(?:이름|사이즈|순번|번호|비고|전화번호|부수|조|코트)[\s\t]*$/i.test(l)) return false;
      if (/^(?:이름\s*사이즈|이름\s*비고|순번\s*이름)[\s\t]*$/i.test(l)) return false;
      return true;
    });

  const results: Participant[] = [];

  for (const line of lines) {
    // Check if line contains multiple comma-separated names
    if (line.includes(',') && !line.includes('010-')) {
      const names = line.split(',').map((n) => n.trim()).filter(Boolean);
      for (const n of names) {
        const cleanName = n.replace(/^[\d\.\-\)\s]+/, '').trim();
        if (cleanName) {
          const matched = masterList.find((m) => m && m.name === cleanName);
          results.push({
            id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            name: cleanName,
            division: matched?.division || '일반',
            phone: matched?.phone || '',
            checked: false,
            checkedAt: null,
            items: {},
            notes: matched?.notes || '',
          });
        }
      }
      continue;
    }

    // Process single line
    let remaining = line;

    // 1. Strip leading numbering like "1.", "1)", "- "
    remaining = remaining.replace(/^[\d]+[\.\)\-\:\s]+/, '').trim();
    remaining = remaining.replace(/^[-*•]\s+/, '').trim();

    // 2. Extract phone number (e.g., 010-1234-5678 or 01012345678)
    let phone = '';
    const phoneMatch = remaining.match(/(01[0-9]-?\d{3,4}-?\d{4})/);
    if (phoneMatch) {
      phone = phoneMatch[1].replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
      remaining = remaining.replace(phoneMatch[0], '').trim();
    }

    // 3. Extract court or group (e.g., "1코트", "A조", "코트1")
    let group = '';
    const groupMatch = remaining.match(/(\d+코트|[A-Za-z]조|코트\d+)/);
    if (groupMatch) {
      group = groupMatch[1];
      remaining = remaining.replace(groupMatch[0], '').trim();
    }

    // 4. Extract division (e.g., "(금배)", "(금배부)", "[은배]", "동배", "신인", "마스터즈")
    let division: any = '일반';
    const divMatch = remaining.match(/[\(\[\{]?(금배부?|은배부?|동배부?|신인부?|마스터즈?|게스트|일반)[\)\]\}]?/);
    if (divMatch) {
      const rawDiv = divMatch[1];
      if (rawDiv.startsWith('금')) division = '금배부';
      else if (rawDiv.startsWith('은')) division = '은배부';
      else if (rawDiv.startsWith('동')) division = '동배부';
      else if (rawDiv.startsWith('신인')) division = '신인부';
      else if (rawDiv.startsWith('마스터')) division = '마스터즈';
      else if (rawDiv.startsWith('게스트')) division = '게스트';
      else division = '일반';

      remaining = remaining.replace(divMatch[0], '').trim();
    }

    // 5. Extract notes / T-shirt size (e.g., "100 (L)", "105 (XL)", "110 (2XL)", "XL(105)", "100(L)", "105", "100", "95", "XL", "L", "M", "2XL", "3XL", "S")
    let parsedNotes = '';
    const sizeMatch = remaining.match(/((?:90|95|100|105|110|115|120)\s*(?:\([A-Za-z0-9]+\))?|(?:2XL|3XL|XL|XXL|L|M|S)\s*(?:\(\d+\))?)/i);
    if (sizeMatch) {
      parsedNotes = sizeMatch[1].trim();
      remaining = remaining.replace(sizeMatch[0], '').trim();
    }

    // 5.5 Extract grade & score (e.g., "은A(4점)", "은A 4점", "은A", "금B(7점)", "동(2점)")
    let parsedGrade = '';
    let parsedScore: number | undefined = undefined;
    const gradeMatch = remaining.match(/[\(\[\{]?(금[B-E]|은[AB]|동)[\)\]\}]?(?:\s*[\(\[]?(\d+)점?[\)\]]?)?/i);
    if (gradeMatch) {
      parsedGrade = gradeMatch[1].toUpperCase();
      if (gradeMatch[2]) {
        parsedScore = parseInt(gradeMatch[2], 10);
      }
      remaining = remaining.replace(gradeMatch[0], '').trim();
    }

    // 6. Clean up name and extra notes
    // If there is extra note after "-" or "/" (e.g. "홍길동 - 라켓백")
    if (remaining.includes('-') || remaining.includes('/')) {
      const parts = remaining.split(/[-/]/);
      if (parts.length > 1 && parts[1].trim()) {
        const extra = parts.slice(1).join(' ').trim();
        if (extra && !parsedNotes) {
          parsedNotes = extra;
        }
        remaining = parts[0].trim();
      }
    }

    remaining = remaining.replace(/[\/\|\t]/g, ' ').trim();
    const nameMatch = remaining.match(/^[^\s]+/);
    const name = nameMatch ? nameMatch[0].trim() : remaining.trim();

    if (name && name.length >= 2) {
      // Look up member from master DB if exists to enrich info
      const matchedMember = masterList.find((m) => m && m.name === name);
      const gradeInfo = findMemberGradeInfo(name, parsedGrade || matchedMember?.grade, parsedScore ?? matchedMember?.score);
      const finalDivision = division !== '일반' 
        ? division 
        : (matchedMember?.division && matchedMember.division !== '일반')
        ? matchedMember.division
        : (gradeInfo?.division || '일반');
      const finalPhone = phone || matchedMember?.phone || '';
      const finalNotes = parsedNotes || matchedMember?.notes || '';
      const finalGrade = parsedGrade || matchedMember?.grade || gradeInfo?.grade;
      const finalScore = parsedScore ?? matchedMember?.score ?? gradeInfo?.score;

      results.push({
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name,
        division: finalDivision,
        phone: finalPhone,
        group,
        checked: false,
        checkedAt: null,
        items: {},
        notes: finalNotes,
        grade: finalGrade,
        score: finalScore,
      });
    }
  }

  // 항상 이름 오름차순 (ㄱ->ㅎ) 정렬하여 반환
  return results.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
}
