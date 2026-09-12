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
  Link2
} from 'lucide-react';
import { EventConfig, MainAppTab } from '../types';

interface HanwoolimSheetViewProps {
  config: EventConfig;
  onUpdateConfig: (updates: Partial<EventConfig>) => void;
  onBackToCheckin: () => void;
  onSelectTab: (tab: MainAppTab) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const HanwoolimSheetView: React.FC<HanwoolimSheetViewProps> = ({
  config,
  onUpdateConfig,
  onBackToCheckin,
  onSelectTab,
  onShowToast,
}) => {
  const [sheetUrlInput, setSheetUrlInput] = useState(config.googleSheetUrl || '');
  const [isEditingUrl, setIsEditingUrl] = useState(!config.googleSheetUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
                한울림 정보 & 2025 회계 결산 구글 시트
              </h2>
              <span className="text-xs font-black bg-emerald-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-2xs">
                공식 시트
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              한울림 테니스클럽 회계 결산, 예산 현황 및 주요 내역이 기록된 구글 스프레드시트 바로가기입니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {config.googleSheetUrl ? (
            <a
              id="sheet-open-external-btn"
              href={config.googleSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>구글 시트 새 탭으로 열기</span>
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
    </main>
  );
};
