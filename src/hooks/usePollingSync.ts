import { useState, useEffect, useRef, useCallback } from 'react';
import { Participant, EventConfig } from '../types';
import { fetchFromGoogleSheets, syncToGoogleSheets } from '../utils/gasSync';

interface UsePollingSyncOptions {
  config: EventConfig;
  participants: Participant[];
  onUpdateParticipants: (newParticipants: Participant[]) => void;
  onUpdateConfig?: (newConfig: Partial<EventConfig>) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  pollingIntervalMs?: number; // default: 5000 (5 seconds)
}

export interface SyncStatusState {
  isPollingActive: boolean;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: Date | null;
  lastSyncedAgoText: string;
  isPushing: boolean;
  error: string | null;
  syncCount: number;
}

export function usePollingSync({
  config,
  participants,
  onUpdateParticipants,
  onUpdateConfig,
  onShowToast,
  pollingIntervalMs = 5000,
}: UsePollingSyncOptions) {
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
  const [lastSyncedAgoText, setLastSyncedAgoText] = useState<string>('방금 전');
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [syncCount, setSyncCount] = useState<number>(0);

  // References to keep track of state without causing re-trigger loops
  const participantsRef = useRef<Participant[]>(participants);
  participantsRef.current = participants;

  const configRef = useRef<EventConfig>(config);
  configRef.current = config;

  const lastLocalMutationRef = useRef<number>(Date.now());
  const lastKnownServerVersionRef = useRef<number>(0);
  const isSyncInProgressRef = useRef<boolean>(false);
  const isPushPendingRef = useRef<boolean>(false);
  const debouncePushTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to calculate relative time string
  const updateRelativeTime = useCallback(() => {
    if (!lastSyncedAt) {
      setLastSyncedAgoText('기록 없음');
      return;
    }
    const elapsedSec = Math.floor((Date.now() - lastSyncedAt.getTime()) / 1000);
    if (elapsedSec < 5) {
      setLastSyncedAgoText('방금 전');
    } else if (elapsedSec < 60) {
      setLastSyncedAgoText(`${elapsedSec}초 전`);
    } else {
      const mins = Math.floor(elapsedSec / 60);
      setLastSyncedAgoText(`${mins}분 전`);
    }
  }, [lastSyncedAt]);

  // Update relative time display every second
  useEffect(() => {
    const timer = setInterval(updateRelativeTime, 1000);
    return () => clearInterval(timer);
  }, [updateRelativeTime]);

  // 1. PUSH local changes to Server & GAS
  const pushLocalChanges = useCallback(async () => {
    if (isSyncInProgressRef.current) {
      isPushPendingRef.current = true;
      return;
    }

    isSyncInProgressRef.current = true;
    setIsPushing(true);

    try {
      const currentConfig = configRef.current;
      const currentParticipants = participantsRef.current;

      // 1. Try local Express API first if available
      let backendSuccess = false;
      try {
        const res = await fetch('/api/participants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: currentConfig,
            participants: currentParticipants,
            clientVersion: lastKnownServerVersionRef.current,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.version) {
            lastKnownServerVersionRef.current = data.version;
          }
          backendSuccess = true;
        }
      } catch {
        // Local server might not be running or on static host
      }

      // 2. Also push to GAS if webhook URL exists and is valid
      if (currentConfig.gasWebhookUrl && currentConfig.gasWebhookUrl.startsWith('http')) {
        try {
          await syncToGoogleSheets(currentConfig.gasWebhookUrl, currentConfig, currentParticipants);
        } catch (e) {
          // non-fatal
        }
      }

      setStatus('synced');
      setLastSyncedAt(new Date());
      setError(null);
      setSyncCount((c) => c + 1);
    } catch (err: any) {
      console.warn('Push error:', err);
      setStatus('error');
      setError(err?.message || '동기화 중 오류');
    } finally {
      setIsPushing(false);
      isSyncInProgressRef.current = false;

      if (isPushPendingRef.current) {
        isPushPendingRef.current = false;
        // Schedule next push
        setTimeout(pushLocalChanges, 300);
      }
    }
  }, []);

  // Method to trigger an auto-push when local user modifies data
  const triggerLocalChangePush = useCallback(() => {
    lastLocalMutationRef.current = Date.now();
    setStatus('syncing');

    if (debouncePushTimerRef.current) {
      clearTimeout(debouncePushTimerRef.current);
    }

    debouncePushTimerRef.current = setTimeout(() => {
      pushLocalChanges();
    }, 600); // 600ms debounce for rapid clicking
  }, [pushLocalChanges]);

  // 2. POLL latest data from Server / GAS
  const pollLatestData = useCallback(async (isManualTrigger = false) => {
    // If a user just modified something locally in the last 1.5 seconds, wait for push to complete
    const timeSinceLastLocalEdit = Date.now() - lastLocalMutationRef.current;
    if (!isManualTrigger && timeSinceLastLocalEdit < 1500) {
      return;
    }

    if (isSyncInProgressRef.current) {
      return;
    }

    isSyncInProgressRef.current = true;
    if (isManualTrigger) {
      setStatus('syncing');
    }

    try {
      let fetchedParticipants: Participant[] | null = null;
      let fetchedConfig: EventConfig | null = null;
      let newServerVersion = 0;

      // 1. Try local Express backend API
      try {
        const response = await fetch('/api/participants', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (response.ok) {
          const json = await response.json();
          if (json.success && Array.isArray(json.participants)) {
            newServerVersion = json.version || 0;
            fetchedParticipants = json.participants;
            if (json.config) fetchedConfig = json.config;
          }
        }
      } catch {
        // Fallback to Google Apps Script
      }

      // 2. If no local Express or if running standalone Vercel, poll GAS directly
      if (!fetchedParticipants && configRef.current.gasWebhookUrl) {
        try {
          const gasRes = await fetchFromGoogleSheets(
            configRef.current.gasWebhookUrl,
            configRef.current.title
          );
          if (gasRes.success && gasRes.participants && gasRes.participants.length > 0) {
            fetchedParticipants = gasRes.participants;
          }
        } catch {
          // GAS not configured or network glitch
        }
      }

      // 3. Process remote data if found
      if (fetchedParticipants && fetchedParticipants.length > 0) {
        const currentList = participantsRef.current;

        // Check if there is any actual difference in checks or status
        const isDifferent = hasDataChanged(currentList, fetchedParticipants);

        if (isDifferent) {
          // Merge intelligently preserving local references if unchanged
          const merged = mergeParticipantLists(currentList, fetchedParticipants);
          onUpdateParticipants(merged);
          
          if (isManualTrigger && onShowToast) {
            onShowToast('✅ 최신 수령 현황이 동기화되었습니다!', 'success');
          }
        }

        if (newServerVersion > 0) {
          lastKnownServerVersionRef.current = newServerVersion;
        }

        setStatus('synced');
        setLastSyncedAt(new Date());
        setError(null);
        setSyncCount((c) => c + 1);
      } else {
        // Connected ok
        setStatus('synced');
        setLastSyncedAt(new Date());
      }
    } catch (err: any) {
      console.warn('Poll fetch error:', err);
      // Do not disturb the user if it's just a background poll glitch
      if (isManualTrigger) {
        setStatus('error');
        setError(err?.message || '동기화 실패');
        if (onShowToast) {
          onShowToast(`동기화 실패: ${err?.message}`, 'error');
        }
      }
    } finally {
      isSyncInProgressRef.current = false;
    }
  }, [onUpdateParticipants, onShowToast]);

  // Polling Interval Effect (every 5 seconds)
  useEffect(() => {
    if (!isPollingActive) return;

    // Initial poll after 1s
    const initialTimer = setTimeout(() => {
      pollLatestData(false);
    }, 1000);

    // 5-second interval loop
    const intervalTimer = setInterval(() => {
      pollLatestData(false);
    }, pollingIntervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [isPollingActive, pollingIntervalMs, pollLatestData]);

  return {
    isPollingActive,
    setIsPollingActive,
    status,
    lastSyncedAt,
    lastSyncedAgoText,
    isPushing,
    error,
    syncCount,
    triggerLocalChangePush,
    pollNow: () => pollLatestData(true),
    pushNow: () => pushLocalChanges(),
  };
}

/**
 * Checks if two participant lists have differences in checked state, timestamps, items, or notes
 */
function hasDataChanged(local: Participant[], remote: Participant[]): boolean {
  if (local.length !== remote.length) return true;

  const localMap = new Map(local.map((p) => [normalizeKey(p), p]));

  for (const r of remote) {
    const key = normalizeKey(r);
    const l = localMap.get(key);
    if (!l) return true; // new person

    if (l.checked !== r.checked) return true;
    if (l.checkedAt !== r.checkedAt) return true;
    if (l.proxyName !== r.proxyName) return true;
    if (l.isProxy !== r.isProxy) return true;
    if (l.notes !== r.notes) return true;
    if (l.raffleWinnerPrize !== r.raffleWinnerPrize) return true;

    // Check items
    const lItems = l.items || {};
    const rItems = r.items || {};
    const itemKeys = new Set([...Object.keys(lItems), ...Object.keys(rItems)]);
    for (const k of itemKeys) {
      if (!!lItems[k] !== !!rItems[k]) return true;
    }
  }

  return false;
}

/**
 * Normalizes participant key by ID or Name+Phone
 */
function normalizeKey(p: Participant): string {
  if (p.id && !p.id.startsWith('p-sheet-')) return p.id;
  return `${(p.name || '').trim()}_${(p.phone || '').replace(/[^0-9]/g, '')}_${(p.division || '').trim()}`;
}

/**
 * Merges remote participants into local list preserving stable IDs
 */
function mergeParticipantLists(local: Participant[], remote: Participant[]): Participant[] {
  const localMap = new Map<string, Participant>();
  local.forEach((p) => {
    localMap.set(p.id, p);
    localMap.set(normalizeKey(p), p);
  });

  return remote.map((r, index) => {
    const matched = localMap.get(r.id) || localMap.get(normalizeKey(r));
    if (matched) {
      return {
        ...matched,
        checked: r.checked,
        checkedAt: r.checkedAt || matched.checkedAt,
        isProxy: r.isProxy !== undefined ? r.isProxy : matched.isProxy,
        proxyName: r.proxyName !== undefined ? r.proxyName : matched.proxyName,
        raffleWinnerPrize: r.raffleWinnerPrize || matched.raffleWinnerPrize,
        notes: r.notes || matched.notes,
        division: r.division || matched.division,
        group: r.group || matched.group,
        items: { ...(matched.items || {}), ...(r.items || {}) },
      };
    }
    // New participant from remote
    return {
      ...r,
      id: r.id || `p-synced-${index + 1}-${Date.now()}`,
    };
  });
}
