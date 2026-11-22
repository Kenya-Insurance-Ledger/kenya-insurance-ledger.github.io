// Client-side persistence (demo). Everything the user creates lives in localStorage under "kgii3.*".
// Not secure, not shared between devices — a production build would move this behind an authenticated API.
import { useSyncExternalStore } from 'react';

const KEYS = ['compare', 'checks', 'imported', 'history', 'superseded', 'resolutions', 'bannerDismissed', 'contactEdits'] as const;
type Key = (typeof KEYS)[number];
const DEFAULTS: Record<Key, any> = { compare: [], checks: {}, imported: [], history: [], superseded: [], resolutions: {}, bannerDismissed: false, contactEdits: {} };

function read(k: Key) { try { const v = localStorage.getItem('kgii3.' + k); return v ? JSON.parse(v) : DEFAULTS[k]; } catch { return DEFAULTS[k]; } }
function write(k: Key, v: any) { try { localStorage.setItem('kgii3.' + k, JSON.stringify(v)); } catch { /* storage unavailable: keep in memory */ } }

let state: Record<Key, any> = Object.fromEntries(KEYS.map((k) => [k, read(k)])) as any;
const subs = new Set<() => void>();
export function getState() { return state; }
export function setState(patch: Partial<Record<Key, any>>) {
  state = { ...state, ...patch };
  (Object.keys(patch) as Key[]).forEach((k) => write(k, state[k]));
  subs.forEach((f) => f());
}
export function useStore() { return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, getState); }
export function log(entry: { who?: string; action: string; key: string; prev?: any; next?: any; src?: string; status?: string }) {
  setState({ history: [...state.history, { at: new Date().toISOString(), who: entry.who || 'Anonymous (demo)', ...entry }] });
}

/** Backup: everything the user created, as one JSON document. */
export function exportBackup() {
  return JSON.stringify({ app: 'kenya-general-insurance-intelligence', version: 4, exportedAt: new Date().toISOString(), data: Object.fromEntries(KEYS.map((k) => [k, state[k]])) }, null, 2);
}
export function importBackup(text: string): string {
  const d = JSON.parse(text);
  if (d.app !== 'kenya-general-insurance-intelligence' || !d.data) throw new Error('Not a backup from this portal.');
  const patch: any = {};
  KEYS.forEach((k) => { if (k in d.data) patch[k] = d.data[k]; });
  setState(patch);
  log({ action: 'backup restored', key: 'all user data', next: d.exportedAt });
  return `Restored backup from ${d.exportedAt}.`;
}
