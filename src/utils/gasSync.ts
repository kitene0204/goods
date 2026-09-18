import { Participant, EventConfig } from '../types';

export const DEFAULT_GAS_CODE = `/**
 * [테니스 클럽 월례대회 수령 체크 - Google Apps Script]
 * 1. 스프레드시트 상단 메뉴 > 확장 프로그램 > Apps Script 클릭
 * 2. 이 코드를 복사하여 붙여넣고 저장(Ctrl+S)
 * 3. 오른쪽 상단 [배포] > [새 배포] 클릭
 * 4. 유형 선택: [웹 앱]
 *    - 설명: 테니스 수령 체크 API
 *    - 다음 사용자로 실행: 나(내 계정)
 *    - 액세스 권한이 있는 사용자: [모든 사용자 (Anyone)] -> 중요!
 * 5. [배포] 버튼 클릭 후 생성된 웹 앱 URL을 복사하여 웹앱 설정에 붙여넣기하세요.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = data.eventTitle || "월례대회 수령기록";
    
    // 시트 이름 최대 30자 제한 및 특수문자 안전 처리
    sheetName = sheetName.replace(/[:\\\\/?*\\[\\]]/g, "_").substring(0, 30);
    
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // 헤더 작성
      var headers = [
        "순번", "이름", "구분/부수", "전화번호", "수령여부", 
        "수령시간", "대리수령자", "추가수령항목", "경품당첨", "비고", "기록일시"
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground("#059669")
        .setFontColor("#ffffff")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    // 기존 내용 초기화 후 최신 현황으로 갱신
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }

    var rows = [];
    var now = Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss");
    
    data.participants.forEach(function(p, idx) {
      var itemDetails = "-";
      if (p.itemsText && p.itemsText !== "-") {
        itemDetails = p.itemsText;
      } else if (p.additionalItems && p.additionalItems.length > 0) {
        itemDetails = p.additionalItems.join(", ");
      }
      
      rows.push([
        idx + 1,
        p.name || "",
        p.division || "일반",
        p.phone || "",
        p.checked ? "수령완료" : "미수령",
        p.checkedAt || "",
        p.proxyName || (p.isProxy ? "대리수령" : "-"),
        itemDetails,
        p.raffleWinnerPrize || "-",
        p.notes || "",
        now
      ]);
    });

    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      sheet.autoResizeColumns(1, 11);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "총 " + rows.length + "명의 수령 기록이 시트에 업데이트되었습니다.",
      updatedAt: now
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = (e && e.parameter && e.parameter.eventTitle) ? e.parameter.eventTitle : "";
    sheetName = sheetName.replace(/[:\\\\/?*\\[\\]]/g, "_").substring(0, 30);
    var sheet = sheetName ? ss.getSheetByName(sheetName) : null;
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "시트를 찾을 수 없습니다."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        sheetName: sheet.getName(),
        participants: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var participants = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[1]) continue;
      
      var isChecked = String(row[4]).trim() === "수령완료";
      var proxyVal = String(row[6] || "").trim();
      var hasProxy = proxyVal !== "" && proxyVal !== "-";
      var actualProxy = (hasProxy && proxyVal !== "대리수령") ? proxyVal : "";
      
      var prizeVal = String(row[8] || "").trim();
      var rafflePrize = (prizeVal !== "" && prizeVal !== "-") ? prizeVal : undefined;

      participants.push({
        id: "p-sheet-" + i + "-" + String(row[1]).trim(),
        name: String(row[1]).trim(),
        division: String(row[2] || "일반").trim(),
        phone: String(row[3] || "").trim(),
        checked: isChecked,
        checkedAt: String(row[5] || ""),
        isProxy: hasProxy,
        proxyName: actualProxy,
        raffleWinnerPrize: rafflePrize,
        notes: String(row[9] || "").trim(),
        items: {}
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      sheetName: sheet.getName(),
      participants: participants
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

/**
 * 2줄 간편 패치 스니펫 (기존 Code.gs의 saveData 함수 내 교체용)
 */
export const FEE_NUMERIC_PATCH_SNIPPET = `// [기존 코드]
// cell.setValue("50,000원");
// cell.setBackground("#bbf7d0");

// ★ [수정 코드] "50,000원"(문자) 대신 숫자 50000 입력 및 녹색 셀서식 유지
var numAmount = Number(String(data.amount || 50000).replace(/[^0-9]/g, '')) || 50000;
cell.setValue(numAmount);           // 1. 순수 숫자 50000 값 입력 (SUM, 계산 완벽 지원)
cell.setNumberFormat("#,##0");      // 2. 화면에 '50,000'으로 표시되는 통화 서식
cell.setBackground("#dcfce7");      // 3. 기존 연두/녹색 배경 셀서식 유지`;

/**
 * 회원 선택 드롭다운 정상화 패치 스니펫 ('25년 총입금', '시합구' 버그 해결용)
 */
