import React, { useState } from 'react';
import { EventConfig, Participant, SyncHistoryEntry } from '../types';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Send, 
  Check, 
  Copy, 
  ExternalLink, 
  Code, 
  HelpCircle, 
  RefreshCw,
  Clock,
  Sparkles,
  DownloadCloud
} from 'lucide-react';
import { DEFAULT_GAS_CODE, exportToExcelCsv, syncToGoogleSheets, fetchFromGoogleSheets } from '../utils/gasSync';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EventConfig;
  participants: Participant[];
  syncHistory: SyncHistoryEntry[];
  onUpdateConfig: (newConfig: Partial<EventConfig>) => void;
  onAddSyncHistory: (entry: SyncHistoryEntry) => void;
  onImportParticipants?: (newParticipants: Participant[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  config,
  participants,
  syncHistory,
  onUpdateConfig,
  onAddSyncHistory,
  onImportParticipants,
  onShowToast,
}) => {
  const [gasUrl, setGasUrl] = useState(config.gasWebhookUrl || '');
  const [sheetUrl, setSheetUrl] = useState(config.googleSheetUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  React.useEffect(() => {
    if (config.gasWebhookUrl) {
      setGasUrl(config.gasWebhookUrl);
    }
    if (config.googleSheetUrl) {
      setSheetUrl(config.googleSheetUrl);
    }
  }, [config.gasWebhookUrl, config.googleSheetUrl, isOpen]);

  if (!isOpen) return null;

  const handleSaveUrls = () => {
    onUpdateConfig({
      gasWebhookUrl: gasUrl.trim(),
      googleSheetUrl: sheetUrl.trim(),
    });
    onShowToast('구글 시트 연동 정보가 저장되었습니다.', 'success');
  };

  const handleSyncToGas = async () => {
    if (!gasUrl.trim()) {
      onShowToast('구글 앱스 스크립트(GAS) Web App URL을 먼저 입력해주세요.', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      // Save current url config
      onUpdateConfig({
        gasWebhookUrl: gasUrl.trim(),
        googleSheetUrl: sheetUrl.trim(),
      });

      const res = await syncToGoogleSheets(gasUrl.trim(), config, participants);
      
      const newEntry: SyncHistoryEntry = {
        id: `sync-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        eventTitle: config.title,
        totalCount: participants.length,
        checkedCount: participants.filter((p) => p.checked).length,
        status: 'success',
        message: res.message,
      };
      onAddSyncHistory(newEntry);
      onShowToast(`🎉 ${res.message}`, 'success');
    } catch (err: any) {
      const failedEntry: SyncHistoryEntry = {
        id: `sync-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        eventTitle: config.title,
        totalCount: participants.length,
        checkedCount: participants.filter((p) => p.checked).length,
        status: 'failed',
        message: err.message || '전송 실패',
      };
      onAddSyncHistory(failedEntry);
      onShowToast(`전송 오류: ${err.message || '네트워크 상태를 확인해주세요.'}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFetchFromGas = async () => {
    if (!gasUrl.trim()) {
      onShowToast('구글 앱스 스크립트(GAS) Web App URL을 먼저 입력해주세요.', 'error');
      return;
    }

    setIsFetching(true);
    try {
      const res = await fetchFromGoogleSheets(gasUrl.trim(), config.title);
      if (res.participants && res.participants.length > 0) {
        if (onImportParticipants) {
          onImportParticipants(res.participants);
        }
        onShowToast(`✅ 구글 시트에서 ${res.participants.length}명의 최신 수령 현황을 불러왔습니다!`, 'success');
      } else {
        onShowToast('시트에 저장된 참가자 데이터가 없습니다. 먼저 전송을 진행해주세요.', 'info');
      }
    } catch (err: any) {
      onShowToast(`불러오기 실패: ${err.message}`, 'error');
    } finally {
      setIsFetching(false);
    }
  };

  const handleExportCsv = () => {
    try {
      exportToExcelCsv(config, participants);
      onShowToast('엑셀(.csv) 파일이 다운로드되었습니다!', 'success');
    } catch {
      onShowToast('파일 다운로드 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleCopyGasCode = async () => {
    try {
      await navigator.clipboard.writeText(DEFAULT_GAS_CODE);
      setCopiedCode(true);
      onShowToast('Google Apps Script 코드가 클립보드에 복사되었습니다!', 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      onShowToast('코드 복사에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">구글 시트 연동 & 다중 기기 동기화</h2>
              <p className="text-xs text-slate-500 font-medium">다른 폰이나 브라우저에서도 시트와 양방향으로 실시간 동기화</p>
            </div>
          </div>
          <button
            id="sheet-modal-close"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Quick Action: Instant Excel / CSV Export Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>엑셀(Excel / CSV) 즉시 다운로드</span>
              </div>
              <p className="text-xs text-emerald-900 font-medium mt-0.5 leading-relaxed">
                구글 연동 없이도 현재 수령 현황({participants.filter((p) => p.checked).length}/{participants.length}명)을 한글 깨짐 없는 엑셀 파일로 바로 저장합니다.
              </p>
            </div>
            <button
              id="export-csv-btn"
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>엑셀(.csv) 다운로드</span>
            </button>
          </div>

          {/* GAS Webhook URL Setting */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>Google Apps Script(GAS) Webhook URL</span>
              </label>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-bold cursor-pointer underline"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showGuide ? '가이드 닫기' : '1분 연동 가이드'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="gas-url-input"
                type="url"
                value={gasUrl}
                onChange={(e) => setGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
              <button
                id="save-gas-url-btn"
                onClick={handleSaveUrls}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 text-xs font-black shrink-0 cursor-pointer"
              >
                저장
              </button>
            </div>

            {/* Google Spreadsheet Direct Link */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">구글 스프레드시트 바로가기 링크 (선택):</label>
              <div className="flex items-center gap-2">
                <input
                  id="sheet-url-input"
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
                {sheetUrl && (
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0"
                    title="새 창에서 스프레드시트 열기"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Bidirectional Sync Buttons */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                id="sync-gas-btn"
                onClick={handleSyncToGas}
                disabled={isSyncing || isFetching}
                className="py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-lime-400 font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>시트로 전송 중...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-lime-400 shrink-0" />
                    <span>시트로 저장 ({participants.filter((p) => p.checked).length}명)</span>
                  </>
                )}
              </button>

              <button
                id="fetch-gas-btn"
                onClick={handleFetchFromGas}
                disabled={isSyncing || isFetching}
                className="py-3 px-3 rounded-2xl bg-white hover:bg-slate-100 border-2 border-emerald-600 text-emerald-800 font-black text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isFetching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                    <span>시트에서 가져오는 중...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>시트에서 최신현황 불러오기</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-[11px] text-slate-500 text-center font-medium">
              💡 다른 폰이나 컴퓨터에서 열었을 때 <strong>[시트에서 최신현황 불러오기]</strong>를 누르면 동일하게 동기화됩니다!
            </p>
          </div>

          {/* 1-Minute GAS Setup Guide (Collapsible or visible) */}
          {showGuide && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-lime-600" />
                  초간단 4단계 구글 시트 연동 방법
                </span>
                <button
                  id="copy-gas-code-btn"
                  onClick={handleCopyGasCode}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold cursor-pointer shadow-xs"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? '복사됨!' : '스크립트 코드 복사'}</span>
                </button>
              </div>

              <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside leading-relaxed font-medium">
                <li>구글 드라이브에서 <strong>새 스프레드시트</strong>를 만듭니다.</li>
                <li>상단 메뉴에서 <strong>[확장 프로그램] &gt; [Apps Script]</strong>를 클릭합니다.</li>
                <li>기존 내용을 지우고, 우측 상단 <strong>[스크립트 코드 복사]</strong> 버튼을 눌러 코드를 붙여넣습니다.</li>
                <li>
                  우측 상단 <strong>[배포] &gt; [새 배포]</strong> 클릭 후, 유형을 <strong>[웹 앱]</strong>으로 선택하고 액세스 권한을 <strong>[모든 사용자 (Anyone)]</strong>로 설정하여 배포합니다.
                </li>
                <li>생성된 <strong>웹 앱 URL</strong>을 위 입력칸에 붙여넣기하면 끝입니다!</li>
              </ol>

              {/* Code Snippet Box */}
              <div className="relative">
                <pre className="max-h-36 overflow-y-auto p-3 rounded-xl bg-slate-900 text-[11px] font-mono text-lime-300 leading-tight">
                  {DEFAULT_GAS_CODE}
                </pre>
              </div>
            </div>
          )}

          {/* Sync History Log */}
          {syncHistory.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>최근 전송 이력</span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 rounded-xl bg-slate-50 p-2 border border-slate-200">
                {syncHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200 shadow-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span className="text-slate-900 font-bold truncate">{item.eventTitle}</span>
                      <span className="text-slate-500 font-mono">
                        ({item.checkedCount}/{item.totalCount}명)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0 font-mono">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
