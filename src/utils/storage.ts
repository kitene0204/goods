import { EventConfig, Participant, ClubMember, SyncHistoryEntry } from '../types';

const STORAGE_KEYS = {
  EVENT_CONFIG: 'tennis_checkin_event_config',
  PARTICIPANTS: 'tennis_checkin_participants',
  CLUB_MEMBERS: 'tennis_checkin_club_members',
  SYNC_HISTORY: 'tennis_checkin_sync_history',
};

export const DEFAULT_GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzb9ZQbZUuQVD-EjM_TZ3R2LSaIZPcpMmZDpizbcR0YKNLm8i7bIPiXVUCtvAVA8NryfQ/exec';

export const INITIAL_EVENT_CONFIG: EventConfig = {
  id: 'event-2026-08',
  title: '2026년 8월 에이스 테니스클럽 정기 월례대회',
  clubName: '에이스 테니스클럽',
  date: '2026-08-16',
  location: '올림픽공원 테니스장 1~4번 코트',
  primaryItemName: '참가 웰컴 패키지 (테니스 타월 & 댐프너)',
  items: [
    { id: 'gift', name: '참가 기념품', badgeColor: 'bg-emerald-500' },
    { id: 'lunch', name: '도시락/음료', badgeColor: 'bg-amber-500' },
    { id: 'fee', name: '참가비 납부', badgeColor: 'bg-blue-500' },
    { id: 'prize', name: '경품/추첨권', badgeColor: 'bg-purple-500' },
  ],
  multiItemMode: false, // Default is simple fast single-tap mode
  gasWebhookUrl: DEFAULT_GAS_WEBHOOK_URL,
  googleSheetUrl: '',
  theme: 'outdoor-court',
  fontSize: 'normal',
};

export const SAMPLE_CLUB_MEMBERS: ClubMember[] = [
  { id: 'm-1', name: '김민수', phone: '010-2345-6789', division: '금배부', gender: '남', ntrp: '4.5', memberNumber: '001' },
  { id: 'm-2', name: '이수진', phone: '010-3456-7890', division: '은배부', gender: '여', ntrp: '3.5', memberNumber: '002' },
  { id: 'm-3', name: '박준형', phone: '010-4567-8901', division: '금배부', gender: '남', ntrp: '4.0', memberNumber: '003' },
  { id: 'm-4', name: '최유나', phone: '010-5678-9012', division: '동배부', gender: '여', ntrp: '3.0', memberNumber: '004' },
  { id: 'm-5', name: '정태우', phone: '010-6789-0123', division: '신인부', gender: '남', ntrp: '2.5', memberNumber: '005' },
  { id: 'm-6', name: '강동원', phone: '010-7890-1234', division: '마스터즈', gender: '남', ntrp: '5.0', memberNumber: '006' },
  { id: 'm-7', name: '한지민', phone: '010-8901-2345', division: '은배부', gender: '여', ntrp: '3.5', memberNumber: '007' },
  { id: 'm-8', name: '윤도현', phone: '010-9012-3456', division: '동배부', gender: '남', ntrp: '3.0', memberNumber: '008' },
  { id: 'm-9', name: '송혜교', phone: '010-1122-3344', division: '은배부', gender: '여', ntrp: '3.5', memberNumber: '009' },
  { id: 'm-10', name: '조인성', phone: '010-2233-4455', division: '금배부', gender: '남', ntrp: '4.0', memberNumber: '010' },
  { id: 'm-11', name: '배수지', phone: '010-3344-5566', division: '동배부', gender: '여', ntrp: '3.0', memberNumber: '011' },
  { id: 'm-12', name: '유재석', phone: '010-4455-6677', division: '마스터즈', gender: '남', ntrp: '4.5', memberNumber: '012' },
  { id: 'm-13', name: '하동훈', phone: '010-5566-7788', division: '신인부', gender: '남', ntrp: '2.5', memberNumber: '013' },
  { id: 'm-14', name: '김태희', phone: '010-6677-8899', division: '은배부', gender: '여', ntrp: '3.5', memberNumber: '014' },
  { id: 'm-15', name: '현빈', phone: '010-7788-9900', division: '금배부', gender: '남', ntrp: '4.5', memberNumber: '015' },
  { id: 'm-16', name: '손예진', phone: '010-8899-0011', division: '은배부', gender: '여', ntrp: '3.5', memberNumber: '016' },
  { id: 'm-17', name: '이광수', phone: '010-9900-1122', division: '동배부', gender: '남', ntrp: '3.0', memberNumber: '017' },
  { id: 'm-18', name: '송지효', phone: '010-1234-9876', division: '은배부', gender: '여', ntrp: '3.5', memberNumber: '018' },
  { id: 'm-19', name: '지석진', phone: '010-2345-8765', division: '신인부', gender: '남', ntrp: '2.5', memberNumber: '019' },
  { id: 'm-20', name: '김종국', phone: '010-3456-7654', division: '마스터즈', gender: '남', ntrp: '5.0', memberNumber: '020' },
  { id: 'm-21', name: '차은우', phone: '010-4567-6543', division: '금배부', gender: '남', ntrp: '4.0', memberNumber: '021' },
  { id: 'm-22', name: '아이유', phone: '010-5678-5432', division: '신인부', gender: '여', ntrp: '2.5', memberNumber: '022' },
];

