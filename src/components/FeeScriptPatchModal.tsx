import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  FileCode, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink,
  Code2,
  TableProperties,
  Layers,
  HelpCircle
} from 'lucide-react';
import { FEE_NUMERIC_PATCH_SNIPPET, HANWOOLIM_FEE_GAS_CODE } from '../utils/gasSync';
import { HANWOOLIM_EXTERNAL_LINKS } from '../types';

interface FeeScriptPatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onOpenBulkPayment?: () => void;
}

export const FeeScriptPatchModal: React.FC<FeeScriptPatchModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onOpenBulkPayment,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'bulk' | 'full' | 'guide'>('quick');
  const [copiedQuick, setCopiedQuick] = useState(false);
  const [copiedBulk, setCopiedBulk] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  if (!isOpen) return null;

  const handleCopyQuick = async () => {
    try {
      await navigator.clipboard.writeText(FEE_NUMERIC_PATCH_SNIPPET);
      setCopiedQuick(true);
      onShowToast('간편 2줄 수정 코드가 클립보드에 복사되었습니다!', 'success');
      setTimeout(() => setCopiedQuick(false), 2500);
    } catch {
      onShowToast('코드 복사에 실패했습니다.', 'error');
    }
  };

  const handleCopyBulk = async () => {
    const bulkSnippet = `// ★ [다중 회원 일괄 입력 + 50,000 숫자 서식 지원 saveData 함수]
function saveData(type, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (type === 'income' || type === 'bulk_income') {
    // 1명 또는 여러명(배열/쉼표구분) 모두 지원
    var memberList = [];
    if (Array.isArray(data.memberNames) && data.memberNames.length > 0) {
      memberList = data.memberNames;
    } else if (data.memberName) {
      memberList = String(data.memberName).split(/[,|\\n]/).map(function(s){ return s.trim(); }).filter(Boolean);
    }

    var months = data.months || [];
    var numAmount = Number(String(data.amount || 50000).replace(/[^0-9]/g, '')) || 50000;
    var sheet = ss.getSheetByName("회비") || ss.getSheetByName("회비현황") || ss.getSheetByName("2025회비") || ss.getSheets()[0];
    var values = sheet.getDataRange().getValues();
    var nameCol = findColIndex(values, ['이름', '성명', '회원명']) || 1;

    // 1~12월 컬럼 찾기
    var monthColMap = {};
    for (var c = 0; c < values[0].length; c++) {
      var h = String(values[0][c]).trim();
      for (var m = 1; m <= 12; m++) {
        if (h === m + '월' || h === String(m)) monthColMap[m] = c + 1;
      }
    }

    var count = 0;
    memberList.forEach(function(memName) {
      for (var r = 0; r < values.length; r++) {
        if (String(values[r][nameCol]).trim() === memName) {
          var row = r + 1;
          months.forEach(function(m) {
            var col = monthColMap[Number(m)] || (nameCol + 3 + Number(m));
            var cell = sheet.getRange(row, col);
            cell.setValue(Math.round(numAmount / months.length)); // 순수 숫자
            cell.setNumberFormat("#,##0");                       // 50,000 쉼표 표시
            cell.setBackground("#dcfce7");                       // 녹색 배경 서식 유지
          });
          count++;
          break;
        }
      }
    });

    return "✅ 총 " + count + "명의 회비 입력 완료!";
  }
}`;
    try {
      await navigator.clipboard.writeText(bulkSnippet);
      setCopiedBulk(true);
      onShowToast('다중 회원 일괄 입력 코드가 클립보드에 복사되었습니다!', 'success');
      setTimeout(() => setCopiedBulk(false), 2500);
    } catch {
      onShowToast('코드 복사에 실패했습니다.', 'error');
    }
  };

  const handleCopyFull = async () => {
    try {
      await navigator.clipboard.writeText(HANWOOLIM_FEE_GAS_CODE);
      setCopiedFull(true);
      onShowToast('한울림 회비 & 등급 관리 전체 스크립트가 복사되었습니다!', 'success');
      setTimeout(() => setCopiedFull(false), 2500);
    } catch {
      onShowToast('코드 복사에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <TableProperties className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  구글 시트 회비 서식 및 다중 입력 안내
                </h2>
                <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  숫자 50,000
                </span>
                <span className="text-[11px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                  여러명 일괄
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                "50,000원" 대신 순수 숫자 저장 & 녹색 서식 유지 + 여러 명 한 번에 입력
              </p>
            </div>
          </div>
          <button
            id="fee-patch-modal-close"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 shrink-0 overflow-x-auto">
          <button
            id="fee-patch-tab-quick"
            onClick={() => setActiveTab('quick')}
            className={`pb-2.5 px-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quick'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>50,000 서식 코드</span>
          </button>

          <button
            id="fee-patch-tab-bulk"
            onClick={() => setActiveTab('bulk')}
            className={`pb-2.5 px-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'bulk'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>여러명 일괄 입력 코드</span>
          </button>

          <button
            id="fee-patch-tab-full"
            onClick={() => setActiveTab('full')}
            className={`pb-2.5 px-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'full'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>전체 Code.gs</span>
          </button>

          <button
            id="fee-patch-tab-guide"
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>반영 3단계 방법</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Quick Launch Native Bulk Payment Card */}
          {onOpenBulkPayment && (
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">👥</span>
                <div>
                  <h4 className="text-xs font-black text-indigo-950">
                    앱 내 [다중 회원 일괄 회비 입력기] 바로 실행
                  </h4>
                  <p className="text-[11px] text-indigo-800">
                    회원들을 한눈에 검색하고 체크박스로 선택하여 한 번에 회비를 입력할 수 있습니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenBulkPayment();
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs active:scale-95"
              >
                지금 입력하기
              </button>
            </div>
          )}

          {/* Tab 1: Quick Fix Snippet */}
          {activeTab === 'quick' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-emerald-600" />
                  <span>saveData 함수 내부 교체 코드 (핵심)</span>
                </div>
                <button
                  id="copy-quick-snippet-btn"
                  onClick={handleCopyQuick}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  {copiedQuick ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedQuick ? '복사 완료!' : '2줄 수정 코드 복사'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-900 text-emerald-300 p-4 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                <pre>{FEE_NUMERIC_PATCH_SNIPPET}</pre>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-950">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>어떻게 동작하나요?</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-blue-800">
                  <li><strong>cell.setValue(50000):</strong> '원' 글자 없이 순수 숫자 50,000이 저장되어 <code>=SUM()</code> 합계 계산이 완벽하게 동작합니다.</li>
                  <li><strong>cell.setNumberFormat("#,##0"):</strong> 구글 시트 상에서 천 단위 콤마(50,000)로 보기 좋게 표시됩니다.</li>
                  <li><strong>cell.setBackground("#dcfce7"):</strong> 기존 연두/녹색 배경 셀서식이 그대로 입혀집니다.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 2: Bulk Multi-member Code */}
          {activeTab === 'bulk' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    <span>한 번에 여러 명 회비 입력 지원 스크립트</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    회원 이름 배열(memberNames) 또는 쉼표(,)로 구분된 이름을 받아 한 번에 여러 명의 셀을 채웁니다.
                  </p>
                </div>
                <button
                  id="copy-bulk-snippet-btn"
                  onClick={handleCopyBulk}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                >
                  {copiedBulk ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBulk ? '복사 완료!' : '다중 코드 복사'}</span>
                </button>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950">
                <p className="font-bold">✨ 편리한 다중 입력 방식:</p>
                <p className="mt-1 text-indigo-800 leading-relaxed">
                  회원 이름란에 <code>"강명규, 강석원, 김재선"</code>과 같이 쉼표로 여러 명을 넣거나, 앱 내 <strong>[다중 회원 일괄 회비 입력기]</strong>에서 한 번에 5명, 10명을 체크하여 [구글 시트로 일괄 저장]을 누르면 시트에 각각 50,000원씩 녹색 서식으로 동시에 등록됩니다!
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Full Code.gs */}
          {activeTab === 'full' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-indigo-600" />
                    <span>한울림 회비 & 등급 관리 전체 스크립트 (Code.gs)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">여러 명 일괄 입력 및 '50,000원' 글자를 숫자로 일괄 변환하는 도구 포함</p>
                </div>
                <button
                  id="copy-full-script-btn"
                  onClick={handleCopyFull}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                >
                  {copiedFull ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFull ? '복사 완료!' : '전체 스크립트 복사'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-900 text-slate-200 p-4 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-72 shadow-inner">
                <pre>{HANWOOLIM_FEE_GAS_CODE}</pre>
              </div>
            </div>
          )}

          {/* Tab 4: Step-by-Step Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">구글 스프레드시트에서 Apps Script 열기</h4>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      구글 스프레드시트 상단 메뉴에서 <strong>[확장 프로그램]</strong> → <strong>[Apps Script]</strong>를 클릭합니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">Code.gs 파일에서 코드 수정 또는 붙여넣기</h4>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      좌측 <code>Code.gs</code> 파일을 열고 코드를 교체한 뒤 <strong>저장(Ctrl + S)</strong>합니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">웹 앱 새 버전으로 배포하기</h4>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      우측 상단 <strong>[배포]</strong> 버튼 → <strong>[배포 관리]</strong> 클릭 → 연필(수정) 아이콘 클릭 → 버전에서 <strong>[신규 버전]</strong> 선택 후 <strong>[배포]</strong>를 누르면 즉시 적용 완료됩니다!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            💡 한 번에 여러 명을 선택해 빠르게 입력하실 수 있습니다.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
