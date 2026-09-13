import React from 'react';
import { EventConfig, Participant, MainAppTab } from '../types';
import { 
  Trophy, 
  Settings, 
  Users, 
  Share2, 
  Sun, 
  Moon, 
  Gift, 
  Sparkles, 
  FileSpreadsheet,
  MapPin,
  Calendar,
  RefreshCw,
  Zap,
  CreditCard,
  Megaphone,
  CheckSquare,
  Cake
} from 'lucide-react';

interface HeaderProps {
  config: EventConfig;
  participants: Participant[];
  activeTab: MainAppTab;
  onSelectTab: (tab: MainAppTab) => void;
  onOpenAgeModal?: () => void;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAgo?: string;
  isPollingActive?: boolean;
  isSupabaseConnected?: boolean;
  onPollNow?: () => void;
  onOpenSettings: () => void;
  onOpenRoster: () => void;
  onOpenGoogleSheet: () => void;
  onOpenSupabase: () => void;
  onOpenLuckyDraw: () => void;
  onToggleTheme: () => void;
  onCycleFontSize: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  participants,
  activeTab,
  onSelectTab,
  syncStatus = 'synced',
  lastSyncedAgo = '방금 전',
  isPollingActive = true,
  isSupabaseConnected = true,
  onPollNow,
  onOpenSettings,
  onOpenRoster,
  onOpenGoogleSheet,
  onOpenSupabase,
  onOpenLuckyDraw,
  onToggleTheme,
  onCycleFontSize,
}) => {
  const isNightTheme = config.theme === 'night-court';
  const total = participants.length;
  const checkedCount = participants.filter((p) => p.checked).length;
  const percentage = total > 0 ? ((checkedCount / total) * 100).toFixed(1) : '0.0';

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-lg border-b border-slate-800 transition-colors">
      {/* Top Main Nav Bar */}
      <div className="px-3 sm:px-6 py-2 sm:py-3 flex justify-between items-center gap-2">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            onClick={() => onSelectTab('checkin')}
            className="bg-lime-400 p-2 sm:p-2.5 rounded-xl flex items-center justify-center text-slate-950 shadow-md shadow-lime-400/20 shrink-0 cursor-pointer active:scale-95 transition-transform"
            title="한울림 대시보드 메인으로 이동"
          >
            <span className="text-base sm:text-lg font-black">🎾</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-nowrap">
              <button
                onClick={() => onSelectTab('checkin')}
                className="text-base sm:text-lg font-black tracking-tight select-none text-left cursor-pointer hover:text-lime-300 transition-colors whitespace-nowrap"
              >
                한울림 <span className="text-lime-400">대시보드</span>
              </button>
              <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold whitespace-nowrap truncate max-w-[110px] sm:max-w-[150px]">
                {config.clubName || '한울림 테니스클럽'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden xs:block whitespace-nowrap">
              {config.title || '월례대회 & 회원 관리'}
            </p>
          </div>
        </div>

        {/* Center: Frequently used feature tabs (Visible on large screens) */}
        <div className="hidden lg:flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 1. 회비 & 등급 관리 탭 버튼 */}
          <button
            id="header-fee-btn"
            onClick={() => onSelectTab('fee')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 whitespace-nowrap ${
              activeTab === 'fee'
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-indigo-600/30'
                : 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40 hover:border-indigo-400'
            }`}
            title="한울림 회비 & 등급 관리 탭 열기"
          >
            <CreditCard className="w-4 h-4 text-indigo-300" />
            <span className="whitespace-nowrap">회비 & 등급 관리</span>
            <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.2 rounded font-mono font-bold whitespace-nowrap">
              HOT
            </span>
          </button>

          {/* 2. 월례대회 공지 알리미 탭 버튼 */}
          <button
            id="header-notice-btn"
            onClick={() => onSelectTab('notice')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 whitespace-nowrap ${
              activeTab === 'notice'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/30'
                : 'bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-500/40 hover:border-amber-400'
            }`}
            title="월례대회 공지 알리미 탭 열기"
          >
            <Megaphone className="w-4 h-4 text-amber-300" />
            <span className="whitespace-nowrap">공지 알리미</span>
            <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-mono font-bold whitespace-nowrap">
              공지
            </span>
          </button>

          {/* 3. 회원 연령 & 출생연도 탭 버튼 */}
          <button
            id="header-age-btn"
            onClick={() => onSelectTab('age')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 whitespace-nowrap ${
              activeTab === 'age'
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-emerald-600/30'
                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 hover:border-emerald-400'
            }`}
            title="회원 연령 및 출생연도 조견표 열기"
          >
            <Cake className="w-4 h-4 text-emerald-300" />
            <span className="whitespace-nowrap">회원 연령</span>
            <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded font-mono font-bold whitespace-nowrap">
              58명
            </span>
          </button>

          {/* 4. 한울림 정보 & 2025 결산 구글 시트 탭 버튼 */}
          <button
            id="header-sheet-btn"
            onClick={() => onSelectTab('sheet')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 whitespace-nowrap ${
              activeTab === 'sheet'
                ? 'bg-teal-600 text-white ring-2 ring-teal-300 shadow-teal-600/30'
                : 'bg-teal-950/80 hover:bg-teal-900 text-teal-200 border border-teal-500/40 hover:border-teal-400'
            }`}
            title="한울림 구글 시트 및 2025 회계 결산 열기"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-300" />
            <span className="whitespace-nowrap">구글 시트</span>
            <span className="text-[9px] bg-teal-400 text-slate-950 px-1.5 py-0.2 rounded font-mono font-bold whitespace-nowrap">
              결산
            </span>
          </button>
        </div>

        {/* Right: Operational controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Check-in Tab button if not currently on checkin */}
          {activeTab !== 'checkin' && (
            <button
              onClick={() => onSelectTab('checkin')}
              className="bg-lime-400 hover:bg-lime-300 text-slate-950 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl font-black text-xs sm:text-sm transition-all shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            >
              <CheckSquare className="w-4 h-4" />
              <span className="whitespace-nowrap">출석 체크</span>
            </button>
          )}

          {/* Supabase Button */}
          <button
            id="header-supabase-btn"
            onClick={onOpenSupabase}
            className="hidden sm:flex bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-xs items-center gap-1.5 cursor-pointer"
            title="Supabase 실시간 클라우드 설정"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span className="font-extrabold hidden md:inline">실시간 DB</span>
          </button>

          {/* Google Sheets Sync */}
          <button
            id="header-sheets-btn"
            onClick={onOpenGoogleSheet}
            className="hidden md:flex bg-white text-slate-900 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-slate-200 transition-colors shadow-xs items-center gap-1 cursor-pointer"
            title="구글 시트 동기화"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>시트</span>
          </button>

          {/* Roster Management */}
          <button
            id="header-roster-btn"
            onClick={onOpenRoster}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
            title="참석자 명단 관리"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>명단</span>
          </button>

          {/* Lucky Draw */}
          <button
            id="header-luckydraw-btn"
            onClick={onOpenLuckyDraw}
            className="hidden sm:flex items-center gap-1 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
            title="경품 추첨기 (럭키드로우)"
          >
            <Gift className="w-4 h-4" />
          </button>

          {/* Settings Modal Button */}
          <button
            id="header-settings-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="대회 설정"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar (Scrollable on mobile) */}
      <div className="bg-slate-950/90 px-2 sm:px-6 py-1.5 flex items-center justify-between border-t border-slate-800/80 text-xs overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            id="subnav-tab-checkin"
            onClick={() => onSelectTab('checkin')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'checkin'
                ? 'bg-slate-800 text-lime-400 border border-slate-700 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🎾 출석 체크</span>
            <span className="text-[10px] bg-slate-700/80 text-slate-300 px-1.5 py-0.2 rounded-full font-mono whitespace-nowrap">
              {checkedCount}/{total}
            </span>
          </button>

          <button
            id="subnav-tab-fee"
            onClick={() => onSelectTab('fee')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'fee'
                ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-600/60 shadow-xs'
                : 'text-slate-400 hover:text-indigo-300'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
            <span className="whitespace-nowrap">💳 회비 & 등급 관리</span>
          </button>

          <button
            id="subnav-tab-notice"
            onClick={() => onSelectTab('notice')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'notice'
                ? 'bg-amber-900/80 text-amber-200 border border-amber-600/60 shadow-xs'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="whitespace-nowrap">📢 공지 알리미</span>
          </button>

          <button
            id="subnav-tab-age"
            onClick={() => onSelectTab('age')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'age'
                ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-600/60 shadow-xs'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <Cake className="w-3.5 h-3.5 text-emerald-400" />
            <span className="whitespace-nowrap">🎂 회원 연령</span>
          </button>

          <button
            id="subnav-tab-sheet"
            onClick={() => onSelectTab('sheet')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sheet'
                ? 'bg-teal-900/80 text-teal-200 border border-teal-600/60 shadow-xs'
                : 'text-slate-400 hover:text-teal-300'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
            <span className="whitespace-nowrap">📑 구글 시트 결산</span>
          </button>
        </div>

        {/* Realtime Supabase status badge */}
        <div className="hidden md:flex items-center gap-2 shrink-0 ml-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 whitespace-nowrap">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-emerald-400 font-bold whitespace-nowrap">실시간 동기화</span>
          </div>
        </div>
      </div>
    </header>
  );
};