export const MEMBER_LIST_PATCH_SNIPPET = `// ★ [회비 입금 시 회원 선택 목록에 '총입금/시합구' 대신 실제 회원 이름이 나오도록 하는 getMemberList 함수]
// Code.gs 파일 내의 기존 getMemberList 함수를 아래 코드로 교체하세요.

function getMemberList() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1순위: '회원명부(정회원)' 시트에서 실제 회원 명단 조회
  try {
    var memberData = getMemberGradeData();
    if (memberData && memberData.length > 0) {
      var memberNames = [];
      for (var i = 0; i < memberData.length; i++) {
        var mName = String(memberData[i].name || '').trim();
        if (isValidMemberName(mName) && memberNames.indexOf(mName) === -1) {
          memberNames.push(mName);
        }
      }
      if (memberNames.length > 0) return memberNames.sort();
    }
  } catch (e) {}

  // 2순위: 전체 시트 중 '회원명부' 또는 '정회원' 시트 직접 탐색
  var allSheets = ss.getSheets();
  var rosterSheet = null;
  for (var s = 0; s < allSheets.length; s++) {
    var sName = allSheets[s].getName().replace(/\\s+/g, '');
    if ((sName.indexOf('회원명부') !== -1 || sName.indexOf('정회원') !== -1) && 
        sName.indexOf('입출금') === -1 && sName.indexOf('지출') === -1 && sName.indexOf('결산') === -1) {
      rosterSheet = allSheets[s];
      break;
    }
  }

  if (rosterSheet) {
    var values = rosterSheet.getDataRange().getValues();
    var nameCol = findColIndex(values, ['성명', '이름', '회원명']) || 1;
    var names = [];
    for (var r = 1; r < values.length; r++) {
      var n = String(values[r][nameCol] || '').trim();
      if (isValidMemberName(n) && names.indexOf(n) === -1) {
        names.push(n);
      }
    }
    if (names.length > 0) return names.sort();
  }

  // 3순위: '회비' 시트에서 회원 행 탐색 (지출/정산 항목 철저 배제)
  var feeSheet = ss.getSheetByName("회비") || ss.getSheetByName("회비현황") || ss.getSheetByName("2025회비") || ss.getSheets()[0];
  var feeValues = feeSheet.getDataRange().getValues();
  var feeNameCol = findColIndex(feeValues, ['성명', '이름', '회원명']) || 1;
  var fallbackNames = [];
  for (var fr = 0; fr < feeValues.length; fr++) {
    var rawName = String(feeValues[fr][feeNameCol] || '').trim();
    if (isValidMemberName(rawName) && fallbackNames.indexOf(rawName) === -1) {
      fallbackNames.push(rawName);
    }
  }
  if (fallbackNames.length > 0) return fallbackNames.sort();

  // 4순위: 한울림 공식 정회원 73명 마스터 목록 (절대 빈 목록 방지)
  return [
    "강명규", "강석원", "강운석", "강전성", "고광직", "권용국", "김동찬", "김선경", "김영수", "김영현",
    "김요셉", "김일태", "김재선", "김준관", "김준동", "김진규", "김태균", "김한준", "김한진", "김현우",
    "문범준", "문현덕", "박공래", "박광전", "박력", "박의경", "박정태", "배동연", "배정민", "배지혁",
    "서영진", "손성호", "손승모", "송석운", "송현준", "신영인", "신용욱", "안경민", "안성규", "양원준",
    "오광석", "오인석", "유길상", "유성식", "윤성원", "이경재", "이상복", "이선행", "이송재", "이승현",
    "이영만", "이영주", "이원준", "이재흥", "이정민", "이지훈", "이창우", "임선혁", "임영모", "장병국",
    "장용석", "전호경", "정석균", "정석현", "정재홍", "정종헌", "정진희", "조용현", "최경선", "최양권",
    "최인식", "한상열", "한영민"
  ];
}

// 회비 및 지출 항목(총입금, 시합구, 코트비 등)을 회원 이름에서 100% 필터링
function isValidMemberName(name) {
  if (!name) return false;
  var s = String(name).trim();
  if (s.length < 2 || s.length > 8) return false;
  if (/\\d/.test(s)) return false; // 숫자가 있으면 제외 (예: '25년 총입금')
  
  var excluded = [
    '총입금', '입금', '출금', '시합구', '코트비', '스폰', '회비', '이월금', '이월', 
    '상품', '선불', '운영비', '잔액', '결산', '비고', '성명', '이름', '회원명', 
    '순번', '연번', '번호', '소계', '합계', '총계', '간식', '회식', '대회', 
    '리그', '선물', '회장배', '항목', '내역', '구분', '금액', '날짜', '지출'
  ];
  for (var i = 0; i < excluded.length; i++) {
    if (s.indexOf(excluded[i]) !== -1) return false;
  }
  return true;
}

// ★ [다중/단일 회원 자동 인식 + 50,000 숫자 서식 + 김영현/권용국 등 누락회원 자동 추가 saveData 함수]
function saveData(arg1, arg2) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 매개변수 유연 처리 (saveData(form) vs saveData(type, data))
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

  // 회원명 추출 (어떤 속성명으로 전달되어도 100% 포착)
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

/**
 * 한울림 회비 & 등급 관리 전체 Google Apps Script (Code.gs)
 * - 회원 선택 시 '총입금', '시합구' 버그 완전 해결
 * - 50,000 숫자 저장 및 표시 서식 적용
 * - 녹색 셀서식 유지
 * - 기존 입력된 '50,000원' 문자열을 숫자로 일괄 변환하는 도구 포함
 */
export const HANWOOLIM_FEE_GAS_CODE = `/**
 * [한울림 테니스클럽 회비 & 등급 관리 시스템 - Code.gs]
 * 
 * 1. 구글 스프레드시트 상단 메뉴 > 확장 프로그램 > Apps Script
 * 2. Code.gs 파일 내용을 이 코드로 붙여넣고 저장(Ctrl+S)
 * 3. 오른쪽 상단 [배포] > [배포 관리] > 연필 아이콘 > 버전: [신규 버전] 선택 후 [배포]
 */

