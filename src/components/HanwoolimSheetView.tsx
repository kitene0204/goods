import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  ArrowLeft, 
  Save, 
  Check, 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Coins, 
  ShieldCheck, 
  Layers, 
  Info,
  Calendar,
  Sparkles,
  Link2,
  Code2,
  TableProperties,
  Search,
  CheckCircle2,
  Circle,
  Users
} from 'lucide-react';
import { EventConfig, MainAppTab, Participant } from '../types';
import { FeeScriptPatchModal } from './FeeScriptPatchModal';
import { findMemberGradeInfo } from '../data/memberGrades';

interface HanwoolimSheetViewProps {
  config: EventConfig;
  onUpdateConfig: (updates: Partial<EventConfig>) => void;
  onBackToCheckin: () => void;
  onSelectTab: (tab: MainAppTab) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onOpenBulkPayment?: () => void;
  participants?: Participant[];
  onUpdateParticipants?: (updated: Participant[]) => void;
  onOpenSyncGreenModal?: () => void;
}

export const HanwoolimSheetView: React.FC<HanwoolimSheetViewProps> = ({
  config,
  onUpdateConfig,
  onBackToCheckin,
  onSelectTab,
  onShowToast,
  onOpenBulkPayment,
  participants = [],
  onUpdateParticipants,
  onOpenSyncGreenModal,
}) => {
  const [sheetUrlInput, setSheetUrlInput] = useState(config.googleSheetUrl || '');
  const [isEditingUrl, setIsEditingUrl] = useState(!config.googleSheetUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPatchModalOpen, setIsPatchModalOpen] = useState(false);
  const [activeSheetTab, setActiveSheetTab] = useState<'roster' | 'finance'>('roster');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterFilter, setRosterFilter] = useState<'all' | 'checked' | 'unchecked'>('all');

  const handleSaveUrl = () => {
    const trimmed = sheetUrlInput.trim();
    onUpdateConfig({ googleSheetUrl: trimmed });
    setIsEditingUrl(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    onShowToast('한울림 구글 시트 바로가기 링크가 저장되었습니다.', 'success');
  };

  // Convert regular Google Sheet URL to embed preview URL if applicable
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    try {
      if (url.includes('/edit')) {
        return url.replace(/\/edit.*$/, '/pubhtml?widget=true&headers=false');
      }
      return url;
    } catch {
      return url;
    }
  };

  const embedUrl = config.googleSheetUrl ? getEmbedUrl(config.googleSheetUrl) : null;

  // Toggle receipt directly in the sheet view
  const handleToggleRowCheck = (id: string) => {
    if (!onUpdateParticipants) return;
    const updated = participants.map((p) => {
      if (p.id === id) {
        const nextChecked = !p.checked;
        return {
          ...p,
          checked: nextChecked,
          checkedAt: nextChecked ? (p.checkedAt || '수령완료') : null,
        };
      }
      return p;
    });
    onUpdateParticipants(updated);
  };

  const filteredRoster = participants.filter((p) => {
    const matchSearch = rosterSearch
      ? p.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        (p.phone && p.phone.includes(rosterSearch))
      : true;
    const matchFilter =
      rosterFilter === 'all'
        ? true
        : rosterFilter === 'checked'
        ? p.checked
        : !p.checked;
    return matchSearch && matchFilter;
  });

  const greenCount = participants.filter((p) => p.checked).length;
  const uncheckCount = participants.length - greenCount;

  return (
    <main className="flex-1 p-4 sm:p-6 flex flex-col space-y-4 pb-28 min-h-[calc(100vh-68px)]">
      {/* Top Banner & Header Navigation */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-5 sm:p-6 border border-emerald-800/60 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-400/20 shrink-0">
            📑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                한울림 구글 시트 [회원명부 & 회계결산]
              </h2>
              <span className="text-xs font-black bg-emerald-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-2xs">
                공식 시트
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              구글 시트의 [회원명부(정회원)] F·G열 등급과 연두색 수령 현황을 100% 동일하게 열람·편집합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenSyncGreenModal && (
            <button
              id="sheet-sync-green-top-btn"
              onClick={onOpenSyncGreenModal}
              className="px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ring-2 ring-lime-400/50"
              title="구글 시트 연두색 수령자 동기화 및 직접 편집"
            >
              <span>🌿</span>
              <span>연두색 수령자 동기화</span>
            </button>
          )}

          {/* Fee numeric patch button */}
          <button
            id="sheet-fee-patch-header-btn"
            onClick={() => setIsPatchModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            title="회비 입력 시 '50,000원' 대신 숫자 50,000 저장 & 녹색 서식 유지 코드"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>회비 50,000 숫자 서식 코드</span>
          </button>

          {config.googleSheetUrl ? (
            <a
              id="sheet-open-external-btn"
              href={config.googleSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>시트 새 탭으로 열기</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <button
              onClick={() => setIsEditingUrl(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Link2 className="w-4 h-4" />
              <span>시트 링크 등록하기</span>
            </button>
          )}

          <button
            onClick={onBackToCheckin}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>대회 출석부로 복귀</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs: 회원명부(정회원) vs 2025 회계 결산 */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 gap-2 shadow-xs border">
        <button
          onClick={() => setActiveSheetTab('roster')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeSheetTab === 'roster'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>📋 [회원명부(정회원)] 68명 명단 & 연두색 수령표</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${activeSheetTab === 'roster' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
            수령: {greenCount}/{participants.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSheetTab('finance')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeSheetTab === 'finance'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>📊 2025 회계 결산 요약표 & 시트 뷰어</span>
        </button>
      </div>

      {activeSheetTab === 'roster' ? (
        /* 📋 [회원명부(정회원)] 68명 명단 & 연두색 수령표 뷰 */
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  구글 시트 [회원명부(정회원)] 공식 명단 (68명)
                </h3>
                <span className="text-[11px] font-bold bg-lime-100 text-emerald-900 border border-lime-300 px-2 py-0.5 rounded-full">
                  연두색 = 수령완료
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                행을 클릭하면 수령완료(연두색) ↔ 미수령 상태를 즉시 토글할 수 있습니다.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onOpenSyncGreenModal && (
                <button
                  onClick={onOpenSyncGreenModal}
                  className="px-3.5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>🌿</span>
                  <span>연두색 수령자 일괄 설정/붙여넣기</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="회원 이름 또는 전화번호 검색..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
              <button
                onClick={() => setRosterFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  rosterFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                전체 (68명)
              </button>
              <button
                onClick={() => setRosterFilter('checked')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  rosterFilter === 'checked'
                    ? 'bg-lime-500 text-slate-950 font-black shadow-xs'
                    : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                🌿 연두색 수령 ({greenCount}명)
              </button>
              <button
                onClick={() => setRosterFilter('unchecked')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  rosterFilter === 'unchecked'
                    ? 'bg-slate-900 text-amber-300 font-black shadow-xs'
                    : 'text-amber-700 hover:text-amber-900'
                }`}
              >
                미수령 ({uncheckCount}명)
              </button>
            </div>
          </div>

          {/* Google Sheet Style Table */}
          <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-[560px]">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead className="bg-slate-800 text-white sticky top-0 z-10 font-bold">
                  <tr>
                    <th className="py-3 px-3 w-14 text-center border-r border-slate-700">A. 연번</th>
                    <th className="py-3 px-4 border-r border-slate-700">B. 성명</th>
                    <th className="py-3 px-4 border-r border-slate-700">C. 생년월일</th>
                    <th className="py-3 px-4 border-r border-slate-700">D. 전화번호</th>
                    <th className="py-3 px-4 border-r border-slate-700">E. 주소/비고</th>
                    <th className="py-3 px-3 text-center border-r border-slate-700 bg-emerald-900/60 text-emerald-200">
                      F. 등급(점)
                    </th>
                    <th className="py-3 px-3 text-center border-r border-slate-700 bg-emerald-900/60 text-emerald-200">
                      G. 등급(금,은,동)
                    </th>
                    <th className="py-3 px-4 text-center bg-lime-900/50 text-lime-200">
                      수령 현황 (연두색 표시)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredRoster.map((p, idx) => {
                    const gradeInfo = findMemberGradeInfo(p.name, p.grade, p.score);
                    const origIndex = participants.findIndex((orig) => orig.id === p.id) + 1;
                    const isChecked = !!p.checked;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleToggleRowCheck(p.id)}
                        className={`transition-colors cursor-pointer select-none hover:brightness-95 ${
                          isChecked
                            ? 'bg-[#dcfce7] text-emerald-950 font-bold border-b border-emerald-300'
                            : 'bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono border-r border-slate-200/80">
                          {origIndex}
                        </td>
                        <td className="py-2.5 px-4 font-black border-r border-slate-200/80">
                          <div className="flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {isChecked && (
                              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-lime-500 text-slate-950">
                                수령
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs border-r border-slate-200/80 text-slate-600">
                          {p.notes ? p.notes.split('/')[0]?.trim() : '-'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs border-r border-slate-200/80 text-slate-600">
                          {p.phone || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-xs border-r border-slate-200/80 text-slate-600 truncate max-w-[160px]">
                          {p.notes || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black border-r border-slate-200/80 text-emerald-900 bg-emerald-50/50">
                          {gradeInfo?.score ?? p.score ?? 1}점
                        </td>
                        <td className="py-2.5 px-3 text-center font-black border-r border-slate-200/80 text-emerald-900 bg-emerald-50/50">
                          {gradeInfo?.grade || p.grade || '동'}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {isChecked ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-lime-500 text-slate-950 font-black text-xs shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>수령 완료 (연두색)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 font-bold text-xs">
                              <Circle className="w-3 h-3 text-slate-300" />
                              <span>미수령</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* 📊 2025 회계 결산 요약표 & 시트 뷰어 */
        <div className="space-y-4">

      {/* Fee Numeric Format Helper Card */}
      <div className="bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
            <TableProperties className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-emerald-900 flex items-center gap-2">
              <span className="text-sm">회비 셀 서식 설정: "50,000원" 텍스트 → 숫자 50,000 변환 & 녹색 서식 유지</span>
              <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                SUM/계산 완벽지원
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              회비 입력 시 '원' 글자 없는 순수 숫자(50,000)로 들어가고 기존 녹색 셀서식이 그대로 유지되는 Apps Script 수정 코드를 복사하실 수 있습니다.
            </p>
          </div>
        </div>

        <button
          id="sheet-open-fee-patch-btn"
          onClick={() => setIsPatchModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>수정 코드 확인 & 복사</span>
        </button>
      </div>

      {/* URL Configuration / Link Editor Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="text-xs sm:text-sm font-black text-slate-800">
              구글 시트 웹 바로가기 URL 설정
            </span>
          </div>
          {!isEditingUrl && config.googleSheetUrl && (
            <button
              onClick={() => setIsEditingUrl(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer self-start sm:self-auto"
            >
              주소 변경하기
            </button>
          )}
        </div>

        {isEditingUrl ? (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={sheetUrlInput}
                onChange={(e) => setSheetUrlInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/... (구글 시트 주소를 여기에 붙여넣으세요)"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSaveUrl}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>저장</span>
                </button>
                {config.googleSheetUrl && (
                  <button
                    onClick={() => {
                      setSheetUrlInput(config.googleSheetUrl);
                      setIsEditingUrl(false);
                    }}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    취소
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              💡 구글 스프레드시트의 주소창에서 링크를 복사하여 붙여넣으면 언제든 원클릭으로 바로 시트를 열 수 있습니다.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2 truncate text-slate-600">
              <span className="font-bold text-slate-700">연결된 시트:</span>
              <span className="font-mono truncate">{config.googleSheetUrl}</span>
            </div>
            {savedSuccess && (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold shrink-0 ml-2">
                <Check className="w-3.5 h-3.5" /> 저장됨
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2025 회계 결산 정보 요약 보드 (사용자 제공 시트 내용 기반) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              📊
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                2025회계 결산 요약표
              </h3>
              <p className="text-xs text-slate-500">
                한울림 구글 시트에 기록된 이월금 및 주요 결산 항목
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            2025년 기준
          </span>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 25년 이월금 */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-xs font-bold text-amber-800">25년 이월금</span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-950 tracking-tight font-mono">
                10,450,219
              </span>
              <span className="text-xs font-black text-amber-800">원</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1 font-medium">
              전년도 결산 후 2025년도 이월 확정 잔액
            </p>
          </div>

          {/* 25년 총입금 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-xs font-bold text-blue-800">25년 총입금 (회비 및 스폰)</span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-xl font-black text-blue-950 tracking-tight">
                시트 연동
              </span>
            </div>
            <p className="text-[11px] text-blue-700 mt-1 font-medium">
              정기 회비 및 찬조금/스폰 내역
            </p>
          </div>

          {/* 총 출금 */}
          <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-xs font-bold text-rose-800">총 출금</span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-xl font-black text-rose-950 tracking-tight">
                상세 항목 집계
              </span>
            </div>
            <p className="text-[11px] text-rose-700 mt-1 font-medium">
              코트비, 용품, 행사 지출 합산
            </p>
          </div>

          {/* 입금 - 출금 / 회비 잔액 */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-xs font-bold text-emerald-800">회비 잔액 (입금 - 출금)</span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-950 tracking-tight">
                실시간 관리
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium">
              이월금 + 당해 잔여 회비
            </p>
          </div>
        </div>

        {/* Detailed Expense Category Cards */}
        <div className="pt-2">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>상세 출금 내역 분류 항목</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {[
              { title: '코트비', icon: '🎾', desc: '월례대회 및 정기 코트 대여' },
              { title: '시합구', icon: '🥎', desc: '월례대회 및 클럽 공식구' },
              { title: '월례대회 상품·간식·회식', icon: '🎁', desc: '간식, 사우나, 뒤풀이 회식' },
              { title: '주말리그 및 단체전', icon: '🏆', desc: '협회 리그 및 대회 참가비' },
              { title: '추석 선물 및 회장배', icon: '🍂', desc: '명절 회원 선물 및 연말 대회' },
              { title: '24년도 선불', icon: '💳', desc: '기선납 비용 및 정산' },
              { title: '기타 운영비', icon: '📌', desc: '행정, 현수막, 클럽 비품 등' },
            ].map((item) => (
              <div
                key={item.title}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5"
              >
                <span className="text-lg">{item.icon}</span>
                <div>
                  <h5 className="text-xs font-black text-slate-900">{item.title}</h5>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Embedded Google Sheet or Direct Launch Guide */}
      {config.googleSheetUrl ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col flex-1 min-h-[460px]">
          <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>구글 스프레드시트 뷰어</span>
            </div>
            <a
              href={config.googleSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>크게 보기 (새 창)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex-1 w-full bg-slate-50 relative">
            <iframe
              src={embedUrl || config.googleSheetUrl}
              title="한울림 구글 시트"
              className="w-full h-full min-h-[500px] border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
            📑
          </div>
          <h4 className="text-base font-black text-slate-900">
            구글 시트 링크를 등록해주세요
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            상단의 <strong>[시트 링크 등록하기]</strong>를 눌러 한울림 구글 시트 주소를 붙여넣으시면,
            이 화면에서 바로 시트를 확인하고 새 탭으로 즉시 열람하실 수 있습니다.
          </p>
          <button
            onClick={() => setIsEditingUrl(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer shadow-xs"
          >
            링크 입력하기
          </button>
        </div>
      )}
        </div>
      )}

      {/* Fee Script Patch Modal */}
      <FeeScriptPatchModal
        isOpen={isPatchModalOpen}
        onClose={() => setIsPatchModalOpen(false)}
        onShowToast={onShowToast}
        onOpenBulkPayment={onOpenBulkPayment}
      />
    </main>
  );
};
