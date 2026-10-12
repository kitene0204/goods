import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Database,
  Search,
  Save,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { Participant, EventConfig } from '../types';
import { HANWOOLIM_FEE_GAS_CODE, fetchMemberGradesFromGAS, SheetMemberGradeItem } from '../utils/gasSync';
import { syncParticipantsWithSheetGrades } from '../utils/storage';
import {
  HANWOOLIM_MEMBER_GRADES,
  formatGradeLabel,
  getGradeBadgeStyle,
  getTierCategory,
  AVAILABLE_GRADES,
  findMemberGradeInfo,
  saveBulkCustomMemberGrades,
} from '../data/memberGrades';

interface SyncRosterFromSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onUpdateParticipants: (updated: Participant[]) => void;
  eventConfig: EventConfig;
}

export const SyncRosterFromSheetModal: React.FC<SyncRosterFromSheetModalProps> = ({
  isOpen,
  onClose,
  participants,
  onUpdateParticipants,
  eventConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'tableEdit' | 'live' | 'code'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [parsedMembers, setParsedMembers] = useState<SheetMemberGradeItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isLiveFetching, setIsLiveFetching] = useState(false);
  const [liveSuccessMsg, setLiveSuccessMsg] = useState<string | null>(null);
  const [liveErrorMsg, setLiveErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Table Edit state for all 73 members
  const [tableSearch, setTableSearch] = useState('');
  const [membersEditList, setMembersEditList] = useState<
    Array<{ id: string; name: string; grade: string; score: number; division: string }>
  >([]);

  useEffect(() => {
    if (isOpen && participants.length > 0) {
      setMembersEditList(
        participants.map((p) => {
          const g = findMemberGradeInfo(p.name, p.grade, p.score);
          const cleanGrade = p.grade || g?.grade || '동';
          const rawScore = typeof p.score === 'number' ? p.score : g?.score;
          const cleanScore = typeof rawScore === 'number' ? rawScore : (parseInt(String(rawScore || 1), 10) || 1);
          const cleanDiv = g?.division || p.division || (cleanGrade.startsWith('금') ? '금배부' : cleanGrade.startsWith('은') ? '은배부' : '동배부');
          return {
            id: p.id,
            name: p.name,
            grade: cleanGrade,
            score: cleanScore,
            division: cleanDiv,
          };
        })
      );
    }
  }, [isOpen, participants]);

  if (!isOpen) return null;

  // 구글 시트에서 복사한 텍스트 파싱 로직
  const parseRawText = (raw: string) => {
    if (!raw.trim()) {
      setParseError('구글 시트의 [회원명부(정회원)] 시트에서 복사한 텍스트를 붙여넣어주세요.');
      setParsedMembers([]);
      return;
    }

    try {
      const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const results: SheetMemberGradeItem[] = [];

      for (const line of lines) {
        // 탭(\t), 쉼표(,), 또는 다중 공백 구분
        let cols = line.split(/\t/).map((c) => c.trim());
        if (cols.length === 1 && line.includes(',')) {
          cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        }
        if (cols.length === 1 && line.includes('  ')) {
          cols = line.split(/\s{2,}/).map((c) => c.trim());
        }

        // 헤더 행 건너뛰기
        if (
          cols.some(
            (c) =>
              c === '연번' ||
              c === '성명' ||
              c === '이름' ||
              c === '등급(점)' ||
              c === '등급(금,은,동)' ||
              c === '등급'
          )
        ) {
          continue;
        }

        let name = '';
        let score: number | null = null;
        let grade = '';

        // 1. 컬럼 중 등급(금B~E, 은A~B, 동) 패턴 탐색
        const gradeIdx = cols.findIndex((c) =>
          /^(?:금[B-E]|은[A-B]|동)$/i.test(c.replace(/\s+/g, ''))
        );
        // 2. 컬럼 중 1~10점 숫자 탐색 (연번 제외)
        const scoreIdx = cols.findIndex(
          (c, idx) =>
            idx !== 0 &&
            /^\d{1,2}(?:점)?$/.test(c.trim()) &&
            parseInt(c.replace(/[^0-9]/g, ''), 10) <= 10 &&
            parseInt(c.replace(/[^0-9]/g, ''), 10) >= 1
        );

        // 3. 한글 2~4글자 이름 탐색 (특수 주소, 시/구 제외)
        const nameIdx = cols.findIndex((c) => {
          const clean = c.replace(/[^가-힣]/g, '');
          return (
            clean.length >= 2 &&
            clean.length <= 4 &&
            !['전주시', '완산구', '덕진구', '효자동', '삼천동', '희망', '비희망', '휴면', '특별', '합계', '총계', '연번', '성명', '비고'].includes(
              clean
            )
          );
        });

        if (nameIdx !== -1) {
          name = cols[nameIdx].replace(/[^가-힣a-zA-Z0-9]/g, '');
        }

        if (gradeIdx !== -1) {
          grade = cols[gradeIdx].trim();
        }

        if (scoreIdx !== -1) {
          score = parseInt(cols[scoreIdx].replace(/[^0-9]/g, ''), 10);
        }

        // 인덱스로 못 찾은 경우 표준 열 순서 기반 fallback
        if (!name && cols.length >= 2) {
          name = (cols[1] && isNaN(Number(cols[1])) ? cols[1] : cols[0]).replace(/[^가-힣a-zA-Z0-9]/g, '');
        }
        if (!grade) {
          if (cols.length >= 7) grade = cols[6] || '동';
          else if (cols.length >= 6) grade = cols[5] || '동';
          else if (cols.length >= 3) grade = cols[2] || cols[1] || '동';
          else if (cols.length >= 2) grade = cols[1] || '동';
          else grade = '동';
        }

        if (score === null) {
          if (cols.length >= 7 && !isNaN(Number(cols[5]))) score = parseInt(cols[5], 10);
          else if (cols.length >= 6 && !isNaN(Number(cols[4]))) score = parseInt(cols[4], 10);
          else if (cols.length >= 3 && !isNaN(Number(cols[1]))) score = parseInt(cols[1], 10);
          else {
            const foundGrade = AVAILABLE_GRADES.find((g) => g.grade === grade);
            score = foundGrade ? foundGrade.defaultScore : (grade.startsWith('금') ? 6 : grade.startsWith('은') ? 3 : 1);
          }
        }

        name = name.replace(/[^가-힣a-zA-Z0-9]/g, '');
        if (name && name.length >= 2 && !name.includes('합계') && !name.includes('총계')) {
          const cleanGrade = grade.replace(/[^가-힣A-Za-z0-9]/g, '') || '동';
          results.push({
            name,
            grade: cleanGrade,
            score: score || 1,
            division: cleanGrade.startsWith('금') ? '금배부' : cleanGrade.startsWith('은') ? '은배부' : '동배부',
          });
        }
      }

      if (results.length === 0) {
        setParseError('유효한 회원 명단을 찾지 못했습니다. 구글 시트에서 A열(연번)부터 G열(등급)까지 복사해주세요.');
        setParsedMembers([]);
      } else {
        setParseError(null);
        setParsedMembers(results);
      }
    } catch (err: any) {
      setParseError(`파싱 오류: ${err.message}`);
    }
  };

  const handleParsePastedText = () => {
    parseRawText(pasteText);
  };

  // 클립보드에서 1초 만에 자동 읽어오기
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setParseError('클립보드에 복사된 내용이 없습니다. 구글 시트에서 [Ctrl + C] 후 다시 눌러주세요.');
        return;
      }
      setPasteText(text);
      parseRawText(text);
    } catch {
      setParseError('클립보드 권한이 필요합니다. 아래 텍스트 상자에 직접 [Ctrl + V] 로 붙여넣어주세요.');
    }
  };

  // 파싱된 명단을 대시보드에 즉시 적용
  const handleApplyParsedData = () => {
    if (parsedMembers.length === 0) return;
    setIsApplying(true);

    try {
      const updated = syncParticipantsWithSheetGrades(participants, parsedMembers);
      onUpdateParticipants(updated);
      setIsApplying(false);
      alert(`총 ${parsedMembers.length}명의 구글 시트 [회원명부(정회원)] 등급(F열/G열)이 대시보드에 100% 반영되었습니다!`);
      onClose();
    } catch (err: any) {
      setIsApplying(false);
      alert(`적용 중 오류 발생: ${err.message}`);
    }
  };

  // 테이블 직접 수정 저장
  const handleSaveTableEdits = () => {
    if (membersEditList.length === 0) return;
    try {
      const updated = syncParticipantsWithSheetGrades(participants, membersEditList);
      onUpdateParticipants(updated);
      alert(`총 ${membersEditList.length}명의 회원 등급이 대시보드에 성공적으로 일괄 저장되었습니다!`);
      onClose();
    } catch (err: any) {
      alert(`저장 중 오류: ${err.message}`);
    }
  };

  // 한 회원 테이블 행 수정
  const handleUpdateMemberInTable = (id: string, newGrade: string, newScore: number) => {
    const div = newGrade.startsWith('금') ? '금배부' : newGrade.startsWith('은') ? '은배부' : '동배부';
    setMembersEditList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, grade: newGrade, score: newScore, division: div } : m))
    );
  };

  // GAS 실시간 동기화
  const handleFetchLiveGrades = async () => {
    if (!eventConfig.gasWebhookUrl || !eventConfig.gasWebhookUrl.startsWith('http')) {
      setLiveErrorMsg('설정된 Google Apps Script Web App URL이 올바르지 않습니다.');
      return;
    }

    setIsLiveFetching(true);
    setLiveSuccessMsg(null);
    setLiveErrorMsg(null);

    try {
      const res = await fetchMemberGradesFromGAS(eventConfig.gasWebhookUrl);
      if (res.success && res.members && res.members.length > 0) {
        const updated = syncParticipantsWithSheetGrades(participants, res.members);
        onUpdateParticipants(updated);
        setLiveSuccessMsg(`구글 시트 '회원명부(정회원)' 시트에서 총 ${res.members.length}명의 최신 등급(F열/G열)을 가져와 실시간 반영했습니다!`);
      } else {
        setLiveErrorMsg(res.message || '가져온 회원 명단이 없습니다.');
      }
    } catch (err: any) {
      setLiveErrorMsg(err.message || '구글 시트 연동 중 오류가 발생했습니다. 스크립트 배포 상태를 확인해주세요.');
    } finally {
      setIsLiveFetching(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(HANWOOLIM_FEE_GAS_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredTableList = membersEditList.filter((m) =>
    tableSearch ? m.name.toLowerCase().includes(tableSearch.toLowerCase()) : true
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 bg-gradient-to-r from-emerald-800 via-teal-850 to-emerald-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs shrink-0 shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  구글 시트 [회원명부(정회원)] 등급 100% 동기화
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black shadow-xs">
                  F열(점수) · G열(등급)
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                구글 시트에 적힌 공식 등급(금B~동, 1~8점)을 복사하여 대시보드에 즉시 덮어씌웁니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2.5 gap-2 text-xs sm:text-sm font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'paste'
                ? 'border-emerald-600 text-emerald-900 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardPaste className="w-4 h-4 text-emerald-600" />
            시트 복사·붙여넣기 동기화 (가장 빠름)
          </button>
          <button
            onClick={() => setActiveTab('tableEdit')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'tableEdit'
                ? 'border-emerald-600 text-emerald-900 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Pencil className="w-4 h-4 text-emerald-600" />
            전체 회원 등급 직접 편집 ({membersEditList.length}명)
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'live'
                ? 'border-emerald-600 text-emerald-900 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-teal-600" />
            구글 웹앱 API 실시간 연동
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-900 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            최신 스크립트 코드
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: 복사 붙여넣기 */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-2xl p-4 text-xs text-emerald-950 leading-relaxed shadow-xs">
                <div className="font-black text-sm flex items-center justify-between gap-2 mb-2 text-emerald-950">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>구글 스프레드시트 [회원명부(정회원)] 복사 방법 (30초 완료)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all text-xs shrink-0"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>📋 클립보드에서 바로 읽어오기</span>
                  </button>
                </div>
                <ol className="list-decimal pl-5 space-y-1 font-medium text-emerald-900">
                  <li>
                    구글 시트의 <strong>[회원명부(정회원)]</strong> 탭을 엽니다.
                  </li>
                  <li>
                    <strong>A열(연번) 또는 B열(성명)부터 G열(등급)</strong>까지의 모든 행을 마우스로 드래그 선택 후 <strong>Ctrl + C (복사)</strong> 합니다.
                  </li>
                  <li>
                    아래 텍스트 상자에 <strong>Ctrl + V (붙여넣기)</strong> 하거나 우측 상단 <strong>[클립보드에서 바로 읽어오기]</strong> 버튼을 누르세요.
                  </li>
                  <li>
                    <strong>[분석하기]</strong> → <strong>[대시보드에 즉시 반영하기]</strong>를 누르면 끝입니다!
                  </li>
                </ol>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-slate-800">
                    구글 시트에서 복사한 명단 붙여넣기:
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    클립보드 자동 붙여넣기
                  </button>
                </div>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`예시 (구글 시트에서 그대로 복사한 형태):
1	강명규	62.11.19	010-7569-1939	전주시 완산구 효자동	5	금E	희망
2	강석원	88.04.15	010-1234-5678	전주시 완산구	1	동	휴면
3	강운석	60.01.01	010-9876-5432	전주시 완산구	1	동	희망
4	강전성	97.03.20	010-5555-4444	전주시 덕진구	1	동	희망
5	고광직	66.01.22	010-8645-7155	전주시 완산구 삼천동	3	은B	희망
7	김동찬	89.12.22	010-6423-0780	전주시 덕진구 세병로	7	금C	희망
11	김요셉	85.12.23	010-6484-5778	전주시 완산구 효자동	3	은B	희망
17	김태균	80.10.02	010-4652-0872	전주시 효자동	6	금D	희망`}
                  rows={8}
                  className="w-full text-xs font-mono p-3.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-slate-50 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-lime-400 text-xs sm:text-sm font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  <span>붙여넣은 명단 분석하기</span>
                </button>

                <div className="text-[11px] text-slate-500">
                  💡 F열(1~8점)과 G열(금B~동)이 자동으로 파싱되어 대시보드에 연결됩니다.
                </div>
              </div>

              {parseError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{parseError}</span>
                </div>
              )}

              {parsedMembers.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      분석 완료: 총 <span className="text-emerald-700 font-black">{parsedMembers.length}명</span>의 공식 등급 파싱됨
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyParsedData}
                      disabled={isApplying}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95 animate-pulse"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>대시보드에 100% 즉시 반영하기</span>
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-inner">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-700 font-bold">
                        <tr>
                          <th className="py-2.5 px-3">성명</th>
                          <th className="py-2.5 px-3">G열 등급</th>
                          <th className="py-2.5 px-3">F열 점수</th>
                          <th className="py-2.5 px-3">부수</th>
                          <th className="py-2.5 px-3">대시보드 표시 뱃지</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedMembers.map((m, idx) => {
                          const tier = getTierCategory(m.grade);
                          const label = formatGradeLabel(m.grade, m.score);
                          return (
                            <tr key={`${m.name}-${idx}`} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-bold text-slate-900">{m.name}</td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-800">{m.grade}</td>
                              <td className="py-2 px-3 font-mono text-slate-700">{m.score}점</td>
                              <td className="py-2 px-3 text-slate-600">{m.division}</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 text-[11px] font-black rounded-md ${getGradeBadgeStyle(tier, false)}`}>
                                  {label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 전체 회원 등급 직접 편집 테이블 */}
          {activeTab === 'tableEdit' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="회원 이름 검색..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveTableEdits}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>수정 내용 전체 저장 (대시보드 반영)</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>
                  총 <strong>{membersEditList.length}명</strong> 중 {filteredTableList.length}명 표시 중 (각 회원의 등급과 점수를 직접 변경할 수 있습니다)
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-700 font-bold z-10">
                    <tr>
                      <th className="py-2.5 px-3">연번</th>
                      <th className="py-2.5 px-3">성명</th>
                      <th className="py-2.5 px-3">등급 (G열)</th>
                      <th className="py-2.5 px-3">점수 (F열)</th>
                      <th className="py-2.5 px-3">부수</th>
                      <th className="py-2.5 px-3">카드 미리보기</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTableList.map((m, idx) => {
                      const tier = getTierCategory(m.grade);
                      const label = formatGradeLabel(m.grade, m.score);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">#{idx + 1}</td>
                          <td className="py-2 px-3 font-black text-slate-900">{m.name}</td>
                          <td className="py-2 px-3">
                            <select
                              value={m.grade}
                              onChange={(e) => {
                                const val = e.target.value;
                                const found = AVAILABLE_GRADES.find((g) => g.grade === val);
                                handleUpdateMemberInTable(m.id, val, found ? found.defaultScore : m.score);
                              }}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <optgroup label="금배부">
                                <option value="금B">금B (8점)</option>
                                <option value="금C">금C (7점)</option>
                                <option value="금D">금D (6점)</option>
                                <option value="금E">금E (5점)</option>
                              </optgroup>
                              <optgroup label="은배부">
                                <option value="은A">은A (4점)</option>
                                <option value="은B">은B (3점)</option>
                              </optgroup>
                              <optgroup label="동배부">
                                <option value="동">동 (1~2점)</option>
                              </optgroup>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={m.score}
                              onChange={(e) => handleUpdateMemberInTable(m.id, m.grade, Number(e.target.value))}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                                <option key={s} value={s}>
                                  {s}점
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3 text-slate-600 font-medium">{m.division}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 text-[11px] font-black rounded-md ${getGradeBadgeStyle(tier, false)}`}>
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveTableEdits}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>수정 내용 전체 저장 (대시보드 반영)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: 웹앱 API 실시간 연동 */}
          {activeTab === 'live' && (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-xs text-teal-950 leading-relaxed">
                <div className="font-black text-sm flex items-center gap-1.5 mb-1.5 text-teal-950">
                  <RefreshCw className="w-4 h-4 text-teal-700" />
                  Google Apps Script Web App 실시간 연동
                </div>
                <p>
                  배포된 Google Apps Script Web App의 <code>get_grades</code> 액션을 호출하여 시트의 F열/G열을 비동기로 즉시 조회합니다.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">현재 설정된 GAS Webhook URL:</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 break-all select-all">
                  {eventConfig.gasWebhookUrl || 'URL이 설정되지 않았습니다.'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleFetchLiveGrades}
                disabled={isLiveFetching}
                className="w-full py-3 bg-teal-700 hover:bg-teal-850 text-white text-xs sm:text-sm font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLiveFetching ? 'animate-spin' : ''}`} />
                <span>{isLiveFetching ? '구글 시트에서 최신 등급 조회 중...' : '구글 시트 [회원명부(정회원)] 등급 실시간 동기화'}</span>
              </button>

              {liveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{liveSuccessMsg}</span>
                </div>
              )}

              {liveErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <div>
                    <span>{liveErrorMsg}</span>
                    <div className="text-[11px] text-red-500 mt-1">
                      💡 상단 <strong>[시트 복사·붙여넣기 동기화]</strong> 탭을 이용하시면 스크립트 수정 없이도 10초 만에 100% 반영됩니다!
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: 최신 스크립트 코드 */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700">
                  Google Apps Script (Code.gs) 최신 코드:
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? '복사 완료!' : '전체 코드 복사'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono p-3.5 bg-slate-900 text-slate-100 rounded-2xl overflow-x-auto max-h-72 select-all leading-relaxed">
                {HANWOOLIM_FEE_GAS_CODE}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="text-slate-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>회원명부(정회원) 시트의 F열(등급 점수)과 G열(등급)이 안전하게 연동됩니다.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
