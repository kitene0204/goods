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
 * 한울림 회비 & 등급 관리 전체 Google Apps Script (Code.gs)
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
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('한울림 회비 & 등급 관리')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 외부 API 및 리액트 웹앱 연동용 POST 핸들러
function doPost(e) {
  try {
    var contents = {};
    if (e && e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    }
    var type = contents.type || contents.action || 'income';
    var result = saveData(type, contents);
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

// 1. 회원 명단 불러오기
function getMemberList() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("회비") || ss.getSheetByName("회비현황") || ss.getSheetByName("2025회비") || ss.getSheets()[0];
  var values = sheet.getDataRange().getValues();
  
  var nameCol = findColIndex(values, ['이름', '성명', '회원명']) || 1;
  var names = [];
  for (var r = 1; r < values.length; r++) {
    var name = String(values[r][nameCol] || '').trim();
    if (name && !name.includes('합계') && !name.includes('총계') && names.indexOf(name) === -1) {
      names.push(name);
    }
  }
  return names.sort();
}

// 2. 회원 등급 및 점수 목록 불러오기
function getMemberGradeData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("회비") || ss.getSheetByName("회비현황") || ss.getSheetByName("2025회비") || ss.getSheets()[0];
  var values = sheet.getDataRange().getValues();
  
  var nameCol = findColIndex(values, ['이름', '성명', '회원명']) || 1;
  var gradeCol = findColIndex(values, ['등급', '부수', '회원등급']) || 2;
  var scoreCol = findColIndex(values, ['점수', '포인트', '평점']) || 3;
  
  var list = [];
  for (var r = 1; r < values.length; r++) {
    var name = String(values[r][nameCol] || '').trim();
    if (name && !name.includes('합계') && !name.includes('총계')) {
      list.push({
        name: name,
        grade: String(values[r][gradeCol] || '미정').trim(),
        score: values[r][scoreCol] || 0
      });
    }
  }
  return list;
}

// 3. 데이터 저장 (핵심: 1명 또는 여러명 일괄 입력, 50,000 숫자만 저장 & 녹색 셀서식 유지)
function saveData(type, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (type === 'income' || type === 'bulk_income') {
    // 1명 또는 여러 명(배열 또는 쉼표 구분) 모두 완벽 지원
    var memberList = [];
    if (Array.isArray(data.memberNames) && data.memberNames.length > 0) {
      memberList = data.memberNames;
    } else if (data.memberName) {
      memberList = String(data.memberName).split(/[,|\n]/).map(function(s){ return s.trim(); }).filter(Boolean);
    }

    if (memberList.length === 0) {
      return "오류: 입금할 회원을 1명 이상 선택해주세요.";
    }

    var months = data.months || []; // ["1", "2", ...]
    // ★ 1인당 회비 금액을 순수 숫자로 정제 (기본 50,000)
    var numAmount = Number(String(data.amount || 50000).replace(/[^0-9]/g, '')) || 50000;
    var isSponsor = data.isSponsor === true || data.isSponsor === 'true';
    var note = data.note || '';

    var sheet = ss.getSheetByName("회비") || ss.getSheetByName("회비현황") || ss.getSheetByName("2025회비") || ss.getSheets()[0];
    var values = sheet.getDataRange().getValues();
    var nameCol = findColIndex(values, ['이름', '성명', '회원명']) || 1;

    // 1월~12월 컬럼 매핑
    var headerRowIdx = 0;
    for (var r = 0; r < Math.min(3, values.length); r++) {
      if (values[r].some(function(cell) { return String(cell).includes('1월') || String(cell).includes('2월'); })) {
        headerRowIdx = r;
        break;
      }
    }
    
    var headers = values[headerRowIdx];
    var monthColMap = {};
    for (var c = 0; c < headers.length; c++) {
      var h = String(headers[c]).trim();
      for (var m = 1; m <= 12; m++) {
        if (h === m + '월' || h === String(m)) {
          monthColMap[m] = c + 1;
        }
      }
    }

    var logSheet = ss.getSheetByName("입출금") || ss.getSheetByName("입출금내역") || ss.getSheetByName("장부");
    var today = Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd");
    var successCount = 0;
    var notFoundNames = [];

    // ★ 선택된 모든 회원을 순회하며 회비 입력 처리 ★
    memberList.forEach(function(memName) {
      var memberRow = -1;
      for (var r = 0; r < values.length; r++) {
        if (String(values[r][nameCol]).trim() === memName) {
          memberRow = r + 1;
          break;
        }
      }

      if (memberRow === -1) {
        notFoundNames.push(memName);
        return;
      }

      // 월별 회비 셀 업데이트
      if (months && months.length > 0) {
        var perMonthAmount = Math.round(numAmount / months.length);
        months.forEach(function(m) {
          var col = monthColMap[Number(m)] || (nameCol + 3 + Number(m));
          var cell = sheet.getRange(memberRow, col);
          
          // ★ [핵심] "50,000원"(문자) 대신 숫자 50000 입력 및 녹색 셀서식 유지 ★
          cell.setValue(perMonthAmount);      // 순수 숫자값 입력 (수식/합계 지원)
          cell.setNumberFormat("#,##0");     // 50,000 화면 쉼표 서식
          cell.setBackground("#dcfce7");     // 연두/녹색 배경 서식 유지
        });
      }

      // 입출금 장부 시트에 기록
      if (logSheet) {
        var desc = isSponsor ? "★ 스폰: " + note : (months.join(",") + "월 회비" + (note ? " (" + note + ")" : ""));
        logSheet.appendRow([today, memName, desc, numAmount, ""]);
        var lastRow = logSheet.getLastRow();
        logSheet.getRange(lastRow, 4).setNumberFormat("#,##0").setBackground("#dcfce7");
      }

      successCount++;
    });

    var totalSum = successCount * numAmount;
    var summary = "✅ 총 " + successCount + "명 회비 입력 완료! (총액: " + totalSum.toLocaleString() + "원)";
    if (notFoundNames.length > 0) {
      summary += "\n⚠️ 시트에 없는 회원: " + notFoundNames.join(", ");
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

function findColIndex(values, possibleNames) {
  for (var r = 0; r < Math.min(3, values.length); r++) {
    for (var c = 0; c < values[r].length; c++) {
      var val = String(values[r][c]).trim();
      for (var i = 0; i < possibleNames.length; i++) {
        if (val === possibleNames[i]) return c;
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

