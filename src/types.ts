export type TournamentDivision = '금배부' | '은배부' | '동배부' | '신인부' | '마스터즈' | '일반' | '게스트';

export interface CheckItem {
  id: string;
  name: string;
  badgeColor?: string;
}

export interface Participant {
  id: string;
  name: string;
  phone?: string;
  division: TournamentDivision | string;
  group?: string; // e.g. "A조", "1코트"
  checked: boolean; // Primary check state
  checkedAt: string | null; // ISO string or format 'HH:mm:ss'
  items: Record<string, boolean>; // e.g. { 'gift': true, 'lunch': false, 'prize': false, 'fee': true }
  itemsTimestamps?: Record<string, string>;
  notes?: string;
  isProxy?: boolean; // 대리 수령 여부
  proxyName?: string; // 대리 수령자 이름
  raffleWinnerPrize?: string; // 럭키드로우 당첨 상품
}

export interface ClubMember {
  id: string;
  name: string;
  phone: string;
  division: TournamentDivision | string;
  gender?: '남' | '여';
  ntrp?: string; // e.g., "3.5", "4.0"
  memberNumber?: string;
}

export interface EventConfig {
  id: string;
  title: string; // e.g. "2026년 8월 에이스 테니스클럽 정기 월례대회"
  clubName: string;
  date: string; // YYYY-MM-DD
  location: string; // e.g. "올림픽공원 테니스장 1~4코트"
  primaryItemName: string; // 기본 수령물품명 e.g. "참가 기념품 (테니스 타월 & 댐프너)"
  items: CheckItem[];
  multiItemMode: boolean; // 다중 항목 체크 모드 활성화 여부
  gasWebhookUrl: string; // Google Apps Script Webhook URL
  googleSheetUrl: string; // View spreadsheet link
  theme: 'outdoor-court' | 'night-court' | 'classic-emerald';
  fontSize: 'normal' | 'large' | 'xlarge';
}

export interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  eventTitle: string;
  totalCount: number;
  checkedCount: number;
  status: 'success' | 'failed' | 'local_only';
  message: string;
  syncPayloadSnippet?: string;
}

export type FilterTab = 'all' | 'checked' | 'unchecked';