export const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'p-1',
    name: '김민수',
    phone: '010-2345-6789',
    division: '금배부',
    group: '1코트',
    checked: true,
    checkedAt: '08:42',
    items: { gift: true, lunch: true, fee: true, prize: false },
    notes: '참가비 현금 납부 완료',
  },
  {
    id: 'p-2',
    name: '이수진',
    phone: '010-3456-7890',
    division: '은배부',
    group: '2코트',
    checked: true,
    checkedAt: '08:50',
    items: { gift: true, lunch: false, fee: true, prize: false },
  },
  {
    id: 'p-3',
    name: '박준형',
    phone: '010-4567-8901',
    division: '금배부',
    group: '1코트',
    checked: false,
    checkedAt: null,
    items: { gift: false, lunch: false, fee: true, prize: false },
    notes: '9시 30분 도착 예정',
  },
  {
    id: 'p-4',
    name: '최유나',
    phone: '010-5678-9012',
    division: '동배부',
    group: '3코트',
    checked: true,
    checkedAt: '09:05',
    items: { gift: true, lunch: true, fee: true, prize: true },
    isProxy: true,
    proxyName: '한지민',
    notes: '지민 회원님이 대리 수령',
  },
  {
    id: 'p-5',
    name: '정태우',
    phone: '010-6789-0123',
    division: '신인부',
    group: '4코트',
    checked: false,
    checkedAt: null,
    items: { gift: false, lunch: false, fee: false, prize: false },
  },
  {
    id: 'p-6',
    name: '강동원',
    phone: '010-7890-1234',
    division: '마스터즈',
    group: '1코트',
    checked: true,
    checkedAt: '09:12',
    items: { gift: true, lunch: true, fee: true, prize: false },
  },
  {
    id: 'p-7',
    name: '한지민',
    phone: '010-8901-2345',
    division: '은배부',
    group: '2코트',
    checked: true,
    checkedAt: '09:15',
    items: { gift: true, lunch: true, fee: true, prize: false },
  },
  {
    id: 'p-8',
    name: '윤도현',
    phone: '010-9012-3456',
    division: '동배부',
    group: '3코트',
    checked: false,
    checkedAt: null,
    items: { gift: false, lunch: false, fee: true, prize: false },
  },
  {
    id: 'p-9',
    name: '송혜교',
    phone: '010-1122-3344',
    division: '은배부',
    group: '2코트',
    checked: false,
    checkedAt: null,
    items: { gift: false, lunch: false, fee: true, prize: false },
  },
  {
    id: 'p-10',
    name: '조인성',
    phone: '010-2233-4455',
    division: '금배부',
    group: '1코트',
    checked: true,
    checkedAt: '09:25',
    items: { gift: true, lunch: false, fee: true, prize: false },
  },
  {
    id: 'p-11',
    name: '배수지',
    phone: '010-3344-5566',
    division: '동배부',
    group: '3코트',
    checked: false,
    checkedAt: null,
    items: { gift: false, lunch: false, fee: false, prize: false },
  },
  {
    id: 'p-12',
    name: '유재석',
    phone: '010-4455-6677',
    division: '마스터즈',
    group: '1코트',
    checked: true,
    checkedAt: '09:30',
    items: { gift: true, lunch: true, fee: true, prize: true },
  },
  {
    id: 'p-13',
    name: '하동훈',
    phone: '010-5566-7788',
    division: '신인부',
    group: '4코트',
    checked: false,
    checkedAt: null,
    items: { gift: false, lunch: false, fee: true, prize: false },
  },
  {
    id: 'p-14',
    name: '김태희',
    phone: '010-6677-8899',
    division: '은배부',
    group: '2코트',
    checked: true,
    checkedAt: '09:35',
    items: { gift: true, lunch: true, fee: true, prize: false },
  },
  {
    id: 'p-15',
    name: '현빈',
    phone: '010-7788-9900',
    division: '금배부',
    group: '1코트',
    checked: true,
    checkedAt: '09:40',
    items: { gift: true, lunch: true, fee: true, prize: false },
  },
  {
    id: 'p-16',
    name: '손예진',
    phone: '010-8899-0011',
    division: '은배부',
    group: '2코트',
    checked: true,
    checkedAt: '09:41',
    items: { gift: true, lunch: true, fee: true, prize: false },
  },
];

