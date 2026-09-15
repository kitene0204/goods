import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  X, 
  Check, 
  Search, 
  Calendar, 
  Coins, 
  Send, 
  Copy, 
  CheckCheck, 
  History, 
  Sparkles, 
  ExternalLink, 
  AlertCircle,
  Clock,
  Trash2,
  TableProperties
} from 'lucide-react';
import { HANWOOLIM_MEMBER_GRADES, resolveMemberGrade } from '../data/memberGrades';
import { HANWOOLIM_BIRTH_YEARS_DATA, findMemberAgeInfo } from '../data/memberAges';
import { 
  submitBulkFeePayment, 
  getBulkFeeHistory, 
  clearBulkFeeHistory, 
  BulkFeeHistoryRecord 
} from '../utils/gasSync';
import { HANWOOLIM_EXTERNAL_LINKS } from '../types';

interface BulkFeePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasWebhookUrl?: string;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export interface MemberListItem {
  name: string;
  gradeLabel: string;
  tier: 'gold' | 'silver' | 'bronze' | 'default';
  division: '금배부' | '은배부' | '동배부' | '일반';
  ageText: string;
  birthYearText: string;
}

export const BulkFeePaymentModal: React.FC<BulkFeePaymentModalProps> = ({
  isOpen,
  onClose,
  gasWebhookUrl,
  onShowToast,
}) => {
  // 1. All Unique Hanwoolim Members Master List
  const allMembers = useMemo<MemberListItem[]>(() => {
    const nameSet = new Set<string>();
    Object.keys(HANWOOLIM_MEMBER_GRADES).forEach((n) => nameSet.add(n));
    HANWOOLIM_BIRTH_YEARS_DATA.forEach((g) => g.names.forEach((n) => nameSet.add(n)));

    const sortedNames = Array.from(nameSet).sort((a, b) => a.localeCompare(b, 'ko'));

    return sortedNames.map((name) => {
      const gradeInfo = resolveMemberGrade(name);
      const ageInfo = findMemberAgeInfo(name);

      return {
        name,
        gradeLabel: gradeInfo?.label || '일반',
        tier: (gradeInfo?.tier as any) || 'default',
        division: (gradeInfo?.division as any) || '일반',
        ageText: ageInfo ? `${ageInfo.age}세` : '',
        birthYearText: ageInfo ? `${ageInfo.birthYear}년` : '',
      };
    });
  }, []);

  // Form State
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<'전체' | '금배부' | '은배부' | '동배부' | '선택됨'>('전체');
  
  // Default current month (e.g. September = 9)
  const currentMonthNum = new Date().getMonth() + 1;
  const [selectedMonths, setSelectedMonths] = useState<number[]>([currentMonthNum]);
  const [amountPerPerson, setAmountPerPerson] = useState<number>(50000);
  const [isSponsor, setIsSponsor] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'entry' | 'history'>('entry');
  const [historyList, setHistoryList] = useState<BulkFeeHistoryRecord[]>([]);

  // Load history on open
  useEffect(() => {
    if (isOpen) {
      setHistoryList(getBulkFeeHistory());
    }
  }, [isOpen, activeSubTab]);

  // Filter members based on search and division
  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allMembers.filter((m) => {
      // Division filter
      if (divisionFilter === '선택됨') {
        if (!selectedNames.includes(m.name)) return false;
      } else if (divisionFilter !== '전체') {
        if (m.division !== divisionFilter) return false;
      }

      // Search query filter
      if (!query) return true;
      return (
        m.name.toLowerCase().includes(query) ||
        m.gradeLabel.toLowerCase().includes(query) ||
        m.ageText.includes(query) ||
        m.birthYearText.includes(query)
      );
    });
  }, [allMembers, searchQuery, divisionFilter, selectedNames]);

  // Selection handlers
  const handleToggleMember = (name: string) => {
    setSelectedNames((prev) => 
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredNames = filteredMembers.map((m) => m.name);
    setSelectedNames((prev) => Array.from(new Set([...prev, ...filteredNames])));
  };

  const handleDeselectAll = () => {
    setSelectedNames([]);
  };

  const handleRemoveChip = (name: string) => {
    setSelectedNames((prev) => prev.filter((n) => n !== name));
  };

  // Month handlers
  const handleToggleMonth = (m: number) => {
    setSelectedMonths((prev) =>
      prev.includes(m) ? (prev.length > 1 ? prev.filter((x) => x !== m) : prev) : [...prev, m].sort((a, b) => a - b)
    );
  };

  const handleSetMonthPreset = (preset: 'current' | 'h1' | 'h2' | 'year' | 'clear') => {
    if (preset === 'current') {
      setSelectedMonths([currentMonthNum]);
    } else if (preset === 'h1') {
      setSelectedMonths([1, 2, 3, 4, 5, 6]);
    } else if (preset === 'h2') {
      setSelectedMonths([7, 8, 9, 10, 11, 12]);
    } else if (preset === 'year') {
      setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    } else if (preset === 'clear') {
      setSelectedMonths([]);
    }
  };

  // Calculations
  const memberCount = selectedNames.length;
  const monthCount = selectedMonths.length;
  const totalAmount = memberCount * amountPerPerson;

  // Submit to Google Apps Script
  const handleSubmitToGas = async () => {
    if (memberCount === 0) {
      onShowToast?.('회비를 입력할 회원을 1명 이상 선택해주세요.', 'error');
      return;
    }
    if (monthCount === 0) {
      onShowToast?.('납부할 월을 1개 이상 선택해주세요.', 'error');
      return;
    }

    setIsSubmitting(true);
    const targetGasUrl = gasWebhookUrl || HANWOOLIM_EXTERNAL_LINKS.FEE_MANAGEMENT;

    try {
      const res = await submitBulkFeePayment(targetGasUrl, {
        memberNames: selectedNames,
        months: selectedMonths,
        amountPerPerson,
        totalAmount,
        isSponsor,
        note: note.trim() || undefined,
      });

      setHistoryList(getBulkFeeHistory());
      onShowToast?.(
        `✅ ${selectedNames.slice(0, 3).join(', ')}${selectedNames.length > 3 ? ` 외 ${selectedNames.length - 3}명` : ''} (총 ${selectedNames.length}명, ${totalAmount.toLocaleString()}원) 회비 입력 완료!`,
        'success'
      );

      // Reset selection
      setSelectedNames([]);
      setNote('');
    } catch (e: any) {
      onShowToast?.(e.message || '회비 입력 전송 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy TSV table data for pasting into Google Sheets
  const handleCopyTableData = () => {
    if (memberCount === 0) {
      onShowToast?.('복사할 회원을 1명 이상 선택해주세요.', 'error');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const monthsText = selectedMonths.map((m) => `${m}월`).join(',');
    const desc = isSponsor ? `★ 스폰: ${note}` : `${monthsText} 회비${note ? ` (${note})` : ''}`;

    // Format: 날짜 \t 이름 \t 항목/설명 \t 금액(숫자) \t 비고
    const rows = selectedNames.map((name) => 
      `${todayStr}\t${name}\t${desc}\t${amountPerPerson}\t`
    );

    const tsvData = rows.join('\n');
    navigator.clipboard.writeText(tsvData);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);

    onShowToast?.(
      `📋 총 ${memberCount}명의 회비 데이터(${totalAmount.toLocaleString()}원)가 클립보드에 복사되었습니다. 시트에 바로 붙여넣으실 수 있습니다!`,
      'success'
    );
  };

  // Clear history
  const handleClearHistory = () => {
    if (window.confirm('최근 일괄 납부 기록을 모두 삭제하시겠습니까?')) {
      clearBulkFeeHistory();
      setHistoryList([]);
      onShowToast?.('기록이 삭제되었습니다.', 'info');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-black">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  다중 회원 일괄 회비 입력
                </h2>
                <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full">
                  한 번에 여러 명
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  숫자 50,000 & 녹색 서식
                </span>
              </div>
              <p className="text-xs text-slate-400">
                입금자가 몰리는 날, 여러 명의 회원을 한 번에 선택하여 시트에 일괄 등록합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch between Entry and History */}
            <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                onClick={() => setActiveSubTab('entry')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeSubTab === 'entry'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                회비 입력
              </button>
              <button
                onClick={() => setActiveSubTab('history')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  activeSubTab === 'history'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-3 h-3" />
                <span>최근 기록</span>
                {historyList.length > 0 && (
                  <span className="text-[10px] bg-slate-700 px-1.5 py-0.2 rounded-full">
                    {historyList.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeSubTab === 'entry' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Step 1: Member Selection Area */}
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  <span className="text-sm font-black text-white">회원 선택</span>
                  <span className="text-xs text-indigo-300 font-bold">
                    (선택: <span className="text-lime-400 font-black text-sm">{memberCount}</span>명 / 검색: {filteredMembers.length}명)
                  </span>
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSelectAllFiltered}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    현재 목록 전체선택
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                  >
                    전체 해제
                  </button>
                </div>
              </div>

              {/* Search & Division Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="회원 이름, 등급(은A), 나이 검색..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Division Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
                  {(['전체', '금배부', '은배부', '동배부', '선택됨'] as const).map((div) => {
                    const count = div === '전체' 
                      ? allMembers.length 
                      : div === '선택됨' 
                      ? selectedNames.length 
                      : allMembers.filter((m) => m.division === div).length;

                    return (
                      <button
                        key={div}
                        onClick={() => setDivisionFilter(div)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                          divisionFilter === div
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {div} <span className="opacity-70 font-normal text-[10px]">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Chips Tray */}
              {selectedNames.length > 0 && (
                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-indigo-300 font-bold">
                    <span>선택된 회원 목록 ({selectedNames.length}명)</span>
                    <span className="text-slate-400 text-[10px]">이름을 누르면 선택에서 제외됩니다</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {selectedNames.map((name) => {
                      const m = allMembers.find((item) => item.name === name);
                      return (
                        <span
                          key={name}
                          onClick={() => handleRemoveChip(name)}
                          className="inline-flex items-center gap-1 px-2 py-0.8 rounded-lg bg-indigo-600/60 hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer group"
                          title="클릭하여 제외"
                        >
                          <span>{name}</span>
                          {m?.gradeLabel && (
                            <span className="text-[10px] opacity-80">({m.gradeLabel})</span>
                          )}
                          <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Member Selection Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1">
                {filteredMembers.map((m) => {
                  const isChecked = selectedNames.includes(m.name);
                  return (
                    <div
                      key={m.name}
                      onClick={() => handleToggleMember(m.name)}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-1.5 cursor-pointer transition-all select-none ${
                        isChecked
                          ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-xs'
                          : 'bg-slate-900/60 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                          isChecked 
                            ? 'bg-indigo-500 border-indigo-400 text-white' 
                            : 'border-slate-600 bg-slate-800'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-black truncate block ${isChecked ? 'text-white' : 'text-slate-200'}`}>
                            {m.name}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                            <span className={
                              m.tier === 'gold' ? 'text-amber-300 font-bold' :
                              m.tier === 'silver' ? 'text-slate-300 font-bold' :
                              m.tier === 'bronze' ? 'text-orange-300 font-bold' : 'text-slate-400'
                            }>
                              {m.gradeLabel}
                            </span>
                            {m.ageText && (
                              <span className="text-slate-500">· {m.ageText}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Month and Amount Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Month Selection */}
              <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-black">
                      2
                    </span>
                    <span className="text-sm font-black text-white">납부 월 선택</span>
                  </div>
                  <span className="text-xs text-emerald-300 font-bold">
                    {monthCount}개 월 선택됨
                  </span>
                </div>

                {/* Preset buttons */}
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => handleSetMonthPreset('current')}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 cursor-pointer"
                  >
                    이번달({currentMonthNum}월)
                  </button>
                  <button
                    onClick={() => handleSetMonthPreset('h1')}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 cursor-pointer"
                  >
                    상반기(1~6월)
                  </button>
                  <button
                    onClick={() => handleSetMonthPreset('h2')}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 cursor-pointer"
                  >
                    하반기(7~12월)
                  </button>
                  <button
                    onClick={() => handleSetMonthPreset('year')}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 cursor-pointer"
                  >
                    1년(전체)
                  </button>
                </div>

                {/* 12 Months Grid */}
                <div className="grid grid-cols-6 gap-1.5">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const isSelected = selectedMonths.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleToggleMonth(m)}
                        className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {m}월
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount & Calculation Box */}
              <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-black">
                      3
                    </span>
                    <span className="text-sm font-black text-white">회비 금액 설정</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 whitespace-nowrap">1인당 금액:</span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="10000"
                        value={amountPerPerson}
                        onChange={(e) => setAmountPerPerson(Number(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-black text-white text-right pr-8 focus:outline-hidden focus:border-amber-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                        원
                      </span>
                    </div>
                  </div>
                </div>

                {/* Calculation Summary Card */}
                <div className="p-3 rounded-xl bg-linear-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>선택 회원:</span>
                    <span className="font-bold text-white">{memberCount}명</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>납부 기간:</span>
                    <span className="font-bold text-white">
                      {selectedMonths.length > 0 ? `${selectedMonths.join(', ')}월 (총 ${monthCount}개월)` : '월 미선택'}
                    </span>
                  </div>
                  <div className="border-t border-slate-700/80 pt-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">총 입금 합계:</span>
                    <span className="text-base sm:text-lg font-black text-lime-400 font-mono">
                      {totalAmount.toLocaleString()}원
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-400/90 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>시트에는 순수 숫자(50,000)로 들어가며 녹색 셀 배경이 유지됩니다.</span>
                </div>
              </div>
            </div>

            {/* Step 3: Sponsor & Note */}
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={isSponsor}
                    onChange={(e) => setIsSponsor(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                  />
                  <span>★ 찬조금 / 스폰 내역으로 기록</span>
                </label>
              </div>

              <div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="비고 / 사유 (예: 9월 월례대회 일괄납부, 현장 현금 입금 등)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        ) : (
          /* History Sub-tab */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <span>최근 일괄 납부 저장 내역</span>
              </h3>
              {historyList.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>기록 전체삭제</span>
                </button>
              )}
            </div>

            {historyList.length === 0 ? (
              <div className="text-center py-12 bg-slate-850 rounded-2xl border border-dashed border-slate-800 space-y-2">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  아직 일괄 납부 기록이 없습니다.
                </p>
                <button
                  onClick={() => setActiveSubTab('entry')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  회비 입력하러 가기
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {historyList.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-[11px]">
                          {item.timestamp}
                        </span>
                        {item.isSponsor && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                            스폰
                          </span>
                        )}
                      </div>
                      <span className="font-black text-lime-400 font-mono text-sm">
                        {item.totalAmount.toLocaleString()}원
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <div>
                        <span className="font-bold text-white">
                          {item.memberNames.length}명:
                        </span>{' '}
                        <span className="text-slate-300">
                          {item.memberNames.join(', ')}
                        </span>
                      </div>
                      <span className="text-slate-400 shrink-0 ml-2">
                        {item.months.map((m) => `${m}월`).join(', ')}
                      </span>
                    </div>

                    {item.note && (
                      <p className="text-[11px] text-slate-400 bg-slate-900/60 px-2 py-1 rounded-lg">
                        💬 {item.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Bottom Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="text-xs text-slate-400">
            {memberCount > 0 ? (
              <span className="text-slate-200">
                선택: <strong className="text-lime-400">{memberCount}명</strong> ({selectedMonths.length}개월) → 총{' '}
                <strong className="text-lime-400 font-mono">{totalAmount.toLocaleString()}원</strong>
              </span>
            ) : (
              <span>회원을 선택해주세요.</span>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleCopyTableData}
              disabled={memberCount === 0}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer disabled:cursor-not-allowed"
              title="구글 시트에 직접 붙여넣을 수 있는 탭 구분 표 형식으로 복사"
            >
              {copiedSuccess ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedSuccess ? '복사 완료!' : '시트용 표 복사'}</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitToGas}
              disabled={isSubmitting || memberCount === 0 || monthCount === 0}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:opacity-40 text-white text-xs sm:text-sm font-black flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>시트에 일괄 등록 중...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>구글 시트로 일괄 저장 ({memberCount}명)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
