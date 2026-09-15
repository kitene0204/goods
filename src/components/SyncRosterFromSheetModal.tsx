import React, { useState } from 'react';
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
} from 'lucide-react';
import { Participant, EventConfig } from '../types';
import { HANWOOLIM_FEE_GAS_CODE, fetchMemberGradesFromGAS, SheetMemberGradeItem } from '../utils/gasSync';
import { syncParticipantsWithSheetGrades } from '../utils/storage';
import { HANWOOLIM_MEMBER_GRADES, formatGradeLabel, getGradeBadgeStyle, getTierCategory } from '../data/memberGrades';

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
  const [activeTab, setActiveTab] = useState<'paste' | 'live' | 'code' | 'overview'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [parsedMembers, setParsedMembers] = useState<SheetMemberGradeItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isLiveFetching, setIsLiveFetching] = useState(false);
  const [liveSuccessMsg, setLiveSuccessMsg] = useState<string | null>(null);
  const [liveErrorMsg, setLiveErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  // 구글 시트에서 복사한 텍스트 파싱
  const handleParsePastedText = () => {
    if (!pasteText.trim()) {
      setParseError('구글 시트의 [회원명부(정회원)] 시트에서 복사한 텍스트를 붙여넣어주세요.');
      setParsedMembers([]);
      return;
    }

    try {
      const lines = pasteText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const results: SheetMemberGradeItem[] = [];

      for (const line of lines) {
        // 탭(\t) 또는 쉼표(,) 구분
        const cols = line.split(/\t/).map((c) => c.trim());
        if (cols.length === 1 && line.includes(',')) {
          // CSV 형식인 경우
          cols.splice(0, cols.length, ...line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, '')));
        }

        // 헤더 행 건너뛰기
        if (cols.some((c) => c === '연번' || c === '성명' || c === '이름' || c === '등급(점)')) {
          continue;
        }

        let name = '';
        let score = 1;
        let grade = '동';

        if (cols.length >= 7) {
          // A열: 연번, B열: 성명, C: 생년월일, D: 전화, E: 주소, F: 등급(점), G: 등급(금,은,동)
          name = cols[1];
          const rawScore = parseInt(cols[5].replace(/[^0-9]/g, ''), 10);
          score = !isNaN(rawScore) ? rawScore : 1;
          grade = cols[6] || '동';
        } else if (cols.length >= 6) {
          // B열부터 복사한 경우 (성명, 생년월일, 전화, 주소, 등급점수, 등급)
          name = cols[0];
          const rawScore = parseInt(cols[4].replace(/[^0-9]/g, ''), 10);
          score = !isNaN(rawScore) ? rawScore : 1;
          grade = cols[5] || '동';
        } else if (cols.length >= 3) {
          // 단순 3열 복사 (성명, 등급점수, 등급) 또는 (성명, 등급, 등급점수)
          name = cols[0];
          const numCandidate1 = parseInt(cols[1].replace(/[^0-9]/g, ''), 10);
          const numCandidate2 = parseInt(cols[2].replace(/[^0-9]/g, ''), 10);

          if (!isNaN(numCandidate1)) {
            score = numCandidate1;
            grade = cols[2] || '동';
          } else if (!isNaN(numCandidate2)) {
            score = numCandidate2;
            grade = cols[1] || '동';
          } else {
            grade = cols[1] || '동';
          }
        } else if (cols.length === 2) {
          // 2열 (성명, 등급)
          name = cols[0];
          grade = cols[1] || '동';
          const matchNum = grade.match(/(\d+)/);
          if (matchNum) {
            score = parseInt(matchNum[1], 10);
          }
        }

        name = name.replace(/[^가-힣a-zA-Z0-9]/g, '');
        if (name && name.length >= 2 && !name.includes('합계') && !name.includes('총계')) {
          const cleanGrade = grade.replace(/[^가-힣A-Za-z0-9]/g, '') || '동';
          results.push({
            name,
            grade: cleanGrade,
            score,
            division: cleanGrade.startsWith('금') ? '금배부' : cleanGrade.startsWith('은') ? '은배부' : '동배부',
          });
        }
      }

      if (results.length === 0) {
        setParseError('유효한 회원 명단을 찾지 못했습니다. 탭이나 콤마로 구분된 텍스트를 확인해주세요.');
        setParsedMembers([]);
      } else {
        setParseError(null);
        setParsedMembers(results);
      }
    } catch (err: any) {
      setParseError(`파싱 오류: ${err.message}`);
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
      alert(`총 ${parsedMembers.length}명의 구글 시트 등급 및 점수(F열/G열)가 대시보드에 성공적으로 반영되었습니다!`);
      onClose();
    } catch (err: any) {
      setIsApplying(false);
      alert(`적용 중 오류 발생: ${err.message}`);
    }
  };

  // 기본 마스터 데이터(사진 기준 73명)로 즉시 덮어쓰기 복구
  const handleApplyOfficialMasterGrades = () => {
    if (!confirm('구글 시트 사진에서 확인된 73명 공식 등급(F열 점수, G열 금/은/동)으로 전체 참가자 카드를 즉시 재정렬 및 갱신하시겠습니까?')) {
      return;
    }

    const masterList = Object.entries(HANWOOLIM_MEMBER_GRADES).map(([name, info]) => ({
      name,
      grade: info.grade,
      score: info.score,
      division: info.division,
    }));

    const updated = syncParticipantsWithSheetGrades(participants, masterList);
    onUpdateParticipants(updated);
    alert('구글 시트 공식 등급(F열: 등급점수, G열: 등급)이 전체 참가자에게 성공적으로 적용되었습니다!');
    onClose();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-linear-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                구글 시트 등급 & 점수(F열/G열) 동기화
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 font-normal border border-emerald-400/30">
                  회원명부(정회원) 시트 연동
                </span>
              </h2>
              <p className="text-xs text-emerald-100/80">
                구글 스프레드시트의 F열(등급 점수)과 G열(등급 금·은·동)을 대시보드 회원 카드에 100% 일치시킵니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all border-b-2 ${
              activeTab === 'paste'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            시트 복사·붙여넣기 일괄 반영 (추천)
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all border-b-2 ${
              activeTab === 'live'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            웹앱 API 실시간 연동
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            공식 등급 현황 (73명)
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all border-b-2 ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            최신 스크립트 코드
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: 복사 붙여넣기 */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 leading-relaxed">
                <div className="font-bold text-sm flex items-center gap-1.5 mb-1.5 text-emerald-950">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  구글 시트 [회원명부(정회원)] 복사 방법
                </div>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>구글 스프레드시트의 <strong>[회원명부(정회원)]</strong> 탭을 엽니다.</li>
                  <li><strong>A열(또는 B열 성명)부터 G열(등급)</strong>까지의 행들을 마우스로 쭉 드래그하여 선택합니다.</li>
                  <li><strong>Ctrl + C (복사)</strong> 후 아래 텍스트 상자에 <strong>Ctrl + V (붙여넣기)</strong> 하세요.</li>
                  <li><strong>[명단 분석하기]</strong> 버튼을 누르면 F열(점수)과 G열(등급)을 자동 파싱하여 대시보드에 즉시 덮어씌웁니다.</li>
                </ol>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  구글 시트 복사 내용 붙여넣기:
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`예시:
1	강명규	62.11.19	010-7569-1939	전주시 완산구 효자동	5	금E	희망
5	고광직	66.01.22	010-8645-7155	전주시 완산구 삼천동	3	은B	희망
6	권용국	62.09.03	010-6375-0436	전주시 완산구 삼천동	1	동	희망
7	김동찬	89.12.22	010-6423-0780	전주시 덕진구 세병로	7	금C	희망
11	김요셉	85.12.23	010-6484-5778	전주시 완산구 효자동	3	은B	희망
12	김일태	63.12.28	010-3673-3295	전주시 완산구 용머리로	2	동	희망
17	김태균	80.10.02	010-4652-0872	전주시 효자동	6	금D	희망`}
                  rows={7}
                  className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  붙여넣은 명단 분석하기
                </button>

                <button
                  type="button"
                  onClick={handleApplyOfficialMasterGrades}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl border border-slate-300 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  사진 확인된 73명 공식 등급으로 즉시 일괄 복구
                </button>
              </div>

              {parseError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {parseError}
                </div>
              )}

              {parsedMembers.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      분석 완료: 총 <span className="text-emerald-600">{parsedMembers.length}명</span>의 회원 등급
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyParsedData}
                      disabled={isApplying}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 animate-pulse"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      대시보드에 즉시 반영하기
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2 px-3">성명</th>
                          <th className="py-2 px-3">G열 등급</th>
                          <th className="py-2 px-3">F열 점수</th>
                          <th className="py-2 px-3">부수</th>
                          <th className="py-2 px-3">대시보드 표시 형태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {parsedMembers.map((m, idx) => {
                          const tier = getTierCategory(m.grade);
                          const label = formatGradeLabel(m.grade, m.score);
                          return (
                            <tr key={idx} className="hover:bg-emerald-50/50">
                              <td className="py-1.5 px-3 font-bold text-slate-800">{m.name}</td>
                              <td className="py-1.5 px-3 text-slate-700">{m.grade}</td>
                              <td className="py-1.5 px-3 font-semibold text-slate-900">{m.score}점</td>
                              <td className="py-1.5 px-3 text-slate-500">{m.division}</td>
                              <td className="py-1.5 px-3">
                                <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-md ${getGradeBadgeStyle(tier, false)}`}>
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

          {/* TAB 2: 웹앱 API 실시간 연동 */}
          {activeTab === 'live' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs font-semibold text-slate-700">현재 연결된 Web App Webhook URL:</div>
                <div className="text-xs font-mono bg-white p-2.5 rounded-lg border border-slate-200 text-slate-600 break-all select-all">
                  {eventConfig.gasWebhookUrl || '연결된 URL 없음'}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleFetchLiveGrades}
                  disabled={isLiveFetching}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLiveFetching ? 'animate-spin' : ''}`} />
                  {isLiveFetching ? '구글 시트에서 최신 등급 조회 중...' : '구글 시트 [회원명부(정회원)] 등급 실시간 동기화'}
                </button>
              </div>

              {liveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  {liveSuccessMsg}
                </div>
              )}

              {liveErrorMsg && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    실시간 조회 안내
                  </div>
                  <div>{liveErrorMsg}</div>
                  <div className="text-[11px] text-amber-800 pt-1 border-t border-amber-200">
                    * 구글 시트의 Apps Script 코드가 최신 버전으로 배포되어 있어야 합니다. 상단 <strong>[시트 복사·붙여넣기]</strong> 탭을 이용하시면 스크립트 수정 없이도 1초 만에 즉시 100% 반영됩니다!
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 공식 등급 현황 */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  구글 시트 <strong>'회원명부(정회원)'</strong> 사진 기준 공식 등급 매핑 (총 73명):
                </div>
                <button
                  type="button"
                  onClick={handleApplyOfficialMasterGrades}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  이 등급으로 참가자 전체 일괄 갱신
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-96 overflow-y-auto p-1">
                {Object.entries(HANWOOLIM_MEMBER_GRADES).map(([name, info]) => {
                  const tier = getTierCategory(info.grade);
                  const label = formatGradeLabel(info.grade, info.score);
                  return (
                    <div
                      key={name}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs hover:border-emerald-300 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800">{name}</div>
                        <div className="text-[10px] text-slate-600">
                          {info.division} · {info.score}점
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${getGradeBadgeStyle(tier, false)}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: 최신 스크립트 코드 */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Google Apps Script (Code.gs) 최신 코드:
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? '복사 완료!' : '전체 코드 복사'}
                </button>
              </div>
              <pre className="text-[11px] font-mono p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto max-h-72 select-all">
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
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
