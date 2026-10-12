import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  CheckCircle2,
  Circle,
  FileSpreadsheet,
  ClipboardPaste,
  Search,
  RotateCcw,
  CheckCheck,
  Sparkles,
  Save,
  Filter,
} from 'lucide-react';
import { Participant } from '../types';
import { findMemberGradeInfo } from '../data/memberGrades';

interface SyncGreenReceivedModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onUpdateParticipants: (updated: Participant[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SyncGreenReceivedModal: React.FC<SyncGreenReceivedModalProps> = ({
  isOpen,
  onClose,
  participants,
  onUpdateParticipants,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'paste'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'checked' | 'unchecked'>('all');
  const [pasteText, setPasteText] = useState('');
  const [localList, setLocalList] = useState<Array<{ id: string; name: string; checked: boolean; note?: string }>>([]);

  // Initialize local list from participants
  useEffect(() => {
    if (isOpen) {
      setLocalList(
        participants.map((p) => ({
          id: p.id,
          name: p.name,
          checked: !!p.checked,
          note: p.notes,
        }))
      );
    }
  }, [isOpen, participants]);

  if (!isOpen) return null;

  const total = localList.length;
  const checkedCount = localList.filter((m) => m.checked).length;
  const uncheckCount = total - checkedCount;

  // Toggle single member check
  const toggleMemberCheck = (id: string) => {
    setLocalList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, checked: !m.checked } : m))
    );
  };

  // Mark all checked
  const handleMarkAll = () => {
    setLocalList((prev) => prev.map((m) => ({ ...m, checked: true })));
  };

  // Reset all unchecked
  const handleResetAll = () => {
    setLocalList((prev) => prev.map((m) => ({ ...m, checked: false })));
  };

  // Parse pasted names or sheet text
  const handleApplyPastedText = () => {
    if (!pasteText.trim()) {
      onShowToast('구글 시트에서 복사한 텍스트나 회원 이름을 입력해주세요.', 'info');
      return;
    }

    const lines = pasteText.split(/[\n\r,;\t]+/);
    const matchedNames = new Set<string>();

    for (const raw of lines) {
      const clean = raw.trim().replace(/[^가-힣a-zA-Z0-9]/g, '');
      if (clean.length >= 2) {
        // Check if any member name matches
        for (const p of participants) {
          if (p.name === clean || clean.includes(p.name)) {
            matchedNames.add(p.name);
          }
        }
      }
    }

    if (matchedNames.size === 0) {
      onShowToast('입력하신 내용에서 한울림 회원 이름을 찾을 수 없습니다.', 'error');
      return;
    }

    setLocalList((prev) =>
      prev.map((m) => ({
        ...m,
        checked: matchedNames.has(m.name),
      }))
    );

    setActiveTab('table');
    onShowToast(`총 ${matchedNames.size}명의 회원이 연두색 수령자로 인식되었습니다! [저장]을 눌러 반영하세요.`, 'success');
  };

  // Paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        onShowToast('클립보드에 복사된 내용이 없습니다.', 'info');
        return;
      }
      setPasteText(text);
      onShowToast('클립보드 내용을 가져왔습니다. [수령자 명단 분석 & 적용]을 클릭하세요.', 'info');
    } catch {
      onShowToast('클립보드 접근 권한이 필요합니다. 직접 붙여넣어주세요.', 'error');
    }
  };

  // Save changes to dashboard & server
  const handleSaveAndApply = async () => {
    const checkedMap = new Map<string, boolean>();
    localList.forEach((m) => checkedMap.set(m.id, m.checked));

    const updated = participants.map((p) => {
      const isChecked = checkedMap.get(p.id) ?? p.checked;
      return {
        ...p,
        checked: isChecked,
        checkedAt: isChecked ? (p.checkedAt || '수령완료') : null,
      };
    });

    onUpdateParticipants(updated);

    // Also push to local server API if running
    try {
      fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants: updated }),
      }).catch(() => {});
    } catch {}

    const count = updated.filter((p) => p.checked).length;
    onShowToast(`🌿 구글 시트 연두색 수령자 ${count}명이 대시보드에 정확히 반영되었습니다!`, 'success');
    onClose();
  };

  // Filtered members list
  const filteredList = localList.filter((m) => {
    const matchSearch = searchTerm
      ? m.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchFilter =
      filterMode === 'all'
        ? true
        : filterMode === 'checked'
        ? m.checked
        : !m.checked;
    return matchSearch && matchFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-emerald-800 via-teal-850 to-emerald-900 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs shrink-0 shadow-inner">
              <span className="text-2xl">🌿</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black tracking-tight text-white">
                  구글 시트 [회원명부(정회원)] 연두색 수령자 동기화
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-lime-400 text-slate-950 font-black shadow-xs">
                  연두색 수령 표시
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                구글 시트에서 연두색으로 표시된 수령 완료 인원을 1명도 빠짐없이 100% 일치하도록 설정합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-emerald-50/80 border-b border-emerald-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold text-slate-600">현재 연두색 수령:</span>
              <span className="text-lg font-black text-emerald-800 font-mono">
                {checkedCount}명
              </span>
              <span className="text-xs text-slate-500 font-medium">/ {total}명</span>
            </div>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-amber-700 font-bold">
              미수령: {uncheckCount}명
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAll}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              title="68명 전원 수령 완료 처리"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>전체 수령(68명)</span>
            </button>
            <button
              onClick={handleResetAll}
              className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
              title="전체 미수령으로 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>전체 초기화</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2.5 gap-2 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'table'
                ? 'border-emerald-600 text-emerald-950 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>68명 회원 목록 직접 체크 ({checkedCount}명 완료)</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'paste'
                ? 'border-emerald-600 text-emerald-950 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardPaste className="w-4 h-4 text-emerald-600" />
            <span>수령자 이름/시트 복사 붙여넣기</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto min-h-[360px]">
          {activeTab === 'table' ? (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="회원 이름 검색 (예: 강명규, 김동찬...)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filterMode === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    전체 ({total})
                  </button>
                  <button
                    onClick={() => setFilterMode('checked')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filterMode === 'checked'
                        ? 'bg-lime-500 text-slate-950 font-black shadow-xs'
                        : 'text-emerald-700 hover:text-emerald-900'
                    }`}
                  >
                    수령 완료 ({checkedCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('unchecked')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filterMode === 'unchecked'
                        ? 'bg-slate-900 text-amber-300 font-black shadow-xs'
                        : 'text-amber-700 hover:text-amber-900'
                    }`}
                  >
                    미수령 ({uncheckCount})
                  </button>
                </div>
              </div>

              {/* Members Grid/List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
                {filteredList.map((m, idx) => {
                  const origIdx = participants.findIndex((p) => p.id === m.id) + 1;
                  const g = findMemberGradeInfo(m.name);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleMemberCheck(m.id)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                        m.checked
                          ? 'bg-gradient-to-r from-lime-100/90 via-emerald-100/70 to-lime-50 border-lime-500 text-slate-900 shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0 w-6">
                          {origIdx}.
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-900 truncate">
                              {m.name}
                            </span>
                            {g && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 shrink-0">
                                {g.label}
                              </span>
                            )}
                          </div>
                          {m.note && (
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {m.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {m.checked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-lime-500 text-slate-950 font-black text-[11px] shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>수령완료</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 text-slate-400 font-bold text-[11px]">
                            <Circle className="w-3.5 h-3.5 text-slate-300" />
                            <span>미수령</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 space-y-2">
                <div className="font-black text-sm flex items-center gap-2 text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>구글 시트에서 수령자 명단 복사 후 붙여넣기</span>
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  구글 시트의 <strong>[회원명부(정회원)]</strong> 시트에서 연두색으로 표시된 수령 회원 이름들을 복사(Ctrl+C)하여 아래 상자에 붙여넣으세요.
                  이름이 쉼표, 줄바꿈 또는 탭으로 구분되어 있어도 자동으로 분석하여 매칭합니다.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700">
                    수령 완료 회원 이름 붙여넣기:
                  </label>
                  <button
                    onClick={handlePasteClipboard}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>클립보드에서 자동 읽기</span>
                  </button>
                </div>

                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="예: 강명규, 강석원, 고광직, 김동찬, 박의경... (또는 구글 시트 복사 내용 전체)"
                  rows={8}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
                />
              </div>

              <button
                onClick={handleApplyPastedText}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>수령자 명단 분석 & 목록에 반영</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-medium">
            💡 적용 시 대시보드와 서버에 <strong className="text-emerald-800 font-bold">연두색 수령자 {checkedCount}명</strong>이 즉시 저장됩니다.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleSaveAndApply}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>대시보드에 즉시 저장 & 반영</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