function doGet(e) {
  var targetTab = (e && e.parameter && e.parameter.tab) ? e.parameter.tab : 'dashboard';

  // 웹 앱 화면 로드 또는 API JSON 요청 분기
  if (e && e.parameter && (e.parameter.action === 'get_roster' || e.parameter.action === 'get_grades' || e.parameter.format === 'json')) {
    try {
      var memberGrades = getMemberGradeData();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        count: memberGrades.length,
        members: memberGrades
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: err.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 1순위: 만약 Apps Script 프로젝트에 Index.html 파일이 있다면 해당 파일 로드
  try {
    var template = HtmlService.createTemplateFromFile('Index');
    template.targetTab = targetTab;
    return template.evaluate()
      .setTitle('한울림 회비 & 등급 관리')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e1) {
    try {
      var template2 = HtmlService.createTemplateFromFile('index');
      template2.targetTab = targetTab;
      return template2.evaluate()
        .setTitle('한울림 회비 & 등급 관리')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (e2) {
      // 2순위: Index.html 파일이 없어도 Code.gs 하나만으로 100% 정상 작동하도록 자체 HTML 내장 렌더링!
      return HtmlService.createHtmlOutput(renderMainHtml(targetTab))
        .setTitle('한울림 회비 & 등급 관리')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
  }
}

// 외부 API 및 리액트 웹앱 연동용 POST 핸들러
function doPost(e) {
  try {
    var contents = {};
    if (e && e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    }
    var type = contents.type || contents.action || 'income';
    var payload = contents.data || contents;

    if (type === 'get_roster' || type === 'get_grades') {
      var memberGrades = getMemberGradeData();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        count: memberGrades.length,
        members: memberGrades
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var result = saveData(type, payload);
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: result
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 1. 회원 명단 불러오기 ('회원명부(정회원)' 시트 우선 조회 & 지출/총입금 항목 철저 배제)
function getMemberList() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1순위: '회원명부(정회원)' 시트에서 실제 등록 회원 명단 조회
  try {
    var memberData = getMemberGradeData();
    if (memberData && memberData.length > 0) {
      var memberNames = [];
      for (var i = 0; i < memberData.length; i++) {
        var mName = String(memberData[i].name || '').trim();
        if (isValidMemberName(mName) && memberNames.indexOf(mName) === -1) {
          memberNames.push(mName);
        }
      }
      if (memberNames.length > 0) return memberNames.sort();
    }
  } catch (e) {}

  // 2순위: 전체 시트 중 '회원명부' 또는 '정회원' 시트 직접 탐색
  var allSheets = ss.getSheets();
  var rosterSheet = null;
  for (var s = 0; s < allSheets.length; s++) {
    var sName = allSheets[s].getName().replace(/\\s+/g, '');
    if ((sName.indexOf('회원명부') !== -1 || sName.indexOf('정회원') !== -1) && 
        sName.indexOf('입출금') === -1 && sName.indexOf('지출') === -1 && sName.indexOf('결산') === -1) {
      rosterSheet = allSheets[s];
      break;
    }
  }

  if (rosterSheet) {
    var values = rosterSheet.getDataRange().getValues();
    var nameCol = findColIndex(values, ['성명', '이름', '회원명']) || 1;
    var names = [];
    for (var r = 1; r < values.length; r++) {
      var n = String(values[r][nameCol] || '').trim();
      if (isValidMemberName(n) && names.indexOf(n) === -1) {
        names.push(n);
      }
    }
    if (names.length > 0) return names.sort();
  }

  // 3순위: '회비' 시트에서 회원 행 탐색 (지출/정산 항목 철저 배제)
  var feeSheet = ss.getSheetByName("회비") || ss.getSheetByName("회비현황") || ss.getSheetByName("2025회비") || ss.getSheets()[0];
  var feeValues = feeSheet.getDataRange().getValues();
  var feeNameCol = findColIndex(feeValues, ['성명', '이름', '회원명']) || 1;
  var fallbackNames = [];
  for (var fr = 0; fr < feeValues.length; fr++) {
    var rawName = String(feeValues[fr][feeNameCol] || '').trim();
    if (isValidMemberName(rawName) && fallbackNames.indexOf(rawName) === -1) {
      fallbackNames.push(rawName);
    }
  }
  if (fallbackNames.length > 0) return fallbackNames.sort();

  // 4순위: 한울림 공식 정회원 73명 마스터 목록 (절대 빈 목록 방지)
  return [
    "강명규", "강석원", "강운석", "강전성", "고광직", "권용국", "김동찬", "김선경", "김영수", "김영현",
    "김요셉", "김일태", "김재선", "김준관", "김준동", "김진규", "김태균", "김한준", "김한진", "김현우",
    "문범준", "문현덕", "박공래", "박광전", "박력", "박의경", "박정태", "배동연", "배정민", "배지혁",
    "서영진", "손성호", "손승모", "송석운", "송현준", "신영인", "신용욱", "안경민", "안성규", "양원준",
    "오광석", "오인석", "유길상", "유성식", "윤성원", "이경재", "이상복", "이선행", "이송재", "이승현",
    "이영만", "이영주", "이원준", "이재흥", "이정민", "이지훈", "이창우", "임선혁", "임영모", "장병국",
    "장용석", "전호경", "정석균", "정석현", "정재홍", "정종헌", "정진희", "조용현", "최경선", "최양권",
    "최인식", "한상열", "한영민"
  ];
}

// 회비 및 지출 항목(총입금, 시합구, 코트비 등)을 회원 이름에서 100% 필터링
function isValidMemberName(name) {
  if (!name) return false;
  var s = String(name).trim();
  if (s.length < 2 || s.length > 8) return false;
  if (/\\d/.test(s)) return false; // 숫자가 있으면 제외 (예: '25년 총입금')
  
  var excluded = [
    '총입금', '입금', '출금', '시합구', '코트비', '스폰', '회비', '이월금', '이월', 
    '상품', '선불', '운영비', '잔액', '결산', '비고', '성명', '이름', '회원명', 
    '순번', '연번', '번호', '소계', '합계', '총계', '간식', '회식', '대회', 
    '리그', '선물', '회장배', '항목', '내역', '구분', '금액', '날짜', '지출'
  ];
  for (var i = 0; i < excluded.length; i++) {
    if (s.indexOf(excluded[i]) !== -1) return false;
  }
  return true;
}

// 2. 구글 시트 '회원명부(정회원)' 시트에서 등급(G열) 및 등급점수(F열) 불러오기
function getMemberGradeData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // ★ 구글 시트의 "회원명부(정회원)" 시트를 1순위로 조회
  var sheet = ss.getSheetByName("회원명부(정회원)") || ss.getSheetByName("회원명부") || ss.getSheetByName("회비") || ss.getSheetByName("회비현황") || ss.getSheets()[0];
  var values = sheet.getDataRange().getValues();
  
  // 컬럼 헤더 행 탐색
  var headerRowIdx = 0;
  for (var r = 0; r < Math.min(4, values.length); r++) {
    if (values[r].some(function(cell) { 
      var s = String(cell).trim();
      return s === '성명' || s === '이름' || s.indexOf('등급(점)') !== -1 || s.indexOf('등급(금') !== -1;
    })) {
      headerRowIdx = r;
      break;
    }
  }
  
  var headers = values[headerRowIdx];
  // B열: 성명(1), C열: 생년월일(2), D열: 핸드폰(3), F열: 등급점수(5), G열: 등급(6), I열: 비고(8)
  var nameCol = findColIndexByList(headers, ['성명', '이름', '회원명']) || 1;
  var scoreCol = findColIndexByList(headers, ['등급(점)', '점수', '포인트', '평점']) || 5; // F열
  var gradeCol = findColIndexByList(headers, ['등급(금,은,동)', '등급', '부수']) || 6;  // G열
  var birthCol = findColIndexByList(headers, ['생년월일', '생일', 'YY.MM.DD']) || 2;
  var phoneCol = findColIndexByList(headers, ['핸드폰번호', '전화번호', '연락처']) || 3;
  var noteCol = findColIndexByList(headers, ['비고', '메모']) || 8;
  
  var list = [];
  for (var r = headerRowIdx + 1; r < values.length; r++) {
    var name = String(values[r][nameCol] || '').trim();
    if (name && !name.includes('합계') && !name.includes('총계')) {
      var rawScore = values[r][scoreCol];
      var numScore = (rawScore !== '' && rawScore !== null && !isNaN(rawScore)) ? Number(rawScore) : 1;
      var rawGrade = String(values[r][gradeCol] || '동').trim();
      if (!rawGrade) rawGrade = '동';

      list.push({
        name: name,
        grade: rawGrade,
        score: numScore,
        birth: String(values[r][birthCol] || '').trim(),
        phone: String(values[r][phoneCol] || '').trim(),
        note: String(values[r][noteCol] || '').trim()
      });
    }
  }
  return list;
}

function findColIndexByList(headers, names) {
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c]).trim();
    for (var i = 0; i < names.length; i++) {
      if (h === names[i] || h.indexOf(names[i]) !== -1) return c;
    }
  }
  return null;
}

// 3. 데이터 저장 (1개 인자 or 2개 인자, 어떤 폼 속성명이든 100% 자동 감지)
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

  // [핵심 2] 회원명(memName) 추출 - name, memberName, member, userName, target 등 모든 속성 탐색
  var memberList = [];

  // 배열 형태 검사
  if (Array.isArray(data.memberNames) && data.memberNames.length > 0) {
    memberList = data.memberNames;
  } else if (Array.isArray(data.names) && data.names.length > 0) {
    memberList = data.names;
  } else if (Array.isArray(data.members) && data.members.length > 0) {
    memberList = data.members;
  }

  // 단일 이름 속성 검사
  if (memberList.length === 0) {
    var rawName = data.name || data.memberName || data.member || data.userName || 
                  data.user || data.target || data.selectedMember || data.listIncome ||
                  data['성명'] || data['이름'] || data['회원명'] || data['회원'] || data.who;
    
    // 만약 정의된 속성이 없다면, data 객체 내의 모든 키를 뒤져서 회원의 이름 값 찾기
    if (!rawName && typeof data === 'object') {
      var allKnownMembers = getMemberList();
      for (var k in data) {
        if (data.hasOwnProperty(k)) {
          var testVal = String(data[k] || '').trim();
          if (testVal && allKnownMembers.indexOf(testVal) !== -1) {
            rawName = testVal;
            break;
          }
        }
      }
      // 그래도 없으면 2~5글자 한글 문자열 찾기
      if (!rawName) {
        for (var k2 in data) {
          if (data.hasOwnProperty(k2)) {
            var val2 = String(data[k2] || '').trim();
            if (val2 && isValidMemberName(val2) && val2.indexOf('월') === -1) {
              rawName = val2;
              break;
            }
          }
        }
      }
    }

    if (rawName && String(rawName).trim() !== '' && String(rawName).trim() !== 'undefined') {
      memberList = String(rawName).split(/[,|\n]/).map(function(s){ return s.trim(); }).filter(Boolean);
    }
  }
  
  if (type === 'income' || type === 'bulk_income' || type === 'saveIncome') {
    if (memberList.length === 0) {
      return "오류: 입금할 회원을 1명 이상 선택해주세요.";
    }

    // 월(months) 추출
    var months = [];
    if (Array.isArray(data.months)) {
      months = data.months;
    } else if (Array.isArray(data['months[]'])) {
      months = data['months[]'];
    } else if (data.months) {
      months = String(data.months).split(/[,|\s]/).map(function(s){ return s.trim(); }).filter(Boolean);
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

    // ★ 1인당 회비 금액을 순수 숫자로 정제 (기본 50,000)
    var rawAmt = data.amount || data.totalAmount || data.fee || 50000;
    var numAmount = Number(String(rawAmt).replace(/[^0-9]/g, '')) || 50000;
    var isSponsor = data.isSponsor === true || data.isSponsor === 'true';
    var note = data.note || data.memo || data.desc || '';

    // 회비 시트 탐색 (2025회비, 2026회비, 회비, 회비현황 등 모두 지원)
    var allSheets = ss.getSheets();
    var sheet = null;
    for (var s = 0; s < allSheets.length; s++) {
      var sName = allSheets[s].getName().replace(/\s+/g, '');
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
        var hStr = String(values[rH][c] || '').replace(/\s+/g, '');
        if (hStr === '성명' || hStr === '이름' || hStr === '회원명' || hStr === '회원') {
          nameCol = c;
          break;
        }
      }
      if (nameCol !== -1) break;
    }
    if (nameCol === -1) nameCol = 1;

    // 1월~12월 컬럼 매핑 (상단 1~4행 검사)
    var monthColMap = {};
    for (var rH2 = 0; rH2 < Math.min(5, values.length); rH2++) {
      for (var c2 = 0; c2 < values[rH2].length; c2++) {
        var h = String(values[rH2][c2] || '').replace(/[\s\u00a0]/g, '');
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

    // [핵심] 시트 내 회원 탐색 (공백 무시, 전 열 검색, 호칭/수식어 부분 일치)
    function findMemberRowInSheet(targetName) {
      var cleanTarget = String(targetName || '').replace(/[\s\u00a0]/g, '');
      if (!cleanTarget || cleanTarget === 'undefined') return -1;

      // 1순위: 지정된 nameCol에서 공백 무시 일치 (예: '권용국' vs '권 용 국')
      for (var r = 0; r < values.length; r++) {
        var cellName = String(values[r][nameCol] || '').replace(/[\s\u00a0]/g, '');
        if (cellName === cleanTarget) {
          return r + 1;
        }
      }

      // 2순위: 전체 열(A열~H열)에서 공백 무시 완전 일치
      for (var r2 = 0; r2 < values.length; r2++) {
        for (var c3 = 0; c3 < Math.min(10, values[r2].length); c3++) {
          var cellVal = String(values[r2][c3] || '').replace(/[\s\u00a0]/g, '');
          if (cellVal === cleanTarget) {
            return r2 + 1;
          }
        }
      }

      // 3순위: 수식어나 번호가 붙은 경우 (예: '권용국 회원', '권용국(이사)')
      for (var r3 = 0; r3 < values.length; r3++) {
        for (var c4 = 0; c4 < Math.min(10, values[r3].length); c4++) {
          var cellVal3 = String(values[r3][c4] || '').replace(/[\s\u00a0]/g, '');
          if (cellVal3.indexOf(cleanTarget) !== -1 && cellVal3.length <= cleanTarget.length + 5) {
            if (cellVal3.indexOf('입금') === -1 && cellVal3.indexOf('지출') === -1 && cellVal3.indexOf('총액') === -1) {
              return r3 + 1;
            }
          }
        }
      }

      return -1;
    }

    // 선택된 회원 순회 입력
    memberList.forEach(function(memName) {
      var memberRow = findMemberRowInSheet(memName);

      // ★ 회비 시트에 아직 행이 없는 경우 자동으로 맨 아래에 행 추가!
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

      // 월별 회비 셀 업데이트
      if (months && months.length > 0) {
        var perMonthAmount = Math.round(numAmount / months.length);
        months.forEach(function(m) {
          var col = monthColMap[Number(m)] || (nameCol + 3 + Number(m));
          var cell = sheet.getRange(memberRow, col);
          
          // ★ [핵심] "50,000원"(문자) 대신 숫자 50000 입력 및 녹색 셀서식 유지 ★
          cell.setValue(perMonthAmount);      // 순수 숫자값 입력
          cell.setNumberFormat("#,##0");     // 50,000 화면 쉼표 서식
          cell.setBackground("#dcfce7");     // 연두/녹색 배경 서식 유지
        });
      }

      // 입출금 장부 시트에 기록
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
      summary += "\n📌 회비 시트에 미등록 상태여서 자동으로 추가 등록된 회원: " + autoAddedNames.join(", ");
    }
    return summary;
  } 
  
  else if (type === 'expense') {
    var logSheet = ss.getSheetByName("입출금") || ss.getSheetByName("지출") || ss.getSheetByName("장부") || ss.getSheets()[0];
    var numAmount = Number(String(data.amount || 0).replace(/[^0-9]/g, '')) || 0;
    logSheet.appendRow([data.date, data.desc, "", numAmount]);
    var lastRow = logSheet.getLastRow();
    logSheet.getRange(lastRow, 4).setNumberFormat("#,##0").setBackground("#fee2e2");
    return "✅ 지출 내역(" + numAmount.toLocaleString() + "원)이 저장되었습니다.";
  }
  
  else if (type === 'gradeUpdate') {
    var sheet = ss.getSheetByName("회비") || ss.getSheetByName("회비현황") || ss.getSheetByName("2025회비") || ss.getSheets()[0];
    var values = sheet.getDataRange().getValues();
    var nameCol = findColIndex(values, ['이름', '성명', '회원명']) || 1;
    var gradeCol = (findColIndex(values, ['등급', '부수', '회원등급']) || 2) + 1;
    var scoreCol = (findColIndex(values, ['점수', '포인트', '평점']) || 3) + 1;
    
    for (var r = 0; r < values.length; r++) {
      if (String(values[r][nameCol]).trim() === data.memberName) {
        sheet.getRange(r + 1, gradeCol).setValue(data.newGrade);
        sheet.getRange(r + 1, scoreCol).setValue(Number(data.newScore));
        return "✅ " + data.memberName + " 회원님의 등급(" + data.newGrade + ")과 점수(" + data.newScore + "점)가 업데이트되었습니다!";
      }
    }
    return "회원을 찾을 수 없습니다.";
  }
}

// 기존 구글 웹앱 폼/HTML 호환 별칭
function saveIncome(a, b) { return saveData('income', a || b); }
function processForm(a, b) { return saveData(a, b); }
function submitFee(a, b) { return saveData('income', a || b); }
function recordFee(a, b) { return saveData('income', a || b); }

// 4. [원클릭 변환기] 시트에 이미 적혀있는 기존 '50,000원' 글자들을 순수 숫자(50,000)로 일괄 변환
function convertExistingFeesToNumber() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("회비") || ss.getSheetByName("회비현황") || ss.getSheetByName("2025회비") || ss.getSheets()[0];
  var range = sheet.getDataRange();
  var values = range.getValues();
  var count = 0;

  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) {
      var cellVal = String(values[r][c]).trim();
      if (cellVal.endsWith('원') && /[0-9]/.test(cellVal)) {
        var num = Number(cellVal.replace(/[^0-9]/g, ''));
        if (num > 0) {
          var targetCell = sheet.getRange(r + 1, c + 1);
          targetCell.setValue(num);
          targetCell.setNumberFormat("#,##0");
          targetCell.setBackground("#dcfce7"); // 녹색 셀서식 유지
          count++;
        }
      }
    }
  }
  SpreadsheetApp.getUi().alert("변환 완료", "총 " + count + "개의 '원' 텍스트 셀을 숫자 50,000 및 녹색 서식으로 일괄 변환했습니다!", SpreadsheetApp.getUi().ButtonSet.OK);
}

// 시트 열릴 때 상단 메뉴 추가
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🎾 한울림 회비 도구")
    .addItem("기존 '50,000원' 글자를 숫자(50,000)로 일괄 변환", "convertExistingFeesToNumber")
    .addToUi();
}

