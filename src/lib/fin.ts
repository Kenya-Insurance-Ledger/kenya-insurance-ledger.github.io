// Financial engine: loads the compiled IRA panel, builds the insurer registry and answers value queries
// with a per-record verification status. Ratios are calculated here and always flagged as calculated.
import { RAW_GI, EXTRA, ALIASES, CONTACTS, ALLGI } from '../data/reference.js';

export type Status = 'VERIFIED' | 'REPORTED' | 'DISPUTED' | 'PENDING' | 'SUPERSEDED' | 'UNAVAILABLE';
export interface Val { v: number | null; status: Status; calc?: boolean; derived?: boolean; note?: string; reason?: string }

export const FIN: any = { ready: false, error: null, meta: null, P: [] as string[], comp: {} as Record<string, any>, market: null, checks: [], wb: {}, mc: {} };

const ratio = (a: number | null, b: number | null) => (a == null || b == null || b <= 0 ? null : (a / b) * 100);
export const FLOW = ['gdp', 'inw', 'nep', 'clm', 'com', 'exp', 'uw', 'inv', 'op', 'pat'];
export const MET: Record<string, any> = {
  gpi: { label: 'Gross premium income (GWP)', unit: 'm', kind: 'reported', help: 'IRA “gross premium income”: gross direct premium + inward reinsurance. Measures size only — not strength, service or claims behaviour.', f: (s, i) => (s.gdp[i] == null ? null : s.gdp[i] + (s.inw[i] || 0)) },
  gdp: { label: 'Gross direct premium', unit: 'm', kind: 'reported', help: 'Premium written directly, excluding inward reinsurance.', f: (s, i) => s.gdp[i] },
  nep: { label: 'Net earned premium', unit: 'm', kind: 'reported', help: 'Premium after reinsurance, adjusted for unearned premium reserves.', f: (s, i) => s.nep[i] },
  clm: { label: 'Claims incurred (net)', unit: 'm', kind: 'reported', help: 'Net incurred claims: paid plus change in reserves, after reinsurance.', f: (s, i) => s.clm[i] },
  uw: { label: 'Underwriting result', unit: 'm', kind: 'reported', help: 'Net earned premium − claims − commissions − expenses, as reported by IRA. Negative = underwriting loss.', f: (s, i) => s.uw[i] },
  inv: { label: 'Investment income (general business)', unit: 'm', kind: 'reported', help: 'Investment income allocated to general business.', f: (s, i) => s.inv[i] },
  pat: { label: 'Profit after tax (general business)', unit: 'm', kind: 'reported', help: 'From the general-business P&L. Profit BEFORE tax is not in the compiled data.', f: (s, i) => (s.pat ? s.pat[i] : null) },
  ta: { label: 'Total assets', unit: 'm', kind: 'reported', stock: true, help: 'General business balance sheet at period end.', f: (s, i) => (s.ta ? s.ta[i] : null) },
  eq: { label: 'Shareholders’ funds', unit: 'm', kind: 'reported', stock: true, help: 'Total equity at period end.', f: (s, i) => (s.eq ? s.eq[i] : null) },
  lr: { label: 'Loss ratio', unit: 'pct', kind: 'calculated', help: 'Calculated here: net claims incurred ÷ net earned premium.', f: (s, i) => ratio(s.clm[i], s.nep[i]) },
  er: { label: 'Expense ratio', unit: 'pct', kind: 'calculated', help: 'Calculated here: (net commissions + management expenses) ÷ net earned premium.', f: (s, i) => (s.com[i] == null || s.exp[i] == null ? null : ratio(s.com[i] + s.exp[i], s.nep[i])) },
  cr: { label: 'Combined ratio', unit: 'pct', kind: 'calculated', help: 'Calculated here: loss ratio + expense ratio. Above 100% = underwriting loss before investment income.', f: (s, i) => (s.clm[i] == null || s.com[i] == null || s.exp[i] == null ? null : ratio(s.clm[i] + s.com[i] + s.exp[i], s.nep[i])) },
  ms: { label: 'Market share (of gross premium income)', unit: 'pct', kind: 'calculated', help: 'Calculated here: insurer GWP ÷ market GWP from the same IRA table and period. Size only.', f: null },
  cpaid: { label: 'Claims paid', unit: 'm', kind: 'unavailable', help: 'In IRA claims settlement statistics, not yet extracted. Import to populate.' },
  nwp: { label: 'Net written premium', unit: 'm', kind: 'unavailable', help: 'Outward reinsurance is not in the compiled extract.' },
  pbt: { label: 'Profit before tax', unit: 'm', kind: 'unavailable', help: 'Not in the compiled extract; profit after tax is shown instead.' },
  car: { label: 'Capital adequacy ratio', unit: 'pct', kind: 'unavailable', help: 'Not published at insurer level in the sources used.' },
};

