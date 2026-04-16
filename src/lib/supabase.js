// ============================================
// Supabase Client + Admin Storage
// ============================================
import { createClient } from '@supabase/supabase-js';

let supabase = null;
let isReady = false;

export function initSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (url && key && url !== 'your-project-url' && key !== 'your-anon-key') {
    try {
      supabase = createClient(url, key);
      isReady = true;
      console.log('[Supabase] Connected');
    } catch (e) {
      console.warn('[Supabase] Init failed, using offline mode');
      isReady = false;
    }
  } else {
    console.log('[Supabase] No credentials — offline mode');
    isReady = false;
  }
}

export function isSupabaseReady() {
  return isReady;
}

export function getSupabase() {
  return supabase;
}

// ── Single Elimination RPC ──

// Execute draw via RPC
export async function executeDraw(participants, format) {
  if (!isReady || !supabase) return null;

  try {
    const { data, error } = await supabase.rpc('execute_draw', {
      participant_list: JSON.stringify(participants),
      bracket_format: format
    });
    if (error) throw error;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.warn('[Supabase] RPC failed:', e.message);
    return null;
  }
}

// ── Round Robin RPC ──

// Check if round robin draw should be rigged
export async function checkRoundRobinRigSupabase() {
  if (!isReady || !supabase) return null;

  try {
    const { data, error } = await supabase.rpc('check_round_robin_rig');
    if (error) throw error;
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.warn('[Supabase] Round Robin RPC failed:', e.message);
    return null;
  }
}

// Get round robin config
export async function adminGetRoundRobin() {
  if (!isReady || !supabase) return null;
  try {
    const { data, error } = await supabase.rpc('admin_get_round_robin');
    if (error) throw error;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.warn('[Admin] Get round robin failed:', e.message);
    return null;
  }
}

// Set round robin rig via Supabase
export async function adminSetRoundRobin(group1, group2, trigger) {
  if (!isReady || !supabase) return false;
  try {
    const { error } = await supabase.rpc('admin_set_round_robin', {
      p_group1: JSON.stringify(group1),
      p_group2: JSON.stringify(group2),
      p_trigger: trigger
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Admin] Set round robin failed:', e.message);
    return false;
  }
}

// Clear round robin rig
export async function adminClearRoundRobin() {
  if (!isReady || !supabase) return false;
  try {
    const { error } = await supabase.rpc('admin_clear_round_robin');
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Admin] Clear round robin failed:', e.message);
    return false;
  }
}

// ── Spinner RPC ──

// Check if spinner should be rigged
export async function checkSpinnerRigSupabase() {
  if (!isReady || !supabase) return null;

  try {
    const { data, error } = await supabase.rpc('check_spinner_rig');
    if (error) throw error;
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.warn('[Supabase] Spinner RPC failed:', e.message);
    return null;
  }
}

// ── Admin Functions ──

export async function adminGetState() {
  if (!isReady || !supabase) return null;
  try {
    const { data, error } = await supabase.rpc('admin_get_state');
    if (error) throw error;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.warn('[Admin] Get state failed:', e.message);
    return null;
  }
}

export async function adminSetFixed(content, winner) {
  if (!isReady || !supabase) return false;
  try {
    const { error } = await supabase.rpc('admin_set_fixed', {
      new_content: JSON.stringify(content),
      new_winner: winner
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Admin] Set fixed failed:', e.message);
    return false;
  }
}

export async function adminSetCounter(count) {
  if (!isReady || !supabase) return false;
  try {
    const { error } = await supabase.rpc('admin_set_counter', { new_count: count });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Admin] Set counter failed:', e.message);
    return false;
  }
}

export async function adminSetSpinner(winner, trigger) {
  if (!isReady || !supabase) return false;
  try {
    const { error } = await supabase.rpc('admin_set_spinner', {
      p_winner: winner,
      p_trigger: trigger
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Admin] Set spinner failed:', e.message);
    return false;
  }
}

export async function adminClearSpinner() {
  if (!isReady || !supabase) return false;
  try {
    const { error } = await supabase.rpc('admin_clear_spinner');
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Admin] Clear spinner failed:', e.message);
    return false;
  }
}