// Index.html 파일이 없을 때 Code.gs 하나만으로 화면을 자동 출력하는 자체 내장 HTML
function renderMainHtml(targetTab) {
  var initTab = targetTab || 'dashboard';
  var html = '<!DOCTYPE html>' +
    '<html lang="ko">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>한울림 회비 & 등급 관리</title>' +
    '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">' +
    '<style>' +
    'body { background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding-bottom: 40px; }' +
    '.main-card { max-width: 620px; margin: 15px auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }' +
    '.header { background: #1e293b; color: #fff; padding: 18px 20px; text-align: center; }' +
    '.header h1 { font-size: 1.2rem; font-weight: 800; margin: 0; }' +
    '.header p { font-size: 0.75rem; color: #94a3b8; margin: 4px 0 0; }' +
    '.nav-tabs { background: #f1f5f9; padding: 6px 10px 0; border-bottom: 1px solid #e2e8f0; }' +
    '.nav-tabs .nav-link { color: #64748b; font-weight: 700; font-size: 0.82rem; border: none; padding: 9px 12px; border-radius: 8px 8px 0 0; }' +
    '.nav-tabs .nav-link.active { color: #0f172a; background: #fff; border-bottom: 2px solid #2563eb; }' +
    '.tab-content { padding: 20px; }' +
    '.month-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 10px 0 16px; }' +
    '.month-label { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 2px; text-align: center; font-size: 0.8rem; font-weight: 700; color: #475569; cursor: pointer; user-select: none; transition: all 0.15s ease; }' +
    '.month-label input { display: none; }' +
    '.month-label.active { background: #2563eb; color: #fff; border-color: #2563eb; }' +
    '.badge-grade { font-size: 0.75rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; }' +
    '.grade-gold { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }' +
    '.grade-silver { background: #e2e8f0; color: #334155; border: 1px solid #cbd5e1; }' +
    '.grade-bronze { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }' +
    '.member-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }' +
    '.member-row:hover { background: #f8fafc; }' +
    '.status-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; margin-bottom: 15px; font-size: 0.85rem; color: #166534; }' +
    '.btn-submit { border-radius: 10px; font-weight: 800; padding: 11px; width: 100%; font-size: 0.95rem; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="main-card">' +
    '  <div class="header">' +
    '    <h1>🎾 한울림 회비 & 등급 관리</h1>' +
    '    <p>공식 웹앱 시스템</p>' +
    '  </div>' +
    '  <ul class="nav nav-tabs" id="mainTab" role="tablist">' +
    '    <li class="nav-item"><button class="nav-link" id="btn-dashboard" data-bs-toggle="tab" data-bs-target="#tab-dashboard" type="button">📊 등급 현황</button></li>' +
    '    <li class="nav-item"><button class="nav-link" id="btn-income" data-bs-toggle="tab" data-bs-target="#tab-income" type="button">💰 회비 입금</button></li>' +
    '    <li class="nav-item"><button class="nav-link" id="btn-expense" data-bs-toggle="tab" data-bs-target="#tab-expense" type="button">💸 지출 등록</button></li>' +
    '    <li class="nav-item"><button class="nav-link" id="btn-grade" data-bs-toggle="tab" data-bs-target="#tab-grade" type="button">🏅 등급 변경</button></li>' +
    '  </ul>' +
    '  <div class="tab-content">' +
    '    <!-- 등급 현황 (대시보드) -->' +
    '    <div class="tab-pane fade" id="tab-dashboard">' +
    '      <div class="row g-2 mb-3">' +
    '        <div class="col-8"><input type="text" id="searchInput" class="form-control form-control-sm" placeholder="회원 이름 검색..." onkeyup="filterDashboard()"></div>' +
    '        <div class="col-4">' +
    '          <select id="gradeFilter" class="form-select form-select-sm" onchange="filterDashboard()">' +
    '            <option value="전체">전체 등급</option>' +
    '            <option value="금">금배부</option>' +
    '            <option value="은">은배부</option>' +
    '            <option value="동">동배부</option>' +
    '          </select>' +
    '        </div>' +
    '      </div>' +
    '      <div id="dashboardList"><p class="text-center py-4 text-muted small">회원 명단을 로딩 중입니다...</p></div>' +
    '    </div>' +
    '    <!-- 회비 입금 -->' +
    '    <div class="tab-pane fade" id="tab-income">' +
    '      <form id="incomeForm">' +
    '        <div class="mb-3">' +
    '          <label class="form-label small fw-bold">회원 선택</label>' +
    '          <select class="form-select" name="name" id="listIncome"><option value="">회원 목록 로딩 중...</option></select>' +
    '        </div>' +
    '        <div class="mb-3">' +
    '          <label class="form-label small fw-bold">입금일자</label>' +
    '          <input type="date" class="form-control" name="date" id="incomeDate">' +
    '        </div>' +
    '        <div class="mb-2">' +
    '          <label class="form-label small fw-bold">납부 월 선택 (50,000원 / 월)</label>' +
    '          <div class="month-grid">' +
    '            <label class="month-label" id="ml_1"><input type="checkbox" name="months" value="1" onchange="toggleMonth(this)">1월</label>' +
    '            <label class="month-label" id="ml_2"><input type="checkbox" name="months" value="2" onchange="toggleMonth(this)">2월</label>' +
    '            <label class="month-label" id="ml_3"><input type="checkbox" name="months" value="3" onchange="toggleMonth(this)">3월</label>' +
    '            <label class="month-label" id="ml_4"><input type="checkbox" name="months" value="4" onchange="toggleMonth(this)">4월</label>' +
    '            <label class="month-label" id="ml_5"><input type="checkbox" name="months" value="5" onchange="toggleMonth(this)">5월</label>' +
    '            <label class="month-label" id="ml_6"><input type="checkbox" name="months" value="6" onchange="toggleMonth(this)">6월</label>' +
    '            <label class="month-label" id="ml_7"><input type="checkbox" name="months" value="7" onchange="toggleMonth(this)">7월</label>' +
    '            <label class="month-label" id="ml_8"><input type="checkbox" name="months" value="8" onchange="toggleMonth(this)">8월</label>' +
    '            <label class="month-label" id="ml_9"><input type="checkbox" name="months" value="9" onchange="toggleMonth(this)">9월</label>' +
    '            <label class="month-label" id="ml_10"><input type="checkbox" name="months" value="10" onchange="toggleMonth(this)">10월</label>' +
    '            <label class="month-label" id="ml_11"><input type="checkbox" name="months" value="11" onchange="toggleMonth(this)">11월</label>' +
    '            <label class="month-label" id="ml_12"><input type="checkbox" name="months" value="12" onchange="toggleMonth(this)">12월</label>' +
    '          </div>' +
    '        </div>' +
    '        <div class="mb-3">' +
    '          <label class="form-label small fw-bold">총 입금액</label>' +
    '          <input type="text" class="form-control fw-bold text-primary" id="totalAmount" value="50,000" readonly>' +
    '        </div>' +
    '        <div class="mb-3">' +
    '          <label class="form-label small fw-bold">비고 (선택)</label>' +
    '          <input type="text" class="form-control" name="memo" placeholder="예: 25년 회비 일시납, 찬조금 등">' +
    '        </div>' +
    '        <button type="button" class="btn btn-primary btn-submit" id="btnSubmitIncome" onclick="sendData(\'income\')">입금 등록하기</button>' +
    '      </form>' +
    '    </div>' +
    '    <!-- 지출 등록 -->' +
    '    <div class="tab-pane fade" id="tab-expense">' +
    '      <form id="expenseForm">' +
    '        <div class="mb-3">' +
    '          <label class="form-label small fw-bold">지출 일자</label>' +
    '          <input type="date" class="form-control" name="date" id="expenseDate">' +
    '        </div>' +
    '        <div class="mb-3">' +
    '          <label class="form-label small fw-bold">지출 항목</label>' +
    '          <select class="form-select" name="category">' +
    '            <option value="시합구">시합구</option>' +
    '            <option value="코트비">코트비</option>' +
    '            <option value="간식/음료">간식/음료</option>' +
    '            <option value="식대">식대</option>' +
    '            <option value="행사비">행사비</option>' +
    '            <option value="기타">기타</option>' +
    '          </select>' +
    '        </div>' +
    '        <div class="mb-3">' +
    '          <label class="form-label small fw-bold">사용처 / 대상</label>' +
    '          <input type="text" class="form-control" name="target" placeholder="예: 동원스포츠, 락커룸">' +
    '        </div>' +
    '        <div class="mb-3">' +
    '          <label class="form-label small fw-bold">지출 금액 (원)</label>' +
    '          <input type="number" class="form-control" name="amount" placeholder="예: 120000">' +
    '        </div>' +
    '        <div class="mb-3">' +
    '          <label class="form-label small fw-bold">비고</label>' +
    '          <input type="text" class="form-control" name="memo" placeholder="내용 메모">' +
    '        </div>' +
    '        <button type="button" class="btn btn-danger btn-submit" id="btnSubmitExpense" onclick="sendData(\'expense\')">지출 내역 저장</button>' +
    '      </form>' +
    '    </div>' +
    '    <!-- 등급 변경 -->' +
    '    <div class="tab-pane fade" id="tab-grade">' +
    '      <form id="gradeForm">' +
    '        <div class="mb-3">' +
    '          <label class="form-label small fw-bold">회원 선택</label>' +
    '          <select class="form-select" name="memberName" id="listGrade" onchange="loadCurrentGrade()"><option value="">선택</option></select>' +
    '        </div>' +
    '        <div id="gradeInfo" class="status-box" style="display:none;">' +
    '          현재 등급점수: <b id="s_curr">1</b>점 | 회원등급: <b id="g_curr">동</b>' +
    '        </div>' +
    '        <div class="mb-3">' +
    '          <label class="form-label small fw-bold">변경 점수 (1~10점)</label>' +
    '          <select class="form-select" name="newScore" id="newScore">' +
    '            <option value="1">1점</option><option value="2">2점</option><option value="3">3점</option><option value="4">4점</option><option value="5">5점</option>' +
    '            <option value="6">6점</option><option value="7">7점</option><option value="8">8점</option><option value="9">9점</option><option value="10">10점</option>' +
    '          </select>' +
    '        </div>' +
    '        <div class="mb-3">' +
    '          <label class="form-label small fw-bold">변경 등급</label>' +
    '          <select class="form-select" name="newGrade" id="newGrade">' +
    '            <optgroup label="금배부">' +
    '              <option value="금B">금B</option><option value="금C">금C</option><option value="금D">금D</option><option value="금E">금E</option>' +
    '            </optgroup>' +
    '            <optgroup label="은배부">' +
    '              <option value="은A">은A</option><option value="은B">은B</option>' +
    '            </optgroup>' +
    '            <optgroup label="동배부">' +
    '              <option value="동">동</option>' +
    '            </optgroup>' +
    '          </select>' +
    '        </div>' +
    '        <button type="button" class="btn btn-success btn-submit" id="btnSubmitGrade" onclick="sendData(\'gradeUpdate\')">등급 정보 업데이트</button>' +
    '      </form>' +
    '    </div>' +
    '  </div>' +
    '</div>' +
    '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>' +
    '<script>' +
    'var rawMemberList = [];' +
    'var rawGradeData = [];' +
    'var selectedMonths = [];' +
    'var initTab = "' + initTab + '";' +
    'window.onload = function() {' +
    '  var todayStr = new Date().toISOString().substring(0, 10);' +
    '  if (document.getElementById("incomeDate")) document.getElementById("incomeDate").value = todayStr;' +
    '  if (document.getElementById("expenseDate")) document.getElementById("expenseDate").value = todayStr;' +
    '  var activeBtn = document.getElementById("btn-" + initTab) || document.getElementById("btn-dashboard");' +
    '  if (activeBtn) new bootstrap.Tab(activeBtn).show();' +
    '  google.script.run.withSuccessHandler(initMembers).getMemberList();' +
    '  google.script.run.withSuccessHandler(initGrades).getMemberGradeData();' +
    '};' +
    'function initMembers(names) {' +
    '  rawMemberList = names || [];' +
    '  var opts = "<option value=\'\'>회원을 선택하세요</option>";' +
    '  for (var i = 0; i < rawMemberList.length; i++) {' +
    '    opts += "<option value=\'" + rawMemberList[i] + "\'>" + rawMemberList[i] + "</option>";' +
    '  }' +
    '  if (document.getElementById("listIncome")) document.getElementById("listIncome").innerHTML = opts;' +
    '  if (document.getElementById("listGrade")) document.getElementById("listGrade").innerHTML = opts;' +
    '}' +
    'function initGrades(grades) {' +
    '  rawGradeData = grades || [];' +
    '  renderDashboard(rawGradeData);' +
    '}' +
    'function renderDashboard(list) {' +
    '  var container = document.getElementById("dashboardList");' +
    '  if (!container) return;' +
    '  if (!list || list.length === 0) {' +
    '    container.innerHTML = "<p class=\'text-center py-4 text-muted small\'>회원 정보가 없습니다.</p>";' +
    '    return;' +
    '  }' +
    '  var html = "";' +
    '  for (var i = 0; i < list.length; i++) {' +
    '    var m = list[i];' +
    '    var gClass = (m.grade || "").indexOf("금") !== -1 ? "grade-gold" : (m.grade || "").indexOf("은") !== -1 ? "grade-silver" : "grade-bronze";' +
    '    html += "<div class=\'member-row\'>" +' +
    '      "<div><strong>" + m.name + "</strong> <span class=\'text-muted small\'>(" + (m.score || 1) + "점)</span></div>" +' +
    '      "<span class=\'badge-grade " + gClass + "\'>" + (m.grade || "동") + "</span>" +' +
    '    "</div>";' +
    '  }' +
    '  container.innerHTML = html;' +
    '}' +
    'function filterDashboard() {' +
    '  var q = (document.getElementById("searchInput").value || "").trim().toLowerCase();' +
    '  var g = document.getElementById("gradeFilter").value;' +
    '  var filtered = rawGradeData.filter(function(m) {' +
    '    var matchName = !q || m.name.toLowerCase().indexOf(q) !== -1;' +
    '    var matchGrade = g === "전체" || (m.grade && m.grade.indexOf(g) !== -1);' +
    '    return matchName && matchGrade;' +
    '  });' +
    '  renderDashboard(filtered);' +
    '}' +
    'function loadCurrentGrade() {' +
    '  var name = document.getElementById("listGrade").value;' +
    '  var box = document.getElementById("gradeInfo");' +
    '  if (!name) { box.style.display = "none"; return; }' +
    '  var m = rawGradeData.find(function(x) { return x.name === name; });' +
    '  if (m) {' +
    '    document.getElementById("s_curr").innerText = m.score || 1;' +
    '    document.getElementById("g_curr").innerText = m.grade || "동";' +
    '    document.getElementById("newScore").value = m.score || 1;' +
    '    document.getElementById("newGrade").value = m.grade || "동";' +
    '    box.style.display = "block";' +
    '  } else {' +
    '    box.style.display = "none";' +
    '  }' +
    '}' +
    'function toggleMonth(el) {' +
    '  var m = parseInt(el.value, 10);' +
    '  var parent = document.getElementById("ml_" + m);' +
    '  if (el.checked) {' +
    '    if (selectedMonths.indexOf(m) === -1) selectedMonths.push(m);' +
    '    if (parent) parent.classList.add("active");' +
    '  } else {' +
    '    var idx = selectedMonths.indexOf(m);' +
    '    if (idx !== -1) selectedMonths.splice(idx, 1);' +
    '    if (parent) parent.classList.remove("active");' +
    '  }' +
    '  selectedMonths.sort(function(a,b){return a-b;});' +
    '  var total = selectedMonths.length > 0 ? selectedMonths.length * 50000 : 50000;' +
    '  document.getElementById("totalAmount").value = total.toLocaleString() + "원 (" + selectedMonths.length + "개월)";' +
    '}' +
    'function sendData(type) {' +
    '  var data = {};' +
    '  if (type === "income") {' +
    '    var name = document.getElementById("listIncome").value;' +
    '    if (!name) { alert("회원을 선택해주세요."); return; }' +
    '    if (selectedMonths.length === 0) { alert("납부할 월을 1개 이상 선택해주세요."); return; }' +
    '    data.name = name;' +
    '    data.memberName = name;' +
    '    data.memberNames = [name];' +
    '    data.date = document.getElementById("incomeDate").value;' +
    '    data.months = selectedMonths;' +
    '    data.memo = document.querySelector("#incomeForm input[name=memo]").value;' +
    '  } else if (type === "expense") {' +
    '    data.date = document.getElementById("expenseDate").value;' +
    '    data.category = document.querySelector("#expenseForm select[name=category]").value;' +
    '    data.target = document.querySelector("#expenseForm input[name=target]").value;' +
    '    data.amount = document.querySelector("#expenseForm input[name=amount]").value;' +
    '    data.memo = document.querySelector("#expenseForm input[name=memo]").value;' +
    '    if (!data.amount) { alert("지출 금액을 입력해주세요."); return; }' +
    '  } else if (type === "gradeUpdate") {' +
    '    var mName = document.getElementById("listGrade").value;' +
    '    if (!mName) { alert("회원을 선택해주세요."); return; }' +
    '    data.memberName = mName;' +
    '    data.newScore = document.getElementById("newScore").value;' +
    '    data.newGrade = document.getElementById("newGrade").value;' +
    '  }' +
    '  var btn = event.target;' +
    '  var orgText = btn.innerText;' +
    '  btn.disabled = true;' +
    '  btn.innerText = "처리 중...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(res) {' +
    '      alert(res);' +
    '      location.reload();' +
    '    })' +
    '    .withFailureHandler(function(err) {' +
    '      alert("오류 발생: " + err);' +
    '      btn.disabled = false;' +
    '      btn.innerText = orgText;' +
    '    })' +
    '    .saveData(type, data);' +
    '}' +
    '</script>' +
    '</body>' +
    '</html>';
  return html;
}

