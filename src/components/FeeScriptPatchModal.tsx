import React, { useState, useEffect } from 'react';
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
  HelpCircle,
  Users,
  AlertCircle,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { FEE_NUMERIC_PATCH_SNIPPET, HANWOOLIM_FEE_GAS_CODE, MEMBER_LIST_PATCH_SNIPPET } from '../utils/gasSync';
import { HANWOOLIM_EXTERNAL_LINKS } from '../types';

interface FeeScriptPatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onOpenBulkPayment?: () => void;
  defaultTab?: 'members' | 'quick' | 'bulk' | 'full' | 'guide';
}

export const FeeScriptPatchModal: React.FC<FeeScriptPatchModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onOpenBulkPayment,
  defaultTab = 'members',
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'quick' | 'bulk' | 'full' | 'guide'>(defaultTab);
  const [copiedMembers, setCopiedMembers] = useState(false);
  const [copiedQuick, setCopiedQuick] = useState(false);
  const [copiedBulk, setCopiedBulk] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleCopyMembers = async () => {
    try {
      await navigator.clipboard.writeText(MEMBER_LIST_PATCH_SNIPPET);
      setCopiedMembers(true);
      onShowToast('회원선택 교정 코드가 클립보드에 복사되었습니다!', 'success');
      setTimeout(() => setCopiedMembers(false), 2500);
    } catch {
      onShowToast('코드 복사에 실패했습니다.', 'error');
    }
  };

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
    const bulkSnippet = `// ★ [다중/단일 회원 자동 인식 + 50,000 숫자 서식 + 김영현/권용국 등 누락회원 자동 추가 saveData 함수]
function saveData(arg1, arg2) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // [핵심 1] 매개변수 유연 처리 (saveData(form) vs saveData(type, data))
  var type = 'income';
  var data = {};

  if (arg2 !== undefined && arg2 !== null) {
    type = String(arg1 || 'income');
    data = (typeof arg2 === 'object') ? arg2 : { name: String(arg2) };
  } else if (arg1 !== undefined && arg1 !== null) {
    if (typeof arg1 === 'object') {
      data = arg1;
      type = data.type || data.action || 'income';
    } else {
      type = String(arg1);
      data = {};
    }
  }

  // [핵심 2] 회원명(memName) 추출 - name, memberName, member, userName 등 어떤 필드명이든 포착
  var memberList = [];
  if (Array.isArray(data.memberNames) && data.memberNames.length > 0) {
    memberList = data.memberNames;
  } else if (Array.isArray(data.names) && data.names.length > 0) {
    memberList = data.names;
  } else if (Array.isArray(data.members) && data.members.length > 0) {
    memberList = data.members;
  }

  if (memberList.length === 0) {
    var rawName = data.name || data.memberName || data.member || data.userName || 
                  data.user || data.target || data.selectedMember || data.listIncome ||
                  data['성명'] || data['이름'] || data['회원명'] || data['회원'] || data.who;
    
    // 만약 정의된 속성이 없다면, data 객체 내의 모든 키를 뒤져서 회원 이름 값 찾기
    if (!rawName && typeof data === 'object') {
      var allKnownMembers = (typeof getMemberList === 'function') ? getMemberList() : [];
      for (var k in data) {
        if (data.hasOwnProperty(k)) {
          var testVal = String(data[k] || '').trim();
          if (testVal && allKnownMembers.indexOf(testVal) !== -1) {
            rawName = testVal;
            break;
          }
        }
      }
    }

    if (rawName && String(rawName).trim() !== '' && String(rawName).trim() !== 'undefined') {
      memberList = String(rawName).split(/[,|\\n]/).map(function(s){ return s.trim(); }).filter(Boolean);
    }
  }

  if (type === 'income' || type === 'bulk_income' || type === 'saveIncome') {
    if (memberList.length === 0) {
      return "오류: 입금할 회원을 1명 이상 선택해주세요.";
    }

    var months = [];
    if (Array.isArray(data.months)) {
      months = data.months;
    } else if (Array.isArray(data['months[]'])) {
      months = data['months[]'];
    } else if (data.months) {
      months = String(data.months).split(/[,|\\s]/).map(function(s){ return s.trim(); }).filter(Boolean);
    } else if (data.month) {
      months = [String(data.month)];
    } else {
      for (var m = 1; m <= 12; m++) {
        if (data['month' + m] || data['m' + m] || data[m + '월'] || data['month_' + m]) {
          months.push(String(m));
        }
      }
    }
    if (months.length === 0) {
      months = [String((new Date()).getMonth() + 1)];
    }

    var rawAmt = data.amount || data.totalAmount || data.fee || 50000;
    var numAmount = Number(String(rawAmt).replace(/[^0-9]/g, '')) || 50000;
    var isSponsor = data.isSponsor === true || data.isSponsor === 'true';
    var note = data.note || data.memo || data.desc || '';

    var allSheets = ss.getSheets();
    var sheet = null;
    for (var s = 0; s < allSheets.length; s++) {
      var sName = allSheets[s].getName().replace(/\\s+/g, '');
      if (sName.indexOf('회비') !== -1 && sName.indexOf('입출금') === -1 && sName.indexOf('지출') === -1 && sName.indexOf('결산') === -1) {
        sheet = allSheets[s];
        break;
      }
    }
    if (!sheet) {
      sheet = ss.getSheetByName("회비") || ss.getSheets()[0];
    }

    var values = sheet.getDataRange().getValues();
    var nameCol = -1;
    for (var rH = 0; rH < Math.min(5, values.length); rH++) {
      for (var c = 0; c < values[rH].length; c++) {
        var hStr = String(values[rH][c] || '').replace(/\\s+/g, '');
        if (hStr === '성명' || hStr === '이름' || hStr === '회원명' || hStr === '회원') {
          nameCol = c;
          break;
        }
      }
      if (nameCol !== -1) break;
    }
    if (nameCol === -1) nameCol = 1;

    var monthColMap = {};
    for (var rH2 = 0; rH2 < Math.min(5, values.length); rH2++) {
      for (var c2 = 0; c2 < values[rH2].length; c2++) {
        var h = String(values[rH2][c2] || '').replace(/[\\s\\u00a0]/g, '');
        for (var m2 = 1; m2 <= 12; m2++) {
          if (h === m2 + '월' || h === (m2 < 10 ? '0' + m2 + '월' : m2 + '월') || h === String(m2)) {
            if (!monthColMap[m2]) monthColMap[m2] = c2 + 1;
          }
        }
      }
    }

    var logSheet = ss.getSheetByName("입출금") || ss.getSheetByName("입출금내역") || ss.getSheetByName("장부");
    var today = data.date || Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd");
    var successCount = 0;
    var autoAddedNames = [];

    function findMemberRowInSheet(targetName) {
      var cleanTarget = String(targetName || '').replace(/[\\s\\u00a0]/g, '');
      if (!cleanTarget || cleanTarget === 'undefined') return -1;

      for (var r = 0; r < values.length; r++) {
        var cellName = String(values[r][nameCol] || '').replace(/[\\s\\u00a0]/g, '');
        if (cellName === cleanTarget) return r + 1;
      }

      for (var r2 = 0; r2 < values.length; r2++) {
        for (var c3 = 0; c3 < Math.min(10, values[r2].length); c3++) {
          var cellVal = String(values[r2][c3] || '').replace(/[\\s\\u00a0]/g, '');
          if (cellVal === cleanTarget) return r2 + 1;
        }
      }

      for (var r3 = 0; r3 < values.length; r3++) {
        for (var c4 = 0; c4 < Math.min(10, values[r3].length); c4++) {
          var cellVal3 = String(values[r3][c4] || '').replace(/[\\s\\u00a0]/g, '');
          if (cellVal3.indexOf(cleanTarget) !== -1 && cellVal3.length <= cleanTarget.length + 5) {
            if (cellVal3.indexOf('입금') === -1 && cellVal3.indexOf('지출') === -1 && cellVal3.indexOf('총액') === -1) {
              return r3 + 1;
            }
          }
        }
      }
      return -1;
    }

    memberList.forEach(function(memName) {
      var memberRow = findMemberRowInSheet(memName);

      if (memberRow === -1) {
        var lastRow = sheet.getLastRow();
        var newRow = lastRow + 1;
        try {
          var prevSeq = sheet.getRange(lastRow, 1).getValue();
          var nextSeq = (!isNaN(prevSeq) && Number(prevSeq) > 0) ? (Number(prevSeq) + 1) : (newRow - 1);
          sheet.getRange(newRow, 1).setValue(nextSeq);
        } catch(e) {}
        sheet.getRange(newRow, nameCol + 1).setValue(memName);
        memberRow = newRow;
        autoAddedNames.push(memName);
      }

      if (months && months.length > 0) {
        var perMonthAmount = Math.round(numAmount / months.length);
        months.forEach(function(m) {
          var col = monthColMap[Number(m)] || (nameCol + 3 + Number(m));
          var cell = sheet.getRange(memberRow, col);
          cell.setValue(perMonthAmount);
          cell.setNumberFormat("#,##0");
          cell.setBackground("#dcfce7");
        });
      }

      if (logSheet) {
        var desc = isSponsor ? "★ 스폰: " + note : (months.join(",") + "월 회비" + (note ? " (" + note + ")" : ""));
        logSheet.appendRow([today, memName, desc, numAmount, ""]);
        var lastLogRow = logSheet.getLastRow();
        logSheet.getRange(lastLogRow, 4).setNumberFormat("#,##0").setBackground("#dcfce7");
      }

      successCount++;
    });

    var totalSum = successCount * numAmount;
    var summary = "✅ " + (memberList.length === 1 ? memberList[0] + "님 " : "총 " + successCount + "명 ") + "회비 입력 완료! (총액: " + totalSum.toLocaleString() + "원)";
    if (autoAddedNames.length > 0) {
      summary += "\\n📌 회비 시트에 미등록 상태여서 자동으로 추가 등록된 회원: " + autoAddedNames.join(", ");
    }
    return summary;
  }
}

// 기존 템플릿 호환 별칭
function saveIncome(a, b) { return saveData('income', a || b); }
function processForm(a, b) { return saveData(a, b); }
function submitFee(a, b) { return saveData('income', a || b); }`;
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
            id="fee-patch-tab-members"
            onClick={() => setActiveTab('members')}
            className={`pb-2.5 px-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'members'
                ? 'border-blue-600 text-blue-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>회원 선택 오류 해결</span>
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">추천</span>
          </button>

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
                    구글 웹앱 대신 이 앱에서 73명 전체 회원을 한눈에 검색·선택하여 오류 없이 즉시 입력할 수 있습니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenBulkPayment();
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
              >
                <span>지금 입력하기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Tab 0: Members Bug Fix (Primary) */}
          {activeTab === 'members' && (
            <div className="space-y-3.5">
              {/* 김영현 등 누락 회원 및 지출항목 오류 원인 안내 */}
              <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs space-y-1.5 text-amber-950">
                <div className="font-black flex items-center gap-1.5 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>김영현 등 '회원이 없다고 나옴' & '시합구/총입금' 오류 원인과 해결</span>
                </div>
                <div className="text-amber-800 leading-relaxed space-y-1">
                  <p>
                    1. <strong>김영현 회원이 없다고 나오는 이유</strong>: [회원명부] 시트에는 있지만 <strong>[회비] 시트에 아직 이름 행이 없거나</strong>, 시트에 <code>김 영 현</code>처럼 띄어쓰기로 적혀 있어 단순 검색에 실패했기 때문입니다.
                  </p>
                  <p>
                    2. <strong>해결책</strong>: 개선된 스크립트는 <strong>띄어쓰기 무시 검색</strong>뿐만 아니라, [회비] 시트에 아직 등록되지 않은 회원이면 <strong>시트 맨 아래에 자동으로 행을 추가</strong>하여 즉시 회비를 기록합니다!
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-amber-200/80 font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>전체 Code.gs(또는 일괄 입력 코드)를 적용하면 어떤 회원이든 100% 오류 없이 자동 등록·입금됩니다!</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>회원 자동 등록 지원 saveData + getMemberList 코드</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    전체 Code.gs 탭에서 코드를 복사하시거나, 아래 일괄 입력 코드를 Code.gs에 반영하세요.
                  </p>
                </div>
                <button
                  id="copy-members-snippet-btn"
                  onClick={handleCopyBulk}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                >
                  {copiedBulk ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBulk ? '복사 완료!' : '회원 자동등록 saveData 복사'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-900 text-blue-200 p-4 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner max-h-72">
                <pre>{MEMBER_LIST_PATCH_SNIPPET}</pre>
              </div>

              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">⚡ 적용 3초 요약:</p>
                <p className="text-slate-600">
                  구글 시트 상단 <strong>[확장 프로그램] → [Apps Script]</strong> → <strong>[전체 Code.gs]</strong> 탭의 코드를 복사하여 <code>Code.gs</code>에 전체 붙여넣기 후 <strong>[배포] → [배포 관리] → [신규 버전]</strong>으로 배포하시면 즉시 해결됩니다!
                </p>
              </div>
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
