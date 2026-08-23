import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Participant } from '../types';

export const DEFAULT_SUPABASE_URL = 'https://ofmfkingnhykhwoopnfr.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_Pj1WLAlRJdsobbMZ1pdR6g_Var70TvX';

const STORAGE_KEYS = {
  URL: 'tennis_supabase_url_v1',
  KEY: 'tennis_supabase_key_v1',
  ENABLED: 'tennis_supabase_enabled_v1',
};

export function getSupabaseCredentials(): { url: string; key: string; isCustom: boolean } {
  const localUrl = localStorage.getItem(STORAGE_KEYS.URL);
  const localKey = localStorage.getItem(STORAGE_KEYS.KEY);

  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  const url = localUrl?.trim() || envUrl?.trim() || DEFAULT_SUPABASE_URL;
  const key = localKey?.trim() || envKey?.trim() || DEFAULT_SUPABASE_ANON_KEY;

  return {
    url,
    key,
    isCustom: !!localUrl || !!localKey,
  };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (url.trim()) {
    localStorage.setItem(STORAGE_KEYS.URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.URL);
  }
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEYS.KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.KEY);
  }
  // Reset cached client
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return null;

  if (!cachedClient) {
    try {
      cachedClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (e) {
      console.error('Failed to init Supabase client:', e);
      return null;
    }
  }
  return cachedClient;
}

// Convert Participant to Supabase row format
export function participantToDbRow(p: Participant) {
  return {
    id: p.id,
    name: p.name,
    division: p.division || '일반',
    phone: p.phone || '',
    group: p.group || '',
    checked: !!p.checked,
    checked_at: p.checkedAt || null,
    is_proxy: !!p.isProxy,
    proxy_name: p.proxyName || '',
    notes: p.notes || '',
    items: p.items || {},
    raffle_winner_prize: p.raffleWinnerPrize || '',
    updated_at: new Date().toISOString(),
  };
}

// Convert Supabase row to Participant
export function dbRowToParticipant(row: any): Participant {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    division: row.division || '일반',
    phone: row.phone || '',
    group: row.group || '',
    checked: Boolean(row.checked),
    checkedAt: row.checked_at || null,
    isProxy: Boolean(row.is_proxy),
    proxyName: row.proxy_name || '',
    notes: row.notes || '',
    items: typeof row.items === 'object' && row.items !== null ? row.items : {},
    raffleWinnerPrize: row.raffle_winner_prize || '',
  };
}

// Fetch all participants from Supabase
export async function fetchParticipantsFromSupabase(): Promise<Participant[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('participants')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase fetch error:', error);
      return null;
    }

    if (data && Array.isArray(data)) {
      return data.map(dbRowToParticipant);
    }
    return [];
  } catch (err) {
    console.error('Supabase query error:', err);
    return null;
  }
}

// Save/Upsert a single participant
export async function upsertParticipantToSupabase(p: Participant): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = participantToDbRow(p);
    const { error } = await client
      .from('participants')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsert error for participant:', p.name, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase upsert error:', err);
    return false;
  }
}

// Bulk upsert all participants (e.g. initial upload or reset)
export async function bulkUpsertParticipantsToSupabase(list: Participant[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || list.length === 0) return false;

  try {
    const rows = list.map(participantToDbRow);
    const { error } = await client
      .from('participants')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase bulk upsert error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase bulk upsert error:', err);
    return false;
  }
}

// Completely replaces all participants in Supabase with the new list
export async function replaceParticipantsInSupabase(list: Participant[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Delete rows in participants table
    const { error: delError } = await client
      .from('participants')
      .delete()
      .neq('id', '___PLACEHOLDER_NEVER_MATCH___');

    if (delError) {
      console.warn('Supabase delete during replace notice:', delError);
    }

    // 2. Insert the fresh participant rows
    if (list.length > 0) {
      const rows = list.map(participantToDbRow);
      // Batch in chunks of 50 to ensure high reliability
      for (let i = 0; i < rows.length; i += 50) {
        const chunk = rows.slice(i, i + 50);
        const { error: insError } = await client
          .from('participants')
          .upsert(chunk, { onConflict: 'id' });

        if (insError) {
          console.warn('Supabase chunk insert notice:', insError);
        }
      }
    }
    return true;
  } catch (err) {
    console.error('Supabase replace error:', err);
    return false;
  }
}

// Delete a single participant from Supabase
export async function deleteParticipantFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !id) return false;

  try {
    const { error } = await client.from('participants').delete().eq('id', id);
    if (error) {
      console.warn('Supabase single delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase single delete error:', err);
    return false;
  }
}

// Subscribe to real-time changes
export function subscribeToSupabaseRealtime(
  onParticipantChange: (p: Participant) => void,
  onStatusChange?: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void
) {
  const client = getSupabaseClient();
  if (!client) return { unsubscribe: () => {} };

  try {
    const channel = client
      .channel('public:participants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
        },
        (payload) => {
          if (payload.new && (payload.new as any).id) {
            const updated = dbRowToParticipant(payload.new);
            onParticipantChange(updated);
          }
        }
      )
      .subscribe((status) => {
        if (onStatusChange) {
          onStatusChange(status as any);
        }
      });

    return {
      unsubscribe: () => {
        client.removeChannel(channel);
      },
    };
  } catch (err) {
    console.error('Failed to subscribe to Supabase realtime:', err);
    return { unsubscribe: () => {} };
  }
}