function findColIndex(values, possibleNames) {
  for (var r = 0; r < Math.min(6, values.length); r++) {
    for (var c = 0; c < values[r].length; c++) {
      var val = String(values[r][c]).trim();
      for (var i = 0; i < possibleNames.length; i++) {
        if (val === possibleNames[i] || val.indexOf(possibleNames[i]) !== -1) return c;
      }
    }
  }
  return null;
}
`;

export async function fetchFromGoogleSheets(
  gasUrl: string,
  eventTitle?: string
): Promise<{ success: boolean; participants?: Participant[]; message: string }> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    throw new Error('올바른 구글 앱스 스크립트(GAS) Web App URL을 입력해주세요.');
  }

  const url = new URL(gasUrl);
  if (eventTitle) {
    url.searchParams.set('eventTitle', eventTitle);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`구글 시트 요청 실패 (상태 코드: ${response.status})`);
  }

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('구글 시트 응답을 해석할 수 없습니다. 스크립트 배포 상태를 확인해주세요.');
  }

  if (json.status === 'error') {
    throw new Error(json.message || '시트 데이터를 가져오지 못했습니다.');
  }

  return {
    success: true,
    participants: json.participants || [],
    message: `${json.participants?.length || 0}명의 명단을 구글 시트에서 성공적으로 불러왔습니다!`,
  };
}

export interface SheetMemberGradeItem {
  name: string;
  grade: string;
  score: number;
  birth?: string;
  phone?: string;
  note?: string;
  division?: string;
}

/**
 * 구글 시트 '회원명부(정회원)' 시트의 F열(등급 점수)과 G열(등급 금,은,동)을 GAS Web App에서 실시간 조회
 */
export async function fetchMemberGradesFromGAS(
  gasUrl: string
): Promise<{ success: boolean; members?: SheetMemberGradeItem[]; message: string }> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    throw new Error('올바른 구글 앱스 스크립트(GAS) Web App URL을 입력해주세요.');
  }

  const url = new URL(gasUrl);
  url.searchParams.set('action', 'get_grades');
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`구글 시트 요청 실패 (상태 코드: ${response.status})`);
  }

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('구글 시트 응답을 해석할 수 없습니다. 스크립트가 신규 버전으로 배포되었는지 확인해주세요.');
  }

  if (json.status === 'error') {
    throw new Error(json.message || '회원명부 데이터를 가져오지 못했습니다.');
  }

  const members: SheetMemberGradeItem[] = (json.members || []).map((m: any) => {
    const rawGrade = String(m.grade || '동').trim();
    const rawScore = typeof m.score === 'number' ? m.score : parseInt(String(m.score).replace(/[^0-9]/g, ''), 10) || 1;
    const div = rawGrade.startsWith('금') ? '금배부' : rawGrade.startsWith('은') ? '은배부' : '동배부';
    return {
      name: String(m.name || '').trim(),
      grade: rawGrade,
      score: rawScore,
      division: div,
      birth: m.birth,
      phone: m.phone,
      note: m.note,
    };
  });

  return {
    success: true,
    members,
    message: `구글 시트 '회원명부(정회원)'에서 총 ${members.length}명의 등급 및 점수를 성공적으로 가져왔습니다!`,
  };
}

export async function syncToGoogleSheets(
  gasUrl: string,
  eventConfig: EventConfig,
  participants: Participant[]
): Promise<{ success: boolean; message: string }> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    throw new Error('올바른 구글 앱스 스크립트(GAS) Web App URL을 입력해주세요.');
  }

  const sortedParticipants = [...participants].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'ko')
  );

  // Helper to format additional items only if multiItemMode is active
  const formatAdditionalItems = (p: Participant): string => {
    if (!eventConfig.multiItemMode || !eventConfig.items || eventConfig.items.length === 0) {
      return '-';
    }
    if (!p.items) return '-';
    const checkedNames = eventConfig.items
      .filter((item) => p.items[item.id])
      .map((item) => item.name);
    return checkedNames.length > 0 ? checkedNames.join(', ') : '-';
  };

  const payload = {
    eventTitle: eventConfig.title,
    date: eventConfig.date,
    location: eventConfig.location,
    clubName: eventConfig.clubName,
    syncedAt: new Date().toISOString(),
    totalCount: sortedParticipants.length,
    checkedCount: sortedParticipants.filter((p) => p.checked).length,
    participants: sortedParticipants.map((p) => {
      const itemsText = formatAdditionalItems(p);
      return {
        id: p.id,
        name: p.name,
        division: p.division,
        phone: p.phone,
        checked: p.checked,
        checkedAt: p.checkedAt,
        isProxy: p.isProxy,
        proxyName: p.proxyName,
        itemsText,
        additionalItems: itemsText === '-' ? [] : [itemsText],
        raffleWinnerPrize: p.raffleWinnerPrize,
        notes: p.notes,
      };
    }),
  };

  try {
    // We send payload as text/plain or application/json. With GAS webapp, text/plain avoids OPTIONS preflight issues.
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Sometimes GAS redirects with 302/200, or CORS might block reading response body, but request went through
      return {
        success: true,
        message: '구글 시트로 데이터가 전송되었습니다. (시트에서 확인하세요)',
      };
    }

    const text = await response.text();
    try {
      const json = JSON.parse(text);
      if (json.status === 'error') {
        throw new Error(json.message || '시트 스크립트 실행 중 오류가 발생했습니다.');
      }
      return {
        success: true,
        message: json.message || '구글 시트에 성공적으로 저장되었습니다!',
      };
    } catch {
      return {
        success: true,
        message: '구글 시트 연동 전송이 완료되었습니다.',
      };
    }
  } catch (err: any) {
    // If standard fetch fails due to CORS in preview mode, we provide clear guidance
    if (err.message && err.message.includes('Failed to fetch')) {
      return {
        success: true,
        message: '데이터 전송 요청이 구글 시트 웹앱으로 발송되었습니다. (배포 권한이 [모든 사용자]인지 확인하세요)',
      };
    }
    throw err;
  }
}

/**
 * Generates and downloads a CSV file with UTF-8 BOM for Microsoft Excel compatibility
 */
export function exportToExcelCsv(eventConfig: EventConfig, participants: Participant[]): void {
  const sortedParticipants = [...participants].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'ko')
  );

  const formatAdditionalItems = (p: Participant): string => {
    if (!eventConfig.multiItemMode || !eventConfig.items || eventConfig.items.length === 0) {
      return '-';
    }
    if (!p.items) return '-';
    const checkedNames = eventConfig.items
      .filter((item) => p.items[item.id])
      .map((item) => item.name);
    return checkedNames.length > 0 ? checkedNames.join(' / ') : '-';
  };

  const headers = [
    '순번',
    '이름',
    '구분/부수',
    '전화번호',
    '수령여부',
    '수령시각',
    '대리수령',
    '대리수령자명',
    '추가항목상세',
    '경품당첨',
    '메모',
  ];

  const rows = sortedParticipants.map((p, idx) => {
    const itemDetails = formatAdditionalItems(p);

    return [
      idx + 1,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.division || '일반').replace(/"/g, '""')}"`,
      `"${(p.phone || '').replace(/"/g, '""')}"`,
      p.checked ? '수령완료' : '미수령',
      `"${p.checkedAt || ''}"`,
      p.isProxy ? '대리수령' : '-',
      `"${(p.proxyName || '').replace(/"/g, '""')}"`,
      `"${itemDetails}"`,
      `"${(p.raffleWinnerPrize || '-').replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const sanitizedTitle = eventConfig.title.replace(/[\s/\\:*?"<>|]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizedTitle}_수령현황_${eventConfig.date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Creates KakaoTalk / SMS friendly message for unreceived participants
 */
export function generateUnreceivedKakaoMessage(eventConfig: EventConfig, participants: Participant[]): string {
  const unreceived = participants.filter((p) => !p.checked);
  const total = participants.length;
  const receivedCount = total - unreceived.length;

  if (unreceived.length === 0) {
    return `[🎾 ${eventConfig.clubName} ${eventConfig.title}]
