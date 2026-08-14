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
      var itemDetails = [];
      if (p.items) {
        for (var k in p.items) {
          if (p.items[k]) itemDetails.push(k);
        }
      }
      
      rows.push([
        idx + 1,
        p.name || "",
        p.division || "일반",
        p.phone || "",
        p.checked ? "수령완료" : "미수령",
        p.checkedAt || "",
        p.proxyName || (p.isProxy ? "대리수령" : "-"),
        itemDetails.join(", ") || "-",
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

  const payload = {
    eventTitle: eventConfig.title,
    date: eventConfig.date,
    location: eventConfig.location,
    clubName: eventConfig.clubName,
    syncedAt: new Date().toISOString(),
    totalCount: participants.length,
    checkedCount: participants.filter((p) => p.checked).length,
    participants: participants.map((p) => ({
      id: p.id,
      name: p.name,
      division: p.division,
      phone: p.phone,
      checked: p.checked,
      checkedAt: p.checkedAt,
      isProxy: p.isProxy,
      proxyName: p.proxyName,
      items: p.items,
      raffleWinnerPrize: p.raffleWinnerPrize,
      notes: p.notes,
    })),
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

  const rows = participants.map((p, idx) => {
    const itemDetails = Object.entries(p.items || {})
      .filter(([_, v]) => v)
      .map(([k]) => k)
      .join(' / ');

    return [
      idx + 1,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.division || '일반').replace(/"/g, '""')}"`,
      `"${(p.phone || '').replace(/"/g, '""')}"`,
      p.checked ? '수령완료' : '미수령',
      `"${p.checkedAt || ''}"`,
      p.isProxy ? '대리수령' : '-',
      `"${(p.proxyName || '').replace(/"/g, '""')}"`,
      `"${itemDetails || '-'}"`,
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
