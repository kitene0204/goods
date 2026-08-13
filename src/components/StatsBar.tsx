import React, { useState } from 'react';
import { Participant, EventConfig, FilterTab } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Users, 
  Copy, 
  Check, 
  RotateCcw, 
  CheckCheck,
  Send,
  Sparkles
} from 'lucide-react';
import { generateUnreceivedKakaoMessage } from '../utils/gasSync';

interface StatsBarProps {
  participants: Participant[];
  config: EventConfig;
  activeFilter: FilterTab;
  onFilterChange: (filter: FilterTab) => void;
  onMarkAllChecked: () => void;
  onResetAllChecked: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  participants,
  config,
  activeFilter,
  onFilterChange,
  onMarkAllChecked,
  onResetAllChecked,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState<'markAll' | 'resetAll' | null>(null);

  const total = participants.length;
  const checkedCount = participants.filter((p) => p.checked).length;
  const uncheckCount = total - checkedCount;
  const percentage = total > 0 ? ((checkedCount / total) * 100).toFixed(1) : '0.0';

  const handleCopyKakao = async () => {
    try {
      const message = generateUnreceivedKakaoMessage(config, participants);
      await navigator.clipboard.writeText(message);
      setCopied(true);
      onShowToast(
        uncheckCount === 0
          ? '🎉 전원 수령 완료 메시지가 복사되었습니다!'
          : `📢 미수령자(${uncheckCount}명) 카톡 알림 문구가 복사되었습니다!`,
        'success'
      );
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast('클립보드 복사에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Top Progress & Stats Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Numbers Display */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-lime-400 text-slate-950 font-black shadow-sm shrink-0 border border-lime-500">
            <span className="text-xl font-mono">{Math.round(Number(percentage))}%</span>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>수령 진행 현황</span>
              {Number(percentage) >= 100 && total > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-slate-900 bg-lime-400 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> 100% 완료!
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                {checkedCount}
              </span>
              <span className="text-sm font-bold text-slate-400">/ {total}명</span>
              <span className="text-xs font-semibold text-slate-600 ml-1">
                (미수령: <span className="font-bold text-amber-600">{uncheckCount}명</span>)
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons for Manager */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Kakao Copy Button */}
          <button
            id="stats-kakao-copy-btn"
            onClick={handleCopyKakao}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm cursor-pointer ${
              copied
                ? 'bg-slate-900 text-lime-400'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
            }`}
            title="미수령자 명단 카톡 공지용 복사"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '복사 완료!' : uncheckCount === 0 ? '완료 공지 복사' : `미수령자(${uncheckCount}) 카톡 공지`}</span>
          </button>

          {/* Batch Menu Toggle */}
          <div className="relative">
            {showBatchConfirm === null ? (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  id="stats-batch-all-btn"
                  onClick={() => setShowBatchConfirm('markAll')}
                  disabled={uncheckCount === 0}
                  className="p-1.5 rounded-lg hover:bg-white disabled:opacity-40 disabled:pointer-events-none text-slate-700 text-xs font-medium transition-all cursor-pointer"
                  title="전원 수령 완료 처리"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                </button>
                <button
                  id="stats-batch-reset-btn"
                  onClick={() => setShowBatchConfirm('resetAll')}
                  disabled={checkedCount === 0}
                  className="p-1.5 rounded-lg hover:bg-white disabled:opacity-40 disabled:pointer-events-none text-slate-700 text-xs font-medium transition-all cursor-pointer"
                  title="수령 기록 전체 초기화"
                >
                  <RotateCcw className="w-4 h-4 text-rose-500" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-300 shadow-md animate-in fade-in zoom-in-95">
                <span className="text-[11px] text-slate-700 px-1 font-bold">
                  {showBatchConfirm === 'markAll' ? '전원 완료?' : '전체 초기화?'}
                </span>
                <button
                  id="stats-batch-confirm-yes"
                  onClick={() => {
                    if (showBatchConfirm === 'markAll') onMarkAllChecked();
                    else onResetAllChecked();
                    setShowBatchConfirm(null);
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-lime-400 text-[11px] font-black rounded-lg cursor-pointer"
                >
                  확인
                </button>
                <button
                  id="stats-batch-confirm-no"
                  onClick={() => setShowBatchConfirm(null)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold rounded-lg cursor-pointer"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden p-0.5">
        <div
          className="h-full rounded-full bg-lime-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Filter Segmented Control Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
        <button
          id="filter-tab-all"
          onClick={() => onFilterChange('all')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 text-slate-400" />
          <span>전체 명단</span>
          <span className={`font-mono text-xs px-1.5 py-0.2 rounded-full ${activeFilter === 'all' ? 'bg-slate-800 text-lime-400 font-bold' : 'bg-slate-100 text-slate-600'}`}>
            {total}
          </span>
        </button>

        <button
          id="filter-tab-checked"
          onClick={() => onFilterChange('checked')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeFilter === 'checked'
              ? 'bg-lime-500 text-slate-950 font-black shadow-sm'
              : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>수령 완료</span>
          <span className={`font-mono text-xs px-1.5 py-0.2 rounded-full ${activeFilter === 'checked' ? 'bg-lime-600 text-white font-bold' : 'bg-emerald-100 text-emerald-800'}`}>
            {checkedCount}
          </span>
        </button>

        <button
          id="filter-tab-unchecked"
          onClick={() => onFilterChange('unchecked')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeFilter === 'unchecked'
              ? 'bg-slate-900 text-amber-300 font-black shadow-sm'
              : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
          }`}
        >
          <Circle className="w-4 h-4 text-amber-500" />
          <span>미수령</span>
          <span className={`font-mono text-xs px-1.5 py-0.2 rounded-full ${activeFilter === 'unchecked' ? 'bg-slate-800 text-amber-300 font-bold' : 'bg-amber-100 text-amber-800'}`}>
            {uncheckCount}
          </span>
        </button>
      </div>
    </div>
  );
};
