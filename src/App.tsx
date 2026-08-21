import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Participant, 
  EventConfig, 
  ClubMember, 
  SyncHistoryEntry, 
  FilterTab 
} from './types';
import { 
  loadEventConfig, 
  saveEventConfig, 
  loadParticipants, 
  saveParticipants, 
  loadClubMembers, 
  saveClubMembers, 
  loadSyncHistory, 
  saveSyncHistory,
  INITIAL_PARTICIPANTS
} from './utils/storage';
import { matchesChosungOrText } from './utils/chosung';
import { usePollingSync } from './hooks/usePollingSync';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { SearchBar } from './components/SearchBar';
import { ParticipantCard } from './components/ParticipantCard';
import { RosterModal } from './components/RosterModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { LuckyDrawModal } from './components/LuckyDrawModal';
import { EventSettingsModal } from './components/EventSettingsModal';
import { SupabaseModal } from './components/SupabaseModal';
import { Toast, ToastMessage } from './components/Toast';
import confetti from 'canvas-confetti';
import {
  fetchParticipantsFromSupabase,
  upsertParticipantToSupabase,
  bulkUpsertParticipantsToSupabase,
  subscribeToSupabaseRealtime,
} from './utils/supabaseClient';
import { 
  UserPlus, 
  RotateCcw, 
  Clipboard, 
  FileSpreadsheet, 
  CheckCircle2, 
  Sparkles,
  Trophy,
  ArrowUp,
  RefreshCw,
  Zap,
  Radio
} from 'lucide-react';

