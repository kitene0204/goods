import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  Database,
  Smartphone,
  Laptop
} from 'lucide-react';
import { Participant } from '../types';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  bulkUpsertParticipantsToSupabase,
  fetchParticipantsFromSupabase,
} from '../utils/supabaseClient';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onUpdateParticipants: (newList: Participant[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  isConnected: boolean;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  participants,
  onUpdateParticipants,
  onShowToast,
  isConnected,
}) => {
  const [credentials, setCredentials] = useState(() => getSupabaseCredentials());
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState(credentials.url);
  const [keyInput, setKeyInput] = useState(credentials.key);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSaveCredentials = () => {
    saveSupabaseCredentials(urlInput, keyInput);
    setCredentials(getSupabaseCredentials());
    setIsEditing(false);
    onShowToast('Supabase 설정이 저장되었습니다. 실시간 연결을 시도합니다.', 'success');
  };

  const handlePushAllToCloud = async () => {
    setIsSyncing(true);
    try {
      const ok = await bulkUpsertParticipantsToSupabase(participants);
      if (ok) {
        onShowToast(`⚡ ${participants.length}명의 참석자 명단이 Supabase 클라우드로 즉시 업로드되었습니다!`, 'success');
      } else {
        onShowToast('업로드 실패: Supabase SQL 에디터에서 테이블을 먼저 생성했는지 확인하세요.', 'error');
      }
    } catch (e) {
      onShowToast('업로드 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsSyncing(true);
    try {
      const remote = await fetchParticipantsFromSupabase();
      if (remote && remote.length > 0) {
        onUpdateParticipants(remote);
        onShowToast(`📥 클라우드에서 ${remote.length}명의 최신 명단을 불러왔습니다!`, 'success');
      } else if (remote && remote.length === 0) {
        onShowToast('클라우드 DB에 데이터가 없습니다. [전체 명단 클라우드로 업로드]를 먼저 눌러주세요.', 'info');
      } else {
        onShowToast('불러오기 실패: 연결 정보를 확인해 주세요.', 'error');
      }
    } catch (e) {
      onShowToast('클라우드 조회 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const sqlSchema = `-- Supabase SQL Editor에서 실행할 코드
create table if not exists participants (
  id text primary key,
  name text not null,
  division text default '일반',
  phone text,
  "group" text,
  checked boolean default false,
  checked_at text,
  is_proxy boolean default false,
  proxy_name text,
  notes text,
  items jsonb default '{}'::jsonb,
  raffle_winner_prize text,
  updated_at timestamp with time zone default now()
);

-- 모든 기기 0.1초 실시간 방송(Realtime) 활성화
alter publication supabase_realtime add table participants;

-- 누구나 체크인 가능하도록 권한 허용
alter table participants enable row level security;
create policy "Allow all public access" on participants for all using (true) with check (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    onShowToast('SQL 스크립트가 클립보드에 복사되었습니다!', 'success');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-5 h-5 fill-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Supabase 실시간 클라우드 DB
                {isConnected ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    실시간 연동 중 (0.1초)
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    연결 대기 중
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">스마트폰, 태블릿, PC 간 지연 없는 100% 실시간 자동 동기화</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Quick Realtime Feature Highlight */}
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 flex items-center gap-3">
            <div className="flex -space-x-2 text-slate-300">
              <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                <Laptop className="w-4 h-4 text-sky-400" />
              </div>
            </div>
            <div className="text-xs">
              <span className="font-bold text-white">현장 멀티 디바이스 동기화:</span>
              <p className="text-slate-400">어떤 기기(스마트폰/PC)에서 체크하든 0.1초 만에 다른 모든 화면에 체크 표시가 뜹니다.</p>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handlePushAllToCloud}
              disabled={isSyncing}
              className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-500/20 active:scale-98 disabled:opacity-50"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              <span>전체 명단 클라우드로 업로드 ({participants.length}명)</span>
            </button>

            <button
              onClick={handlePullFromCloud}
              disabled={isSyncing}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>클라우드에서 최신 상태 불러오기</span>
            </button>
          </div>

          {/* Connected Keys / Edit info */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                등록된 Supabase API 연동 정보
              </span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-lime-400 hover:underline cursor-pointer"
              >
                {isEditing ? '취소' : '연결 정보 수정'}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Project URL</label>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://xxxx.supabase.co"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Publishable (Anon) Key</label>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="sb_publishable_..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={handleSaveCredentials}
                  className="w-full py-2 bg-emerald-500 text-slate-900 font-bold rounded-lg text-xs hover:bg-emerald-400 cursor-pointer"
                >
                  저장하고 다시 연결하기
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 text-xs font-mono text-slate-300">
                <div className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">URL:</span>
                  <span className="truncate max-w-[320px] text-emerald-300">{credentials.url}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">KEY:</span>
                  <span className="truncate max-w-[320px] text-slate-400">
                    {credentials.key.slice(0, 16)}••••••••••••••••••••
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SQL Reference if table not yet created */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-400" />
                Supabase SQL Editor 설정 코드 (최초 1회 실행)
              </span>
              <button
                onClick={handleCopySql}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">복사됨!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>SQL 복사</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-2.5 rounded bg-slate-900 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-28 leading-relaxed border border-slate-850">
              {sqlSchema}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