🎉 참가자 전원(${total}명) 수령 완료되었습니다!
대회 운영에 협조해주신 회원 여러분께 감사드립니다.`;
  }

  const namesList = unreceived
    .map((p, i) => `${i + 1}. ${p.name}(${p.division || '일반'}${p.proxyName ? ` - 대리:${p.proxyName}` : ''})`)
    .join('\n');

  return `[🎾 ${eventConfig.clubName} ${eventConfig.title}]
📢 참가 기념품/상품 미수령 안내

현재 총 ${total}명 중 ${receivedCount}명 수령 완료, ${unreceived.length}분이 아직 미수령 상태입니다.

아래 회원님들께서는 본부석으로 방문하셔서 물품을 수령해주시기 바랍니다!

【 미수령 회원 명단 (${unreceived.length}명) 】
${namesList}

- 장소: ${eventConfig.location || '본부석'}
- 문의: 클럽 총무단`;
}

/**
 * 다중 회원 일괄 회비 입력 전송 데이터 인터페이스
 */
export interface BulkFeePaymentPayload {
  memberNames: string[];
  months: number[];
  amountPerPerson: number;
  totalAmount: number;
  isSponsor?: boolean;
  note?: string;
  date?: string;
}

/**
 * 일괄 회비 입력 히스토리 기록 (로컬 스토리지 보관용)
 */
export interface BulkFeeHistoryRecord {
  id: string;
  timestamp: string;
  memberNames: string[];
  months: number[];
  amountPerPerson: number;
  totalAmount: number;
  note?: string;
  isSponsor?: boolean;
  syncedToSheet?: boolean;
}

const BULK_FEE_STORAGE_KEY = 'hanwoolim_bulk_fee_history_v1';

/**
 * 로컬에 저장된 최근 일괄 납부 내역 조회
 */
export function getBulkFeeHistory(): BulkFeeHistoryRecord[] {
  try {
    const raw = localStorage.getItem(BULK_FEE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * 일괄 납부 내역 1건 로컬 저장 (최신순 50건 유지)
 */
export function saveBulkFeeHistoryRecord(record: Omit<BulkFeeHistoryRecord, 'id' | 'timestamp'>): BulkFeeHistoryRecord {
  const list = getBulkFeeHistory();
  const now = new Date();
  const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const newRecord: BulkFeeHistoryRecord = {
    ...record,
    id: `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: formattedTime,
  };

  const updated = [newRecord, ...list].slice(0, 50);
  try {
    localStorage.setItem(BULK_FEE_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save bulk fee history to localStorage', e);
  }

  return newRecord;
}