export default function App() {
  // 1. Persistent States
  const [config, setConfig] = useState<EventConfig>(() => loadEventConfig());
  const [participants, setParticipants] = useState<Participant[]>(() => loadParticipants());
  const [clubMembers, setClubMembers] = useState<ClubMember[]>(() => loadClubMembers());
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>(() => loadSyncHistory());
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(true);

  // 2. View & Filter States
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'default' | 'name' | 'checked'>('name');

  // 3. Modal States
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isGoogleSheetOpen, setIsGoogleSheetOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [isLuckyDrawOpen, setIsLuckyDrawOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 4. Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text,
      type,
    };
    setToasts((prev) => [...prev.slice(-3), newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3200);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 5. Real-Time 5-Second Polling & Background Sync Engine
  const {
    isPollingActive,
    status: syncStatus,
    lastSyncedAgoText,
    triggerLocalChangePush,
    pollNow,
    pushNow,
  } = usePollingSync({
    config,
    participants,
    onUpdateParticipants: (newList) => {
      setParticipants(newList);
    },
    onShowToast: showToast,
    pollingIntervalMs: 5000,
  });

  // Supabase Real-time Cloud DB Synchronization & Subscription
  useEffect(() => {
    // 1. Initial Load: Fetch latest remote participants from Supabase if available
    fetchParticipantsFromSupabase().then((remoteData) => {
      if (remoteData && remoteData.length > 0) {
        setParticipants(remoteData);
        setIsSupabaseConnected(true);
      } else {
        // Table is empty, seed with initial list
        const currentList = loadParticipants();
        if (currentList.length > 0) {
          bulkUpsertParticipantsToSupabase(currentList).then((ok) => {
            if (ok) setIsSupabaseConnected(true);
          });
        }
      }
    });

    // 2. Realtime WebSocket subscription: Listen for any changes made on any phone/PC
    const { unsubscribe } = subscribeToSupabaseRealtime((updatedRemotePart) => {
      setParticipants((prev) => {
        const exists = prev.some((p) => p.id === updatedRemotePart.id);
        if (exists) {
          return prev.map((p) => (p.id === updatedRemotePart.id ? updatedRemotePart : p));
        } else {
          return [updatedRemotePart, ...prev];
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Save to LocalStorage on changes
  useEffect(() => {
    saveEventConfig(config);
  }, [config]);

  useEffect(() => {
    saveParticipants(participants);
  }, [participants]);

  useEffect(() => {
    saveClubMembers(clubMembers);
  }, [clubMembers]);

  useEffect(() => {
    saveSyncHistory(syncHistory);
  }, [syncHistory]);

  // Distinct divisions from current participants
  const divisions = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => {
      if (p.division) set.add(p.division);
    });
    return Array.from(set);
  }, [participants]);

  // Filtered & Sorted participants list
  const filteredParticipants = useMemo(() => {
    const list = participants.filter((p) => {
      // 1. Status Filter
      if (activeFilter === 'checked' && !p.checked) return false;
      if (activeFilter === 'unchecked' && p.checked) return false;

      // 2. Division Filter
      if (selectedDivision !== 'all' && p.division !== selectedDivision) return false;

      // 3. Search Term with Korean Chosung matching
      if (searchTerm.trim()) {
        const matchesName = matchesChosungOrText(p.name, searchTerm);
        const matchesPhone = p.phone ? p.phone.replace(/[^0-9]/g, '').includes(searchTerm.replace(/[^0-9]/g, '')) : false;
        const matchesGroup = p.group ? matchesChosungOrText(p.group, searchTerm) : false;
        const matchesProxy = p.proxyName ? matchesChosungOrText(p.proxyName, searchTerm) : false;
        if (!matchesName && !matchesPhone && !matchesGroup && !matchesProxy) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting - 항상 가나다 오름차순(ㄱ->ㅎ) 기본 적용
    if (sortOrder === 'checked') {
      // Unchecked first, within status groups sorted alphabetically ascending
      return [...list].sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return (a.name || '').localeCompare(b.name || '', 'ko');
      });
    }

    // Default & 'name': 항상 이름 가나다 오름차순 (ㄱ->ㅎ)
    return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
  }, [participants, activeFilter, selectedDivision, searchTerm, sortOrder]);

  // Handlers for Participant Actions with automatic cloud broadcast
  const handleToggleCheck = (id: string) => {
    let targetParticipant: Participant | null = null;

    setParticipants((prev) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      let justFinishedAll = false;

      const updated = prev.map((p) => {
        if (p.id === id) {
          const nextChecked = !p.checked;
          const modified: Participant = {
            ...p,
            checked: nextChecked,
            checkedAt: nextChecked ? timeStr : null,
          };
          targetParticipant = modified;
          return modified;
        }
        return p;
      });

      const total = updated.length;
      const checkedCount = updated.filter((p) => p.checked).length;
      if (checkedCount === total && total > 0) {
        justFinishedAll = true;
      }

      if (justFinishedAll) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
        showToast('🎉 축하합니다! 모든 참가자의 수령 체크가 완료되었습니다!', 'success');
      }

      return updated;
    });

    // Instant Real-time Push to Supabase (0.1s to all devices)
    if (targetParticipant) {
      upsertParticipantToSupabase(targetParticipant);
    }

    // Auto push to server & GAS in background
    triggerLocalChangePush();
  };

  const handleToggleItem = (participantId: string, itemId: string) => {
    let targetParticipant: Participant | null = null;

    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === participantId) {
          const nextItems = { ...(p.items || {}) };
          nextItems[itemId] = !nextItems[itemId];
          const modified: Participant = {
            ...p,
            items: nextItems,
          };
          targetParticipant = modified;
          return modified;
        }
        return p;
      })
    );

    if (targetParticipant) {
      upsertParticipantToSupabase(targetParticipant);
    }
    triggerLocalChangePush();
  };

  const handleUpdateParticipant = (id: string, updates: Partial<Participant>) => {
    let targetParticipant: Participant | null = null;

    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const mod = { ...p, ...updates };
          targetParticipant = mod;
          return mod;
        }
        return p;
      })
    );

    if (targetParticipant) {
      upsertParticipantToSupabase(targetParticipant);
    }
    showToast('참가자 정보가 업데이트되었습니다.', 'success');
    triggerLocalChangePush();
  };

  const handleDeleteParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    showToast('참가자가 명단에서 삭제되었습니다.', 'info');
    triggerLocalChangePush();
  };

  const handleMarkAllChecked = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const nextList = participants.map((p) => ({
      ...p,
      checked: true,
      checkedAt: p.checkedAt || timeStr,
    }));
    setParticipants(nextList);
    bulkUpsertParticipantsToSupabase(nextList);
    showToast('전원 수령 완료 처리되었습니다.', 'success');
    triggerLocalChangePush();
  };

  const handleResetAllChecked = () => {
    const nextList = participants.map((p) => ({
      ...p,
      checked: false,
      checkedAt: null,
    }));
    setParticipants(nextList);
    bulkUpsertParticipantsToSupabase(nextList);
    showToast('수령 기록이 초기화되었습니다.', 'info');
    triggerLocalChangePush();
  };

  const handleAddParticipant = (newP: Participant) => {
    setParticipants((prev) => [newP, ...prev]);
    upsertParticipantToSupabase(newP);
    triggerLocalChangePush();
  };

  const handleRecordWinner = (participantId: string, prizeName: string) => {
    let targetParticipant: Participant | null = null;
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === participantId) {
          const mod = { ...p, raffleWinnerPrize: prizeName };
          targetParticipant = mod;
          return mod;
        }
        return p;
      })
    );
    if (targetParticipant) {
      upsertParticipantToSupabase(targetParticipant);
    }
    triggerLocalChangePush();
  };

  const handleToggleTheme = () => {
    setConfig((prev) => ({
      ...prev,
      theme: prev.theme === 'night-court' ? 'outdoor-court' : 'night-court',
    }));
  };

  const handleCycleFontSize = () => {
    setConfig((prev) => {
      const nextSize = prev.fontSize === 'normal' ? 'large' : prev.fontSize === 'large' ? 'xlarge' : 'normal';
      return { ...prev, fontSize: nextSize };
    });
  };

  const isNightTheme = config.theme === 'night-court';
  const total = participants.length;
  const checkedCount = participants.filter((p) => p.checked).length;
  const uncheckCount = total - checkedCount;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans antialiased selection:bg-lime-400 selection:text-slate-900">
      {/* 1. Top Global Navigation Header */}
      <Header
        config={config}
        participants={participants}
        syncStatus={syncStatus}
        lastSyncedAgo={lastSyncedAgoText}
        isPollingActive={isPollingActive}
        isSupabaseConnected={isSupabaseConnected}
        onPollNow={pollNow}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRoster={() => setIsRosterOpen(true)}
        onOpenGoogleSheet={() => setIsGoogleSheetOpen(true)}
        onOpenSupabase={() => setIsSupabaseOpen(true)}
        onOpenLuckyDraw={() => setIsLuckyDrawOpen(true)}
        onToggleTheme={handleToggleTheme}
        onCycleFontSize={handleCycleFontSize}
      />

      {/* 2. Main Content Body */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Left Manager Control Panel Sidebar (Visible on Desktop / Tablet) */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 p-5 flex-col justify-between shrink-0">
          <div className="space-y-5">
            {/* Event Info Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">대회 정보</span>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  수정
                </button>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 line-clamp-2 leading-snug">
                {config.title}
              </h3>
              <div className="text-xs text-slate-700 space-y-0.5 pt-1 border-t border-slate-200/60">
                <p>📍 {config.location || '클럽 전용 코트'}</p>
                <p>📅 {config.date || '오늘'}</p>
                <p>🎁 기본 수령품: <span className="font-semibold text-slate-900">{config.items?.[0]?.name || '대회 참가상품'}</span></p>
              </div>
            </div>

            {/* 5-Second Real-Time Auto-Polling Status Card */}
            <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-400"></span>
                  </span>
                  <span className="text-xs font-black text-lime-300">5초 자동 동기화 활성</span>
                </div>
                <button
                  onClick={pollNow}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-lime-400 transition-colors cursor-pointer"
                  title="지금 즉시 동기화"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-lime-400' : ''}`} />
                </button>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>동기화 상태:</span>
                  <span className="font-bold text-slate-200">
                    {syncStatus === 'syncing' ? '동기화 중...' : syncStatus === 'error' ? '오프라인 보관' : '최신 유지 중'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>마지막 동기화:</span>
                  <span className="font-mono text-lime-400 font-bold">{lastSyncedAgoText}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                A 사용자가 체크하면 B 사용자의 화면도 <strong>5초마다 자동으로 갱신</strong>됩니다.
              </p>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={pollNow}
                  className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3 text-lime-400" />
                  <span>즉시 새로고침</span>
                </button>
                <button
                  onClick={pushNow}
                  className="py-1.5 px-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Zap className="w-3 h-3 text-slate-950" />
                  <span>시트 즉시저장</span>
                </button>
              </div>
            </div>

            {/* Quick Manager Actions */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-600 px-1">
                빠른 대회 운영 도구
              </div>
              <button
                id="sidebar-roster-btn"
                onClick={() => setIsRosterOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Clipboard className="w-4 h-4 text-blue-500" />
                  <span>카톡 명단 붙여넣기</span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                  {total}명
                </span>
              </button>

              <button
                id="sidebar-supabase-btn"
                onClick={() => setIsSupabaseOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 text-xs font-bold transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span>실시간 클라우드 DB 연동</span>
                </div>
                <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-bold">
                  0.1초
                </span>
              </button>

              <button
                id="sidebar-sheets-btn"
                onClick={() => setIsGoogleSheetOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>구글 시트 연동 설정</span>
                </div>
              </button>

              <button
                id="sidebar-luckydraw-btn"
                onClick={() => setIsLuckyDrawOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>행운권 럭키드로우 추첨기</span>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                  LIVE
                </span>
              </button>

              <button
                id="sidebar-settings-btn"
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>대회 정보 및 세부 설정</span>
                </div>
              </button>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="text-[11px] text-slate-600 pt-4 border-t border-slate-100 font-medium">
            테니스 클럽 월례대회 매니저 PRO
          </div>
        </aside>

        {/* Main Center Area */}
        <main className="flex-1 p-4 sm:p-6 flex flex-col space-y-4 pb-28 min-h-[calc(100vh-68px)]">
          {/* Real-time Progress & Counting Stats Bar */}
          <StatsBar
            participants={participants}
            config={config}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onMarkAllChecked={handleMarkAllChecked}
            onResetAllChecked={handleResetAllChecked}
            onShowToast={showToast}
          />

          {/* Chosung Search, Sort & View Mode Bar */}
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedDivision={selectedDivision}
            onDivisionChange={setSelectedDivision}
            divisions={divisions}
            totalMatches={filteredParticipants.length}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />

          {/* Participant Cards Stream */}
          <div className="flex-1">
            {participants.length === 0 ? (
              /* Empty state when no participants loaded */
              <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 my-4">
                <div className="w-16 h-16 rounded-3xl bg-lime-100 text-slate-900 flex items-center justify-center mx-auto text-3xl shadow-sm">
                  🎾
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">등록된 대회 참가자가 없습니다</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    카카오톡 투표 명단을 복사해 붙여넣거나, 샘플 명단으로 테스트해보세요.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                  <button
                    id="empty-paste-btn"
                    onClick={() => setIsRosterOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Clipboard className="w-4 h-4" />
                    <span>카톡 명단 붙여넣기</span>
                  </button>
                  <button
                    id="empty-load-sample-btn"
                    onClick={() => {
                      setParticipants(INITIAL_PARTICIPANTS);
                      showToast('샘플 참가자 16명 명단을 불러왔습니다.', 'success');
                      triggerLocalChangePush();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-300 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>샘플 16명 불러오기</span>
                  </button>
                </div>
              </div>
            ) : filteredParticipants.length === 0 ? (
              /* No match in current filter/search */
              <div className="text-center py-14 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3 my-4">
                <div className="text-3xl">🔍</div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900">검색 및 필터 조건에 일치하는 참가자가 없습니다</h4>
                  <p className="text-xs text-slate-500">초성 검색어나 선택된 부수 필터를 확인해보세요.</p>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDivision('all');
                    setActiveFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 text-xs font-bold cursor-pointer shadow-sm"
                >
                  모든 필터 초기화
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* High-Contrast Grid Card View */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredParticipants.map((participant, idx) => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    config={config}
                    index={idx}
                    viewMode="grid"
                    onToggleCheck={handleToggleCheck}
                    onToggleItem={handleToggleItem}
                    onUpdateParticipant={handleUpdateParticipant}
                    onDeleteParticipant={handleDeleteParticipant}
                  />
                ))}
              </div>
            ) : (
              /* Detailed List View */
              <div className="space-y-2.5">
                {filteredParticipants.map((participant, idx) => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    config={config}
                    index={idx}
                    viewMode="list"
                    onToggleCheck={handleToggleCheck}
                    onToggleItem={handleToggleItem}
                    onUpdateParticipant={handleUpdateParticipant}
                    onDeleteParticipant={handleDeleteParticipant}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 3. Mobile Bottom Quick Floating Bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 lg:hidden shadow-xl">
        <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
          <div className="flex items-center gap-1.5 text-xs pl-1">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
            </span>
            <span className="font-mono font-black text-slate-900 text-sm">
              {checkedCount}/{total}
            </span>
            <button
              onClick={pollNow}
              className="text-[10px] text-slate-500 hover:text-slate-900 flex items-center gap-0.5 font-medium ml-1"
              title="5초마다 자동 동기화됩니다"
            >
              <span>5초동기화</span>
              <RefreshCw className={`w-2.5 h-2.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsRosterOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Clipboard className="w-3.5 h-3.5 text-blue-600" />
              <span>명단</span>
            </button>
            <button
              onClick={() => setIsGoogleSheetOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 text-xs font-black flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-lime-400" />
              <span>시트연동</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Modals */}
      <RosterModal
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
        participants={participants}
        clubMembers={clubMembers}
        onSetParticipants={(newP) => {
          setParticipants(newP);
          triggerLocalChangePush();
        }}
        onAddParticipant={handleAddParticipant}
        onUpdateClubMembers={setClubMembers}
        onShowToast={showToast}
      />

      <GoogleSheetModal
        isOpen={isGoogleSheetOpen}
        onClose={() => setIsGoogleSheetOpen(false)}
        config={config}
        participants={participants}
        syncHistory={syncHistory}
        onUpdateConfig={(updates) => {
          setConfig((prev) => ({ ...prev, ...updates }));
          triggerLocalChangePush();
        }}
        onAddSyncHistory={(entry) => setSyncHistory((prev) => [entry, ...prev])}
        onImportParticipants={(newP) => {
          setParticipants(newP);
          triggerLocalChangePush();
        }}
        onShowToast={showToast}
      />

      <LuckyDrawModal
        isOpen={isLuckyDrawOpen}
        onClose={() => setIsLuckyDrawOpen(false)}
        participants={participants}
        config={config}
        onRecordWinner={handleRecordWinner}
        onShowToast={showToast}
      />

      <SupabaseModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        participants={participants}
        onUpdateParticipants={(newP) => {
          setParticipants(newP);
          triggerLocalChangePush();
        }}
        onShowToast={showToast}
        isConnected={isSupabaseConnected}
      />

      <EventSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={(newC) => {
          setConfig(newC);
          triggerLocalChangePush();
        }}
        onShowToast={showToast}
      />

      {/* 5. Feedback Toast System */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

