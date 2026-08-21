import React from 'react';
import { EventConfig, Participant } from '../types';
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
  Image as ImageIcon
} from 'lucide-react';

interface HeaderProps {
  config: EventConfig;
  participants: Participant[];
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAgo?: string;
  isPollingActive?: boolean;
  isSupabaseConnected?: boolean;
  onPollNow?: () => void;
  onOpenSettings: () => void;
  onOpenRoster: () => void;
  onOpenGoogleSheet: () => void;
  onOpenSupabase: () => void;
  onOpenThumbnail?: () => void;
  onOpenLuckyDraw: () => void;
  onToggleTheme: () => void;
  onCycleFontSize: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  participants,
  syncStatus = 'synced',
  lastSyncedAgo = '방금 전',
  isPollingActive = true,
  isSupabaseConnected = true,
  onPollNow,
  onOpenSettings,
  onOpenRoster,
  onOpenGoogleSheet,
  onOpenSupabase,
  onOpenThumbnail,
  onOpenLuckyDraw,
  onToggleTheme,
  onCycleFontSize,
}) => {
  const isNightTheme = config.theme === 'night-court';
  const total = participants.length;
  const checkedCount = participants.filter((p) => p.checked).length;
  const percentage = total > 0 ? ((checkedCount / total) * 100).toFixed(1) : '0.0';

  return (
    <nav className="sticky top-0 z-30 bg-slate-900 text-white px-4 sm:px-6 py-3 flex justify-between items-center shadow-lg border-b border-slate-800 transition-colors">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3 min-w-0">
        <div className="bg-lime-400 p-2 sm:p-2.5 rounded-xl flex items-center justify-center text-slate-900 shadow-md shadow-lime-400/20 shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base sm:text-xl font-black tracking-tight italic select-none">
              TENNIS CHECK-IN <span className="text-lime-400">PRO</span>
            </h1>
            <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium truncate max-w-[140px]">
              {config.clubName || '테니스 클럽'}
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate hidden xs:block">
            {config.title || '정기 월례대회'}
          </p>
        </div>
      </div>

      {/* Center: Realtime Supabase live pill */}
      <div className="hidden lg:flex items-center gap-2">
        <button
          onClick={onOpenSupabase}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-750 border border-emerald-500/30 text-xs font-medium cursor-pointer transition-all shadow-xs group"
          title="Supabase 실시간 클라우드 DB 연동 상태 (모든 기기 0.1초 동기화)"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="text-emerald-400 font-extrabold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-emerald-400" />
            실시간 클라우드 DB
          </span>
          <span className="text-[11px] text-slate-400 group-hover:text-white transition-colors">
            (0.1초 연동)
          </span>
        </button>
      </div>

      {/* Right: Real-time Stats & Actions */}
      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
        {/* Live Status Counter */}
        <div className="text-right hidden sm:block">
          <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">현재 수령 현황</p>
          <p className="text-base sm:text-lg font-black text-lime-400 font-mono">
            {checkedCount} / {total} <span className="text-xs text-slate-300 font-normal">({percentage}%)</span>
          </p>
        </div>

        {/* Supabase Button (Mobile/Tablet visible) */}
        <button
          id="header-supabase-btn"
          onClick={onOpenSupabase}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          title="Supabase 실시간 클라우드 설정"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span className="font-extrabold hidden xs:inline">실시간 DB</span>
        </button>

        {/* Primary Sync Button (Google Sheets) */}
        <button
          id="header-sheets-btn"
          onClick={onOpenGoogleSheet}
          className="bg-white text-slate-900 px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm hover:bg-slate-200 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          title="구글 시트 동기화 및 엑셀 다운로드"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          <span className="font-extrabold">구글 시트</span>
        </button>

        {/* Roster Management */}
        <button
          id="header-roster-btn"
          onClick={onOpenRoster}
          className="hidden md:flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
          title="참석자 명단 관리"
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span>명단관리</span>
          <span className="text-[11px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded-full font-mono">
            {participants.length}
          </span>
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

        {/* Thumbnail Preview Modal Button */}
        {onOpenThumbnail && (
          <button
            id="header-thumbnail-btn"
            onClick={onOpenThumbnail}
            className="hidden sm:flex items-center gap-1 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-lime-400 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
            title="앱 정사각형 썸네일 보기 및 다운로드"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        )}

        {/* Font Size Toggle */}
        <button
          id="header-fontsize-toggle"
          onClick={onCycleFontSize}
          className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer"
          title="글자 크기 조절"
        >
          {config.fontSize === 'xlarge' ? '가++' : config.fontSize === 'large' ? '가+' : '가'}
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
    </nav>
  );
};
