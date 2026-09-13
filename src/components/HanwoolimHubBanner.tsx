import React from 'react';
import { CreditCard, Megaphone, ExternalLink, ArrowRight, Cake, FileSpreadsheet } from 'lucide-react';
import { HANWOOLIM_EXTERNAL_LINKS, MainAppTab, EventConfig } from '../types';

interface HanwoolimHubBannerProps {
  activeTab: MainAppTab;
  onSelectTab: (tab: MainAppTab) => void;
  onOpenAgeModal?: () => void;
  config?: EventConfig;
  onOpenGoogleSheetModal?: () => void;
}

export const HanwoolimHubBanner: React.FC<HanwoolimHubBannerProps> = ({
  activeTab,
  onSelectTab,
  onOpenAgeModal,
  config,
  onOpenGoogleSheetModal,
}) => {
  return (
    <section 
      aria-label="한울림 자주 찾는 메뉴"
      className="w-full bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-lg border border-slate-700/80 relative overflow-hidden"
    >
      {/* Subtle Background Glow Accents */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3.5 border-b border-slate-750/90 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-lime-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
            ⭐
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1.5 text-white">
              한울림 필수 메뉴 & 클럽 허브
              <span className="text-[10px] uppercase font-extrabold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                QUICK ACCESS
              </span>
            </h2>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 hidden sm:block">
          클럽 필수 4대 도구: 회비 & 등급, 공지, 회원 연령, 회계 결산 구글 시트 바로가기
        </div>
      </div>

      {/* Four Prominent Quick Hub Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 relative z-10">
        {/* 1. 회비 & 등급 관리 카드 */}
        <div className="group bg-slate-800/80 hover:bg-slate-800 border-2 border-indigo-500/40 hover:border-indigo-400 rounded-2xl p-3 sm:p-3.5 transition-all duration-200 shadow-md hover:shadow-indigo-500/10 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <h3 className="text-sm font-black text-white group-hover:text-indigo-200 transition-colors whitespace-nowrap">
                      회비 & 등급 관리
                    </h3>
                    <span className="text-[9px] font-black bg-indigo-500 text-white px-1.5 py-0.2 rounded-md whitespace-nowrap shrink-0">
                      GAS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                    회비 현황·입출금 장부 & 등급
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-700/60 mt-2">
            <button
              id="hub-btn-fee-tab"
              onClick={() => onSelectTab('fee')}
              className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span className="whitespace-nowrap">회비 & 등급 탭</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
            <a
              id="hub-link-fee-external"
              href={HANWOOLIM_EXTERNAL_LINKS.FEE_MANAGEMENT}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2 rounded-xl bg-slate-700/90 hover:bg-slate-650 text-slate-200 hover:text-white border border-slate-600 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
              title="새 탭으로 크게 열기"
            >
              <span className="whitespace-nowrap">새 탭</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        </div>

        {/* 2. 월례대회 공지 알리미 카드 */}
        <div className="group bg-slate-800/80 hover:bg-slate-800 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl p-3 sm:p-3.5 transition-all duration-200 shadow-md hover:shadow-amber-500/10 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <h3 className="text-sm font-black text-white group-hover:text-amber-200 transition-colors whitespace-nowrap">
                      공지 알리미
                    </h3>
                    <span className="text-[9px] font-black bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-md whitespace-nowrap shrink-0">
                      공지
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                    일정, 조 편성 및 필독 공지
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-700/60 mt-2">
            <button
              id="hub-btn-notice-tab"
              onClick={() => onSelectTab('notice')}
              className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span className="whitespace-nowrap">공지 탭</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
            <a
              id="hub-link-notice-external"
              href={HANWOOLIM_EXTERNAL_LINKS.MONTHLY_NOTICE}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2 rounded-xl bg-slate-700/90 hover:bg-slate-650 text-slate-200 hover:text-white border border-slate-600 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
              title="새 탭으로 크게 열기"
            >
              <span className="whitespace-nowrap">새 탭</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        </div>

        {/* 3. 회원 연령 & 출생연도 카드 */}
        <div className="group bg-slate-800/80 hover:bg-slate-800 border-2 border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-3 sm:p-3.5 transition-all duration-200 shadow-md hover:shadow-emerald-500/10 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Cake className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <h3 className="text-sm font-black text-white group-hover:text-emerald-200 transition-colors whitespace-nowrap">
                      회원 연령 현황
                    </h3>
                    <span className="text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.2 rounded-md whitespace-nowrap shrink-0">
                      58명
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                    연도별 명단 & 나이 조견표
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-700/60 mt-2">
            <button
              id="hub-btn-age-tab"
              onClick={() => onSelectTab('age')}
              className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span className="whitespace-nowrap">연령 탭</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
            {onOpenAgeModal && (
              <button
                id="hub-btn-age-modal"
                onClick={onOpenAgeModal}
                className="py-1.5 px-2 rounded-xl bg-slate-700/90 hover:bg-slate-650 text-slate-200 hover:text-white border border-slate-600 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                title="팝업창으로 바로 검색하기"
              >
                <span className="whitespace-nowrap">팝업</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. ⭐ 한울림 정보 & 2025 결산 구글 시트 (NEW!) */}
        <div className="group bg-slate-800/80 hover:bg-slate-800 border-2 border-teal-500/50 hover:border-teal-400 rounded-2xl p-3 sm:p-3.5 transition-all duration-200 shadow-md hover:shadow-teal-500/10 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <h3 className="text-sm font-black text-white group-hover:text-teal-200 transition-colors whitespace-nowrap">
                      한울림 구글 시트
                    </h3>
                    <span className="text-[9px] font-black bg-teal-400 text-slate-950 px-1.5 py-0.2 rounded-md whitespace-nowrap shrink-0">
                      2025 결산
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                    이월금 1,045만 원 & 회계 시트
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-700/60 mt-2">
            <button
              id="hub-btn-sheet-tab"
              onClick={() => onSelectTab('sheet')}
              className="flex-1 py-1.5 px-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span className="whitespace-nowrap">시트 탭</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
            {config?.googleSheetUrl ? (
              <a
                id="hub-link-sheet-external"
                href={config.googleSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2 rounded-xl bg-slate-700/90 hover:bg-slate-650 text-slate-200 hover:text-white border border-slate-600 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                title="새 탭으로 구글 시트 열기"
              >
                <span className="whitespace-nowrap">새 탭</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            ) : onOpenGoogleSheetModal ? (
              <button
                id="hub-btn-sheet-modal"
                onClick={onOpenGoogleSheetModal}
                className="py-1.5 px-2 rounded-xl bg-slate-700/90 hover:bg-slate-650 text-slate-200 hover:text-white border border-slate-600 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                title="구글 시트 연동 설정"
              >
                <span className="whitespace-nowrap">설정</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