// Helper functions for LocalStorage
export function loadEventConfig(): EventConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENT_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_EVENT_CONFIG,
        ...parsed,
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
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load participants:', e);
  }
  return INITIAL_PARTICIPANTS;
}

export function saveParticipants(participants: Participant[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants || []));
  } catch (e) {
    console.error('Failed to save participants:', e);
  }
}

export function loadClubMembers(): ClubMember[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CLUB_MEMBERS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load club members:', e);
  }
  return SAMPLE_CLUB_MEMBERS;
}

export function saveClubMembers(members: ClubMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CLUB_MEMBERS, JSON.stringify(members || []));
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
    localStorage.setItem(STORAGE_KEYS.SYNC_HISTORY, JSON.stringify(history.slice(0, 30)));
  } catch (e) {
    console.error('Failed to save sync history:', e);
  }
}

/**
 * Parses raw text copied from KakaoTalk poll / Excel / memo into structured participants.
 * Handles formats like:
 * - "1. 홍길동(금배) 010-1234-5678"
 * - "김철수, 이영희, 박민수"
 * - "홍길동 / 은배 / 1코트"
 * - Tab-separated lines from spreadsheets
 */
export function parsePastedRoster(rawText: string, membersMaster: ClubMember[] = []): Participant[] {
  if (!rawText || !rawText.trim()) return [];
  const masterList = Array.isArray(membersMaster) ? membersMaster.filter(Boolean) : [];

  const lines = rawText
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsedList: Participant[] = [];
  const seenNames = new Set<string>();

  // Helper: check if a chunk is a division
  const detectDivision = (str: string): string => {
    if (/금배|골드|gold/i.test(str)) return '금배부';
    if (/은배|실버|silver/i.test(str)) return '은배부';
    if (/동배|브론즈|bronze/i.test(str)) return '동배부';
    if (/신인|루키|비기너|입문/i.test(str)) return '신인부';
    if (/마스터|베테랑|오픈/i.test(str)) return '마스터즈';
    return '일반';
  };

  // Helper: extract phone
  const detectPhone = (str: string): string | undefined => {
    const match = str.match(/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/);
    return match ? match[0].replace(/\s+/g, '') : undefined;
  };

  for (const line of lines) {
    // If line has multiple names separated by comma or bullet
    const subItems = line.includes(',') ? line.split(',') : [line];

    for (let sub of subItems) {
      sub = sub.trim();
      if (!sub) continue;

      // Strip leading sequence numbers like "1. ", "1) ", "① ", "[1] "
      sub = sub.replace(/^(\d+[\.\)]|\[\d+\]|[\u2460-\u2473]|\-|\*)\s*/, '');

      // Check if there is division inside parentheses: "홍길동(은배)"
      let division = '일반';
      const parenMatch = sub.match(/\(([^)]+)\)/);
      if (parenMatch) {
        division = detectDivision(parenMatch[1]);
        sub = sub.replace(/\([^)]+\)/, '').trim();
      }

      // Check for phone number
      const phone = detectPhone(sub);
      if (phone) {
        sub = sub.replace(phone, '').trim();
      }

      // Split by slash, space, or tab
      const tokens = sub.split(/[\/\t\s]+/).filter(Boolean);
      if (tokens.length === 0) continue;

      const name = tokens[0].replace(/[^a-zA-Z가-힣0-9]/g, '');
      if (!name || name.length < 2) continue;

      // Extract division from other tokens if not found in paren
      if (division === '일반' && tokens.length > 1) {
        for (let i = 1; i < tokens.length; i++) {
          const div = detectDivision(tokens[i]);
          if (div !== '일반') {
            division = div;
            break;
          }
        }
      }

      // Look up member from master DB if exists to enrich info
      const matchedMember = masterList.find((m) => m && m.name === name);
      const finalDivision = division !== '일반' ? division : (matchedMember?.division || '일반');
      const finalPhone = phone || matchedMember?.phone || '';

      const key = `${name}_${finalDivision}`;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        parsedList.push({
          id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name,
          phone: finalPhone,
          division: finalDivision,
          group: tokens.find((t) => /코트|조$/.test(t)) || '',
          checked: false,
          checkedAt: null,
          items: {},
          notes: '',
        });
      }
    }
  }

  return parsedList;
}