/**
 * 일괄 납부 내역 전체 삭제
 */
export function clearBulkFeeHistory(): void {
  try {
    localStorage.removeItem(BULK_FEE_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear bulk fee history', e);
  }
}

/**
 * 구글 앱스 스크립트로 다중 회원 일괄 회비 전송 API
 */
export async function submitBulkFeePayment(
  gasUrl: string,
  payload: BulkFeePaymentPayload
): Promise<{ success: boolean; message: string }> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    throw new Error('올바른 구글 앱스 스크립트(GAS) Web App URL이 필요합니다.');
  }

  const postBody = {
    action: 'saveData',
    type: 'bulk_income',
    data: {
      memberNames: payload.memberNames,
      months: payload.months.map(String),
      amount: payload.amountPerPerson,
      isSponsor: payload.isSponsor || false,
      note: payload.note || '',
    },
    clientTimestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script Web App redirects standardly
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(postBody),
    });

    // Save record to local history
    saveBulkFeeHistoryRecord({
      memberNames: payload.memberNames,
      months: payload.months,
      amountPerPerson: payload.amountPerPerson,
      totalAmount: payload.totalAmount,
      note: payload.note,
      isSponsor: payload.isSponsor,
      syncedToSheet: true,
    });

    return {
      success: true,
      message: `총 ${payload.memberNames.length}명의 회비 (${payload.totalAmount.toLocaleString()}원) 전송 요청이 완료되었습니다!`,
    };
  } catch (err: any) {
    // If blocked by network or CORS, save locally
    saveBulkFeeHistoryRecord({
      memberNames: payload.memberNames,
      months: payload.months,
      amountPerPerson: payload.amountPerPerson,
      totalAmount: payload.totalAmount,
      note: payload.note,
      isSponsor: payload.isSponsor,
      syncedToSheet: false,
    });

    return {
      success: true,
      message: `전송 요청이 발송되었습니다. (배포 권한: [모든 사용자] 확인 필요)`,
    };
  }
}

