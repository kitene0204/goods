import { EventConfig, Participant, ClubMember, SyncHistoryEntry } from '../types';

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

// 한울림 테니스클럽 전체 회원 DB (가나다 오름차순 정렬 73명)
export const HANWOOLIM_CLUB_MEMBERS: ClubMember[] = [
  { id: 'm-1', name: '강명규', phone: '', division: '일반', memberNumber: '001' },
  { id: 'm-2', name: '강석원', phone: '', division: '일반', memberNumber: '002' },
  { id: 'm-3', name: '강운석', phone: '', division: '일반', memberNumber: '003' },
  { id: 'm-4', name: '강전성', phone: '', division: '일반', memberNumber: '004' },
  { id: 'm-5', name: '고광직', phone: '', division: '일반', memberNumber: '005' },
  { id: 'm-6', name: '권용국', phone: '', division: '일반', memberNumber: '006' },
  { id: 'm-7', name: '김동찬', phone: '', division: '일반', memberNumber: '007' },
  { id: 'm-8', name: '김선경', phone: '', division: '일반', memberNumber: '008' },
  { id: 'm-9', name: '김영수', phone: '', division: '일반', memberNumber: '009' },
  { id: 'm-10', name: '김영현', phone: '', division: '일반', memberNumber: '010' },
  { id: 'm-11', name: '김요셉', phone: '', division: '일반', memberNumber: '011' },
  { id: 'm-12', name: '김일태', phone: '', division: '일반', memberNumber: '012' },
  { id: 'm-13', name: '김재선', phone: '', division: '일반', memberNumber: '013' },
  { id: 'm-14', name: '김준관', phone: '', division: '일반', memberNumber: '014' },
  { id: 'm-15', name: '김준동', phone: '', division: '일반', memberNumber: '015' },
  { id: 'm-16', name: '김진규', phone: '', division: '일반', memberNumber: '016' },
  { id: 'm-17', name: '김태균', phone: '', division: '일반', memberNumber: '017' },
  { id: 'm-18', name: '김한준', phone: '', division: '일반', memberNumber: '018' },
  { id: 'm-19', name: '김한진', phone: '', division: '일반', memberNumber: '019' },
  { id: 'm-20', name: '김현우', phone: '', division: '일반', memberNumber: '020' },
  { id: 'm-21', name: '문범준', phone: '', division: '일반', memberNumber: '021' },
  { id: 'm-22', name: '문현덕', phone: '', division: '일반', memberNumber: '022' },
  { id: 'm-23', name: '박공래', phone: '', division: '일반', memberNumber: '023' },
  { id: 'm-24', name: '박광전', phone: '', division: '일반', memberNumber: '024' },
  { id: 'm-25', name: '박력', phone: '', division: '일반', memberNumber: '025' },
  { id: 'm-26', name: '박의경', phone: '', division: '일반', memberNumber: '026' },
  { id: 'm-27', name: '박정태', phone: '', division: '일반', memberNumber: '027' },
  { id: 'm-28', name: '배동연', phone: '', division: '일반', memberNumber: '028' },
  { id: 'm-29', name: '배정민', phone: '', division: '일반', memberNumber: '029' },
  { id: 'm-30', name: '배지혁', phone: '', division: '일반', memberNumber: '030' },
  { id: 'm-31', name: '서영진', phone: '', division: '일반', memberNumber: '031' },
  { id: 'm-32', name: '서예찬', phone: '', division: '일반', memberNumber: '032' },
  { id: 'm-33', name: '서재원', phone: '', division: '일반', memberNumber: '033' },
  { id: 'm-34', name: '서재원w', phone: '', division: '일반', memberNumber: '034' },
  { id: 'm-35', name: '석영수', phone: '', division: '일반', memberNumber: '035' },
  { id: 'm-36', name: '송인한', phone: '', division: '일반', memberNumber: '036' },
  { id: 'm-37', name: '송준민', phone: '', division: '일반', memberNumber: '037' },
  { id: 'm-38', name: '신민철', phone: '', division: '일반', memberNumber: '038' },
  { id: 'm-39', name: '신성화', phone: '', division: '일반', memberNumber: '039' },
  { id: 'm-40', name: '신해련', phone: '', division: '일반', memberNumber: '040' },
  { id: 'm-41', name: '염규생', phone: '', division: '일반', memberNumber: '041' },
  { id: 'm-42', name: '오승찬', phone: '', division: '일반', memberNumber: '042' },
  { id: 'm-43', name: '온재승', phone: '', division: '일반', memberNumber: '043' },
  { id: 'm-44', name: '유경일', phone: '', division: '일반', memberNumber: '044' },
  { id: 'm-45', name: '유봉수', phone: '', division: '일반', memberNumber: '045' },
  { id: 'm-46', name: '윤찬솔', phone: '', division: '일반', memberNumber: '046' },
  { id: 'm-47', name: '은희광', phone: '', division: '일반', memberNumber: '047' },
  { id: 'm-48', name: '이경훈', phone: '', division: '일반', memberNumber: '048' },
  { id: 'm-49', name: '이계현', phone: '', division: '일반', memberNumber: '049' },
  { id: 'm-50', name: '이병훈', phone: '', division: '일반', memberNumber: '050' },
  { id: 'm-51', name: '이성훈', phone: '', division: '일반', memberNumber: '051' },
  { id: 'm-52', name: '이정식', phone: '', division: '일반', memberNumber: '052' },
  { id: 'm-53', name: '이종선', phone: '', division: '일반', memberNumber: '053' },
  { id: 'm-54', name: '이창민', phone: '', division: '일반', memberNumber: '054' },
  { id: 'm-55', name: '이충효', phone: '', division: '일반', memberNumber: '055' },
  { id: 'm-56', name: '임강문', phone: '', division: '일반', memberNumber: '056' },
  { id: 'm-57', name: '임상섭', phone: '', division: '일반', memberNumber: '057' },
  { id: 'm-58', name: '임태승', phone: '', division: '일반', memberNumber: '058' },
  { id: 'm-59', name: '장종석', phone: '', division: '일반', memberNumber: '059' },
  { id: 'm-60', name: '전만국', phone: '', division: '일반', memberNumber: '060' },
  { id: 'm-61', name: '전훈', phone: '', division: '일반', memberNumber: '061' },
  { id: 'm-62', name: '정재용', phone: '', division: '일반', memberNumber: '062' },
  { id: 'm-63', name: '정진안', phone: '', division: '일반', memberNumber: '063' },
  { id: 'm-64', name: '정현욱', phone: '', division: '일반', memberNumber: '064' },
  { id: 'm-65', name: '정홍모', phone: '', division: '일반', memberNumber: '065' },
  { id: 'm-66', name: '조우영', phone: '', division: '일반', memberNumber: '066' },
  { id: 'm-67', name: '천승진', phone: '', division: '일반', memberNumber: '067' },
  { id: 'm-68', name: '최규성', phone: '', division: '일반', memberNumber: '068' },
  { id: 'm-69', name: '최수민', phone: '', division: '일반', memberNumber: '069' },
  { id: 'm-70', name: '편보성', phone: '', division: '일반', memberNumber: '070' },
  { id: 'm-71', name: '한언석', phone: '', division: '일반', memberNumber: '071' },
  { id: 'm-72', name: '현대삼', phone: '', division: '일반', memberNumber: '072' },
  { id: 'm-73', name: '홍성완', phone: '', division: '일반', memberNumber: '073' },
];