export const pParse = (p: string) => { const [y, q] = p.split(' Q'); return { y: +y, q: +q }; };
export function pLabel(p: string, short = false) {
  const { y, q } = pParse(p);
  if (short) return ({ 4: 'FY', 3: '9M', 2: 'H1', 1: 'Q1' } as any)[q] + ' ' + y;
  return ({ 4: `FY ${y} (Jan–Dec)`, 3: `9M ${y} (Jan–Sep, YTD)`, 2: `H1 ${y} (Jan–Jun, YTD)`, 1: `Q1 ${y} (Jan–Mar)` } as any)[q];
}
export const idxOf = (p: string) => FIN.P.indexOf(p);
export const fyIdx = (): [string, number][] => FIN.P.map((p, i) => [p, i]).filter(([p]) => p.endsWith('Q4'));

export async function loadFin() {
  try {
    const r = await fetch('data/ira_general.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    Object.assign(FIN, { meta: d.meta, P: d.meta.periods, market: d.market, checks: d.checks, wb: d.workbooks, mc: d.marketClasses || {} });
    d.companies.forEach((c) => (FIN.comp[c.id] = c));
    FIN.ready = true;
  } catch (e: any) { FIN.error = e.message; }
  buildRegistry();
}

export let INSURERS: any[] = [];
export function buildRegistry() {
  const rec: any[] = [];
  RAW_GI.forEach((r, i) => rec.push({ id: r[4] || 'gi' + i, fid: FIN.comp[r[4]] ? r[4] : null, legal: r[0], trading: r[1], category: r[3] === 'both' ? 'General + Long-term' : 'General', status: 'ACTIVE', classes: r[2] === 'all' ? ALLGI.slice() : r[2].split(','), src: ['S1'], note: r[3] === 'both' ? 'Appears in both the general and long-term sections of the 2026 notice.' : '', general: true }));
  EXTRA.forEach((r, i) => { const id = r[6] || 'x' + i; rec.push({ id, fid: r[6] && FIN.comp[r[6]] ? r[6] : null, legal: r[0], trading: r[1], category: r[2], status: r[3], classes: r[4], src: [r[5]], note: r[7], general: false }); });
  rec.forEach((x) => {
    x.aliases = ALIASES.filter((a) => a.to === x.id);
    const c = x.fid && FIN.comp[x.fid];
    x.history = c ? c.history.filter((h) => h.text && !/^(renamed|spelling|same company)$/.test(h.text)) : [];
    x.irasNames = c ? c.aliases : [];
    x.contacts = CONTACTS[x.id] || [];
  });
  INSURERS = rec;
}
export const insById = (id: string) => INSURERS.find((i) => i.id === id);

const mkt = () => FIN.market.insurer.ytd;
export function mval(k: string, i: number) {
  const m = mkt(); if (k === 'ms') return 100;
  if (k === 'gpi') return m.gdp[i] == null ? null : m.gdp[i] + (m.inw[i] || 0);
  return MET[k].kind === 'calculated' ? MET[k].f(m, i) : m[k] ? m[k][i] : null;
}
export const VERIFIED_MARKET: Record<string, string[]> = { '2025 Q1': ['gpi', 'nep', 'clm', 'uw'], '2025 Q2': ['gpi'] };
const checkFor = (cid: string, per: string) => { const c = FIN.comp[cid]; return c && FIN.checks.find((k) => k.ok && k.label.startsWith(c.name + ' market share ' + per)); };

const prevIdx = (i: number) => { const { y, q } = pParse(FIN.P[i]); return q === 1 ? -1 : FIN.P.indexOf(`${y} Q${q - 1}`); };
function deriveFlow(arr: (number | null)[], i: number) { const { q } = pParse(FIN.P[i]); if (arr[i] == null) return null; if (q === 1) return arr[i]; const j = prevIdx(i); if (j < 0 || arr[j] == null) return null; return (arr[i] as number) - (arr[j] as number); }
function qSeries(s: any) { const o: any = {}; FLOW.forEach((k) => { if (s[k]) o[k] = s[k].map((_, i) => deriveFlow(s[k], i)); }); ['ta', 'eq'].forEach((k) => { if (s[k]) o[k] = s[k]; }); return o; }
const _qc: Record<string, any> = {}; let _qm: any = null;
const singleC = (c, k, i) => MET[k].f((_qc[c.id] ||= qSeries(c.s)), i);
const singleM = (k, i) => { const q = (_qm ||= qSeries(mkt())); if (k === 'ms') return 100; return k === 'gpi' ? (q.gdp[i] == null ? null : q.gdp[i] + (q.inw[i] || 0)) : MET[k].f ? MET[k].f(q, i) : null; };

/** Value of metric k for company cid at period index i. single = derived single-quarter value. */
export function val(cid: string, k: string, i: number, single = false): Val {
  const M = MET[k]; if (!M || M.kind === 'unavailable') return { v: null, status: 'UNAVAILABLE', reason: M ? M.help : 'Unknown metric' };
  if (i == null || i < 0) return { v: null, status: 'UNAVAILABLE', reason: 'Period not in dataset' };
  const per = FIN.P[i];
  if (cid === '__market') { const v = single ? singleM(k, i) : mval(k, i); const ver = !single && (VERIFIED_MARKET[per] || []).includes(k); return { v, status: v == null ? 'UNAVAILABLE' : ver ? 'VERIFIED' : 'REPORTED', calc: M.kind === 'calculated', derived: single, note: ver ? 'Matches IRA release to the thousand' : '' }; }
  const c = FIN.comp[cid]; if (!c) return { v: null, status: 'UNAVAILABLE', reason: 'No financial records for this entity' };
  if (c.notFiled.includes(per)) return { v: null, status: 'UNAVAILABLE', reason: 'IRA printed an all-zero account (return not filed) — left blank' };
  let v: number | null;
  if (k === 'ms') { const g = single ? singleC(c, 'gpi', i) : MET.gpi.f(c.s, i); const t = single ? singleM('gpi', i) : mval('gpi', i); v = g == null || !t ? null : (g / t) * 100; }
  else v = single ? singleC(c, k, i) : M.f(c.s, i);
  if (v == null) return { v: null, status: 'UNAVAILABLE', reason: single ? 'Single quarter cannot be derived (previous quarter missing)' : 'Not reported for this period' };
  let status: Status = 'REPORTED', note = '';
  if (c.disputed && c.disputed[per]) { status = 'DISPUTED'; note = 'Faulty return flagged: ' + c.disputed[per].join('; '); }
  else if (k === 'ms' && !single && checkFor(cid, per)) { status = 'VERIFIED'; note = 'Matches IRA market-share table (Q1 2025 release, Table 16) to 0.1 point'; }
  return { v, status, calc: M.kind === 'calculated', derived: single, note };
}
export const sourceForPeriod = (per: string) => FIN.wb[per] || null;
export const insurerRows = () => Object.values(FIN.comp).filter((c: any) => c.segment === 'insurer') as any[];

export function fmt(v: number | null | undefined, unit = 'm') {
  if (v == null || Number.isNaN(v)) return '—';
  if (unit === 'pct') return (Math.round(v * 10) / 10).toLocaleString('en-KE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  const a = Math.abs(v);
  return (v < 0 ? '−' : '') + (a >= 1000 ? 'KSh ' + (a / 1000).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' bn' : 'KSh ' + a.toLocaleString('en-KE', { maximumFractionDigits: 1 }) + ' m');
}
