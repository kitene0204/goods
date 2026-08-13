import React, { useState, useEffect } from 'react';
import { Participant, EventConfig } from '../types';
import { 
  X, 
  Trophy, 
  Gift, 
  Sparkles, 
  RotateCcw, 
  Check, 
  Users, 
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LuckyDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  config: EventConfig;
  onRecordWinner: (participantId: string, prizeName: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const PRIZE_PRESETS = [
  '윌슨 US오픈 테니스공 1박스 (24캔)',
  '바볼랏 퓨어 드라이브 라켓 백팩',
  '요넥스 수퍼그립 30입 벌크세트',
  '나이키 테니스 손목밴드 & 타월 세트',
  '바볼랏 커스텀 댐프너 & 오버그립',
  '스타벅스 아메리카노 2잔 기프티콘',
  '테니스 스트링 1회 무료 교환권',
  '대회 특별 행운상 (라켓 그립 테이프)',
];

export const LuckyDrawModal: React.FC<LuckyDrawModalProps> = ({
  isOpen,
  onClose,
  participants,
  config,
  onRecordWinner,
  onShowToast,
}) => {
  const [selectedPrize, setSelectedPrize] = useState(PRIZE_PRESETS[0]);
  const [customPrize, setCustomPrize] = useState('');
  const [poolType, setPoolType] = useState<'all' | 'checkedOnly'>('all');
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState<string>('?');
  const [winner, setWinner] = useState<Participant | null>(null);
  const [pastWinners, setPastWinners] = useState<{ prize: string; winnerName: string; division: string }[]>([]);

  if (!isOpen) return null;

  const eligiblePool = participants.filter((p) => {
    if (poolType === 'checkedOnly') return p.checked;
    return true;
  });

  const finalPrizeName = customPrize.trim() || selectedPrize;

  const handleStartDraw = () => {
    if (eligiblePool.length === 0) {
      onShowToast('추첨 대상 인원이 없습니다.', 'error');
      return;
    }

    setIsSpinning(true);
    setWinner(null);

    let counter = 0;
    const totalFlips = 25;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * eligiblePool.length);
      setCurrentDisplayName(eligiblePool[randomIdx].name);
      counter++;

      if (counter >= totalFlips) {
        clearInterval(interval);
        const finalWinner = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
        setCurrentDisplayName(finalWinner.name);
        setWinner(finalWinner);
        setIsSpinning(false);

        // Confetti explosion
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#84cc16'],
          });
        } catch {}

        // Add to past winners list
        setPastWinners((prev) => [
          { prize: finalPrizeName, winnerName: finalWinner.name, division: finalWinner.division },
          ...prev,
        ]);

        // Record to participant state
        onRecordWinner(finalWinner.id, finalPrizeName);
        onShowToast(`🎉 축하합니다! ${finalWinner.name} (${finalWinner.division}) 회원님이 당첨되셨습니다!`, 'success');
      }
    }, 80);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>월례대회 경품 럭키드로우</span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  현장 추첨
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">참석자 중 행운의 경품 당첨자를 공정하게 실시간 추첨합니다.</p>
            </div>
          </div>
          <button
            id="lucky-modal-close"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Prize Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Gift className="w-3.5 h-3.5 text-amber-600" />
              <span>추첨할 경품 선택:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
              {PRIZE_PRESETS.map((prize) => (
                <button
                  key={prize}
                  onClick={() => {
                    setSelectedPrize(prize);
                    setCustomPrize('');
                  }}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all truncate cursor-pointer ${
                    selectedPrize === prize && !customPrize
                      ? 'bg-amber-100 text-amber-950 border-amber-300 font-black shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  🎁 {prize}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={customPrize}
              onChange={(e) => setCustomPrize(e.target.value)}
              placeholder="또는 직접 경품명 입력 (예: 바볼랏 스트링 세트)..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Pool selection */}
          <div className="flex flex-wrap items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-700 font-bold">추첨 대상:</span>
            <label className="flex items-center gap-1.5 text-slate-800 cursor-pointer font-medium">
              <input
                type="radio"
                name="poolType"
                value="all"
                checked={poolType === 'all'}
                onChange={() => setPoolType('all')}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span>전체 참가자 ({participants.length}명)</span>
            </label>
            <label className="flex items-center gap-1.5 text-slate-800 cursor-pointer font-medium">
              <input
                type="radio"
                name="poolType"
                value="checkedOnly"
                checked={poolType === 'checkedOnly'}
                onChange={() => setPoolType('checkedOnly')}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span>수령 완료자만 ({participants.filter((p) => p.checked).length}명)</span>
            </label>
          </div>

          {/* Big Raffle Display Box */}
          <div className="p-6 rounded-3xl bg-slate-900 text-center space-y-4 relative overflow-hidden shadow-xl border border-slate-800">
            <div className="text-xs font-black text-lime-400 uppercase tracking-widest">
              [ {finalPrizeName} ]
            </div>

            {/* Spinning Name Display */}
            <div className="py-2">
              <div
                className={`text-4xl sm:text-5xl font-black tracking-tight transition-all duration-100 ${
                  isSpinning
                    ? 'text-amber-400 scale-105 blur-[0.3px]'
                    : winner
                    ? 'text-lime-400 scale-110'
                    : 'text-white'
                }`}
              >
                {currentDisplayName === '?' ? '🎾 ? 🎾' : currentDisplayName}
              </div>

              {winner && (
                <div className="mt-2 text-xs font-bold text-lime-400 animate-in fade-in">
                  🎉 당첨을 축하드립니다! ({winner.division} {winner.phone || ''})
                </div>
              )}
            </div>

            {/* Spin Trigger Button */}
            <button
              id="spin-lucky-draw-btn"
              onClick={handleStartDraw}
              disabled={isSpinning || eligiblePool.length === 0}
              className="w-full py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 font-black text-base shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span>{isSpinning ? '두구두구 추첨 중...' : '행운의 주인공 추첨하기!'}</span>
            </button>
          </div>

          {/* Past Winners List */}
          {pastWinners.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-600">이번 대회 당첨자 내역:</div>
              <div className="max-h-28 overflow-y-auto space-y-1 rounded-2xl bg-slate-50 p-2 border border-slate-200">
                {pastWinners.map((w, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-slate-200 shadow-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-black text-slate-900">{w.winnerName}</span>
                      <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-bold">{w.division}</span>
                    </div>
                    <span className="text-amber-700 text-xs font-bold truncate max-w-[200px]">{w.prize}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