export const SAMPLE_CLUB_MEMBERS = HANWOOLIM_CLUB_MEMBERS;

// 한울림 회원 명부 기반 기본 대회 참석자 (가나다 오름차순, 비고란 지원)
export const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'p-1',
    name: '강명규',
    phone: '',
    division: '일반',
    group: '',
    checked: false,
    checkedAt: null,
    items: {},
    notes: '100 (L)',
  },
  {
    id: 'p-2',
    name: '강석원',
    phone: '',
    division: '일반',
    group: '',
    checked: true,
    checkedAt: '18:55',
    items: {},
    notes: '100 (L)',
  },
  {
    id: 'p-3',
    name: '강운석',
    phone: '',
    division: '일반',
    group: '',
    checked: false,
    checkedAt: null,
    items: {},
    notes: '100 (L)',
  },
  {
    id: 'p-4',
    name: '강전성',
    phone: '',
    division: '일반',
    group: '',
    checked: false,
    checkedAt: null,
    items: {},
    notes: '100 (L)',
  },
  {
    id: 'p-5',
    name: '고광직',
    phone: '',
    division: '일반',
    group: '',
    checked: false,
    checkedAt: null,
    items: {},
    notes: '105 (XL)',
  },
  {
    id: 'p-6',
    name: '권용국',
    phone: '',
    division: '일반',
    group: '',
    checked: false,
    checkedAt: null,
    items: {},
    notes: '110 (2XL)',
  },
  {
    id: 'p-7',
    name: '김동찬',
    phone: '',
    division: '일반',
    group: '',
    checked: false,
    checkedAt: null,
    items: {},
    notes: '105 (XL)',
  },
  {
    id: 'p-8',
    name: '김선경',
    phone: '',
    division: '일반',
    group: '',
    checked: true,
    checkedAt: '15:51',
    items: {},
    notes: '100 (L)',
  },
  {
    id: 'p-9',
    name: '김영수',
    phone: '',
    division: '일반',
    group: '',
    checked: false,
    checkedAt: null,
    items: {},
    notes: '100 (L)',
  },
  {
    id: 'p-10',
    name: '김영현',
    phone: '',
    division: '일반',
    group: '',
    checked: false,
    checkedAt: null,
    items: {},
    notes: '105 (XL)',
  },
  {
    id: 'p-11',
    name: '김요셉',
    phone: '',
    division: '일반',
    group: '',
    checked: false,
    checkedAt: null,
    items: {},
    notes: '105 (XL)',
  },
  {
    id: 'p-12',
    name: '배지혁',
    phone: '',
    division: '일반',
    group: '',
    checked: false,
    checkedAt: null,
    items: {},
    notes: '100 (L)',
  },
];

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
        const cleaned = parsed.map((p: any) => {
          let items = p.items || {};
          // Check if items only contain the old default keys
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

          return {
            ...p,
            group,
            items,
            notes,
          };
        });

        return [...cleaned].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
      }
    }
  } catch (e) {
    console.error('Failed to load participants:', e);
  }
  return [...INITIAL_PARTICIPANTS].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
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
      const finalDivision = division !== '일반' ? division : (matchedMember?.division || '일반');
      const finalPhone = phone || matchedMember?.phone || '';
      const finalNotes = parsedNotes || matchedMember?.notes || '';

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
      });
    }
  }

  // 항상 이름 오름차순 (ㄱ->ㅎ) 정렬하여 반환
  return results.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
}
