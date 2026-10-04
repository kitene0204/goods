import React from 'react';
import { 
  Database, 
  UploadCloud, 
  DownloadCloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  SlidersHorizontal,
  Info
} from 'lucide-react';

interface DatabaseSyncBarProps {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAgo?: string;
  lastSyncedTime?: string;
  isPushing: boolean;
  isPulling: boolean;
  onPush: () => void;
  onPull: () => void;
  totalParticipants: number;
  checkedCount: number;
  onOpenSupabaseModal?: () => void;
}

export const DatabaseSyncBar: React.FC<DatabaseSyncBarProps> = ({
  status,
  lastSyncedAgo = '방금 전',
  lastSyncedTime,
  isPushing,
  isPulling,
  onPush,
  onPull,
  totalParticipants,
  checkedCount,
  onOpenSupabaseModal,
}) => {
  const isSyncing = status === 'syncing' || isPushing || isPulling;

  return (
    <section 
      aria-label="데이터베이스 동기화 및 저장/불러오기 패널"
      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 sm:p-4 transition-all"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Database Title & Sync Status with prominent Icons */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs border border-slate-800">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>클라우드 DB 동기화</span>
              </h3>

              {/* Status with Icons: 동기화 중 vs 완료 상태 vs 오류 */}
              {isSyncing ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>동기화 중...</span>
                </span>
              ) : status === 'error' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>동기화 오류</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>완료 상태 (동기화 완료)</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
              <span>
                마지막 반영: <strong className="text-slate-700">{lastSyncedTime || lastSyncedAgo}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="hidden sm:inline">
                참석 인원: <strong className="text-slate-700">{checkedCount}/{totalParticipants}명</strong>
              </span>
            </p>
          </div>
        </div>

        {/* Right: Push & Pull Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* 1. 슈파베이스에 저장하기 (Push) Button */}
          <button
            id="syncbar-push-btn"
            onClick={onPush}
            disabled={isSyncing}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs shadow-xs hover:shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap"
            title="현재 화면의 모든 참가자 및 수령 상태를 슈파베이스 클라우드에 즉시 저장합니다 (Push)"
          >
            {isPushing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4 text-emerald-100" />
            )}
            <span>슈파베이스에 저장하기 (Push)</span>
          </button>

          {/* 2. 데이터베이스에서 불러오기 (Pull) Button */}
          <button
            id="syncbar-pull-btn"
            onClick={onPull}
            disabled={isSyncing}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-lime-400 font-black text-xs shadow-xs hover:shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap"
            title="슈파베이스 클라우드 데이터베이스의 최신 데이터를 화면으로 가져옵니다 (Pull)"
          >
            {isPulling ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <DownloadCloud className="w-4 h-4 text-lime-400" />
            )}
            <span>데이터베이스에서 불러오기 (Pull)</span>
          </button>

          {/* 3. Settings / Config Button */}
          {onOpenSupabaseModal && (
            <button
              id="syncbar-settings-btn"
              onClick={onOpenSupabaseModal}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
              title="Supabase 실시간 클라우드 DB 연동 설정 열기"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Helpful Quick Guide Line */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 truncate">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            <strong>[저장하기 Push]</strong>는 현재 데이터를 DB에 올리고, <strong>[불러오기 Pull]</strong>은 DB의 최신 명단을 가져옵니다.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-slate-400 font-mono text-[10px] shrink-0">
          <span>0.1초 실시간 연동 지원</span>
        </div>
      </div>
    </section>
  );
};
