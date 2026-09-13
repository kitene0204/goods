import React, { useState } from 'react';
import { 
  CreditCard, 
  Megaphone, 
  ExternalLink, 
  ArrowLeft, 
  RotateCcw, 
  Info, 
  CheckCircle2, 
  Globe,
  Sparkles
} from 'lucide-react';
import { HANWOOLIM_EXTERNAL_LINKS, MainAppTab } from '../types';

interface EmbeddedFrameViewProps {
  type: 'fee' | 'notice';
  onBackToCheckin: () => void;
  onSelectTab: (tab: MainAppTab) => void;
}

export const EmbeddedFrameView: React.FC<EmbeddedFrameViewProps> = ({
  type,
  onBackToCheckin,
  onSelectTab,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const isFee = type === 'fee';
  const title = isFee ? '한울림 회비 & 등급 관리' : '월례대회 공지 알리미';
  const subtitle = isFee 
    ? 'Google Apps Script 기반 회비 입출금·납부 및 회원 등급 관리 장부' 
    : 'GitHub Pages 기반 한울림 정기 월례대회 공식 공지사항';
  const url = isFee 
    ? HANWOOLIM_EXTERNAL_LINKS.FEE_MANAGEMENT 
    : HANWOOLIM_EXTERNAL_LINKS.MONTHLY_NOTICE;
  const themeBg = isFee ? 'from-indigo-600 to-blue-700' : 'from-amber-500 to-orange-600';
  const textColor = isFee ? 'text-indigo-400' : 'text-amber-400';
  const badgeText = isFee ? 'Google Apps Script' : 'GitHub Pages';

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Title & Navigation */}
        <div className="flex items-start sm:items-center gap-3">
          <button
            id="frame-back-btn"
            onClick={onBackToCheckin}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            title="체크인 대시보드로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`p-1.5 rounded-lg bg-linear-to-r ${themeBg} text-white shadow-xs`}>
                {isFee ? <CreditCard className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {title}
              </h2>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isFee ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                {badgeText}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Tab Switcher & External Link Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Switch to other tab */}
          <button
            id="frame-switch-tab-btn"
            onClick={() => onSelectTab(isFee ? 'notice' : 'fee')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isFee ? <Megaphone className="w-3.5 h-3.5 text-amber-600" /> : <CreditCard className="w-3.5 h-3.5 text-indigo-600" />}
            <span>{isFee ? '공지 알리미로 전환' : '회비 & 등급 관리로 전환'}</span>
          </button>

          {/* Refresh iframe */}
          <button
            id="frame-refresh-btn"
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center cursor-pointer"
            title="페이지 새로고침"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* External Tab button (Prominent Primary) */}
          <a
            id="frame-external-open-btn"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              isFee 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20' 
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            <span>새 탭에서 크게 열기</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Security notice banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 sm:px-4 flex items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="leading-snug">
            구글 웹앱 및 외부 사이트의 브라우저 보안(iframe 차단) 정책으로 인앱 화면이 하얗게 보일 경우, 우측 상단의 <strong>[새 탭에서 크게 열기]</strong>를 누르시면 100% 정상 작동합니다.
          </span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 underline font-bold hover:text-amber-950"
        >
          직접 열기 ↗
        </a>
      </div>

      {/* Main Embed Frame Container */}
      <div className="relative w-full flex-1 min-h-[680px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-slate-50/90 flex flex-col items-center justify-center gap-3">
            <div className={`w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin`} />
            <p className="text-sm font-bold text-slate-600">
              {title} 페이지를 불러오는 중입니다...
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
              로딩이 오래 걸리나요? 새 탭으로 바로 열기
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <iframe
          key={refreshKey}
          src={url}
          title={title}
          className="w-full flex-1 min-h-[680px] border-0 bg-white"
          onLoad={() => setIsLoading(false)}
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
        />
      </div>
    </div>
  );
};
