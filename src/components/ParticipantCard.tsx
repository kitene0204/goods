import React, { useState } from 'react';
import { Participant, EventConfig } from '../types';
import { 
  Check, 
  Clock, 
  Phone, 
  UserCheck, 
  Edit3, 
  Trophy, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  Trash2, 
  UserX,
  MessageSquare,
  Gift
} from 'lucide-react';
import { formatBadgeNote } from '../utils/storage';

interface ParticipantCardProps {
  participant: Participant;
  config: EventConfig;
  index: number;
  viewMode?: 'grid' | 'list';
  onToggleCheck: (id: string) => void;
  onToggleItem: (id: string, itemId: string) => void;
  onUpdateParticipant: (id: string, updates: Partial<Participant>) => void;
  onDeleteParticipant: (id: string) => void;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  config,
  index,
  viewMode = 'grid',
  onToggleCheck,
  onToggleItem,
  onUpdateParticipant,
  onDeleteParticipant,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(participant.notes || '');
  const [proxyDraft, setProxyDraft] = useState(participant.proxyName || '');
  const [isProxyDraft, setIsProxyDraft] = useState(participant.isProxy || false);

  const displayIndex = String(index + 1).padStart(2, '0');

  const getDivisionBadgeColor = (division: string) => {
    switch (division) {
      case '금배부':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case '은배부':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case '동배부':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case '신인부':
        return 'bg-lime-100 text-lime-900 border-lime-400';
      case '마스터즈':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleSaveDetails = () => {
    onUpdateParticipant(participant.id, {
      notes: notesDraft.trim(),
      isProxy: isProxyDraft,
      proxyName: isProxyDraft ? proxyDraft.trim() : '',
    });
    setIsEditingNotes(false);
  };

  // 1. GRID CARD VIEW (Matching the Professional Polish Design HTML)
  if (viewMode === 'grid') {
    return (
      <div
        id={`participant-card-${participant.id}`}
        onClick={() => onToggleCheck(participant.id)}
        className={`p-4 rounded-2xl flex flex-col justify-between transition-all duration-150 cursor-pointer select-none relative min-h-[148px] ${
          participant.checked
            ? 'bg-lime-500 text-white shadow-md border-2 border-lime-600 transform scale-[1.01] hover:scale-[1.02] active:scale-95'
            : 'bg-white p-4 shadow-sm border border-slate-200 hover:border-slate-400 hover:shadow-md active:scale-95 text-slate-800'
        }`}
        title={participant.checked ? '터치하여 수령 취소' : '터치하여 수령 완료 체크'}
      >
        {/* Top No & Division Tag */}
        <div className="flex items-center justify-between">
          <p className={`text-xs font-bold uppercase tracking-wider ${participant.checked ? 'opacity-85 text-white' : 'text-slate-400'}`}>
            No. {displayIndex}
          </p>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            participant.checked ? 'bg-lime-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            {participant.division || '일반'}
          </span>
        </div>

        {/* Middle Name & Notes (T-Shirt Size / Remark) */}
        <div className="my-1.5 min-w-0">
          <p className={`text-2xl sm:text-3xl font-black tracking-tight truncate ${participant.checked ? 'text-white' : 'text-slate-900'}`}>
            {participant.name}
          </p>
          {(() => {
            const badge = formatBadgeNote(participant.notes);
            if (badge) {
              return (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 text-xs sm:text-sm font-black px-2 py-0.5 rounded-lg truncate max-w-full shadow-xs ${
                      participant.checked
                        ? 'bg-lime-800/80 text-white border border-lime-300/40'
                        : 'bg-amber-50 text-slate-900 border border-amber-300'
                    }`}
                    title={participant.notes}
                  >
                    <span>{badge.icon}</span>
                    <span className="truncate">{badge.text}</span>
                  </span>
                  {participant.phone && (
                    <span className={`text-[11px] font-mono ${participant.checked ? 'text-lime-100' : 'text-slate-400'}`}>
                      · {participant.phone.slice(-4)}
                    </span>
                  )}
                </div>
              );
            }
            if (participant.phone) {
              return (
                <p className={`text-[11px] font-mono truncate mt-0.5 ${participant.checked ? 'text-lime-100' : 'text-slate-400'}`}>
                  {participant.phone}
                </p>
              );
            }
            return null;
          })()}
        </div>

        {/* Bottom Status Row */}
        <div className="flex justify-between items-center mt-1">
          {participant.checked ? (
            <>
              <span className="text-xs bg-lime-600 px-2.5 py-1 rounded-full font-bold">
                수령 완료 {participant.checkedAt ? `(${participant.checkedAt})` : ''}
              </span>
              <svg className="w-6 h-6 text-white shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-400 font-medium italic">
                미수령 (터치시 체크)
              </p>
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0" />
            </>
          )}
        </div>
      </div>
    );
  }

  // 2. DETAILED LIST VIEW
  return (
    <div
      id={`participant-card-${participant.id}`}
      className={`rounded-2xl border transition-all duration-150 overflow-hidden ${
        participant.checked
          ? 'bg-lime-50/60 border-lime-400 shadow-sm'
          : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Main Row */}
      <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
        {/* Left: Tactile Checkbox + Name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            id={`check-btn-${participant.id}`}
            onClick={() => onToggleCheck(participant.id)}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-150 active:scale-90 cursor-pointer shadow-sm ${
              participant.checked
                ? 'bg-lime-500 text-white shadow-lime-500/30'
                : 'bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-400'
            }`}
            title={participant.checked ? '수령 취소하기' : '수령 완료 체크하기'}
          >
            {participant.checked ? (
              <Check className="w-6 h-6 stroke-[3]" />
            ) : (
              <span className="text-xs font-mono font-bold text-slate-500">{displayIndex}</span>
            )}
          </button>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-slate-900 tracking-tight text-lg sm:text-xl">
                {participant.name}
              </span>

              {/* Division Badge */}
              <span
                className={`text-[11px] px-2 py-0.5 rounded-md border font-bold ${getDivisionBadgeColor(
                  participant.division
                )}`}
              >
                {participant.division || '일반'}
              </span>

              {participant.group && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                  {participant.group}
                </span>
              )}

              {/* Lucky Draw Winner Badge */}
              {participant.raffleWinnerPrize && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                  <Trophy className="w-3 h-3 text-amber-600" />
                  {participant.raffleWinnerPrize}
                </span>
              )}

              {/* Proxy Badge */}
              {participant.isProxy && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 font-bold">
                  대리: {participant.proxyName || '미지정'}
                </span>
              )}
            </div>

            {/* Sub-line */}
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
              {participant.checked ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  {participant.checkedAt ? `${participant.checkedAt} 수령 완료` : '수령 완료'}
                </span>
              ) : (
                <span className="text-slate-400 font-medium">미수령</span>
              )}

              {participant.phone && (
                <a
                  href={`tel:${participant.phone}`}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors ml-1 font-mono"
                  title="전화 걸기"
                >
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{participant.phone}</span>
                </a>
              )}

              {(() => {
                const badge = formatBadgeNote(participant.notes);
                if (!badge) return null;
                return (
                  <span className="inline-flex items-center gap-1 text-slate-900 bg-amber-50 border border-amber-300 font-black px-2 py-0.5 rounded text-xs truncate max-w-[240px]">
                    <span>{badge.icon}</span>
                    <span>{badge.text}</span>
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Button / Expand Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id={`status-toggle-btn-${participant.id}`}
            onClick={() => onToggleCheck(participant.id)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-sm ${
              participant.checked
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-lime-400 shadow-sm'
            }`}
          >
            {participant.checked ? '수령취소' : '수령체크'}
          </button>

          <button
            id={`expand-btn-${participant.id}`}
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="메모 및 상세 설정"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Multi-Item checklist row (if enabled) */}
      {config.multiItemMode && config.items && config.items.length > 0 && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-200/80 bg-slate-50">
          <div className="text-[11px] font-bold text-slate-500 mb-1.5">상세 수령 항목 체크:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {config.items.map((item) => {
              const isChecked = !!participant.items?.[item.id];
              return (
                <button
                  key={item.id}
                  id={`item-check-${participant.id}-${item.id}`}
                  onClick={() => onToggleItem(participant.id, item.id)}
                  className={`flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-lime-100 text-lime-900 border-lime-400'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                      isChecked ? 'bg-lime-500 text-white font-bold' : 'border border-slate-400'
                    }`}
                  >
                    {isChecked ? '✓' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Expanded Accordion: Notes, Proxy recipient, deletion */}
      {isExpanded && (
        <div className="px-3 sm:px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
            <div className="flex items-center gap-2">
              <input
                id={`proxy-checkbox-${participant.id}`}
                type="checkbox"
                checked={isProxyDraft}
                onChange={(e) => setIsProxyDraft(e.target.checked)}
                className="w-4 h-4 text-lime-600 rounded border-slate-300 focus:ring-lime-500"
              />
              <label htmlFor={`proxy-checkbox-${participant.id}`} className="text-xs font-bold text-slate-700 cursor-pointer">
                대리 수령 (본인 외 타인 수령)
              </label>
            </div>
            {isProxyDraft && (
              <input
                id={`proxy-name-input-${participant.id}`}
                type="text"
                value={proxyDraft}
                onChange={(e) => setProxyDraft(e.target.value)}
                placeholder="대리 수령자 이름 (예: 한지민)"
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500 w-full sm:w-48"
              />
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Edit3 className="w-3 h-3 text-slate-500" /> 단체티 사이즈 / 비고 메모 (예: XL(105), L(100), 라켓백):
            </label>
            <input
              id={`notes-input-${participant.id}`}
              type="text"
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="예: XL(105), 100(L), 참가비 완납 등..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              id={`delete-btn-${participant.id}`}
              onClick={() => {
                if (window.confirm(`${participant.name} 회원을 이번 대회 명단에서 삭제하시겠습니까?`)) {
                  onDeleteParticipant(participant.id);
                }
              }}
              className="flex items-center gap-1 text-rose-600 hover:text-rose-700 text-xs px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>명단에서 삭제</span>
            </button>

            <button
              id={`save-details-btn-${participant.id}`}
              onClick={handleSaveDetails}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-lime-400 text-xs font-bold transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>메모/대리수령 저장</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
