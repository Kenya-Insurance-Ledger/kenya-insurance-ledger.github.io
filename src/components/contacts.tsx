import React, { useState } from 'react';
import { CHECKED } from '../data/reference.js';
import { Badge, Btn, inputCls, toast } from './ui';
import { useStore, setState, getState, log } from '../lib/store';

/** The four structured contact fields every general insurer gets. */
export const CFIELDS: [string, string, RegExp][] = [
  ['phone', 'Customer care phone', /Customer care phone/],
  ['email', 'Claims / support email', /email/i],
  ['web', 'Official website', /Official website/],
  ['office', 'Head office', /Head office/],
];

/** Resolve one field: a local stamp by this viewer wins, then a sourced record, else pending. */
export function contactField(i: any, key: string, edits: any) {
  const [, label, re] = CFIELDS.find((f) => f[0] === key)!;
  const e = edits?.[i.id]?.[key];
  if (e) return { label, value: e.value, url: e.url, status: 'VERIFIED', local: true, at: e.at };
  const c = (i.contacts || []).find((x: any) => re.test(x.type));
  if (c) return { label, value: c.value, url: c.url, status: c.status, scope: c.scope };
  return { label, value: null, url: null, status: 'PENDING' };
}

export function contactSummary(i: any, edits: any) {
  const f = CFIELDS.map(([k]) => contactField(i, k, edits));
  return { filled: f.filter((x) => x.value).length, verified: f.filter((x) => x.status === 'VERIFIED').length, phone: f[0].status };
}

const host = (u: string) => u.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

function Row({ i, k, f, compact }: any) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(f.value || '');
  const [u, setU] = useState('');
  const save = () => {
    if (!v.trim()) return toast('Enter a value');
    if (!/^https:\/\/\S+\.\S+/.test(u.trim())) return toast('Add the https:// page where you confirmed it');
    const all = { ...getState().contactEdits }; all[i.id] = { ...(all[i.id] || {}), [k]: { value: v.trim(), url: u.trim(), at: new Date().toISOString() } };
    setState({ contactEdits: all });
    log({ action: 'contact verified', key: `${i.trading} · ${f.label}`, prev: f.value, next: v.trim(), src: u.trim(), status: 'VERIFIED (local)' });
    setOpen(false); toast('Saved on this device');
  };
  const undo = () => { const all = { ...getState().contactEdits }; const r = { ...(all[i.id] || {}) }; delete r[k]; all[i.id] = r; setState({ contactEdits: all }); log({ action: 'contact stamp removed', key: `${i.trading} · ${f.label}` }); };
  const isUrl = k === 'web' && f.value;
  return <div className={`border-t border-slate-100 first:border-0 dark:border-slate-800 ${f.value ? 'py-2' : 'py-1.5'}`} data-field={k}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{f.label}</div>
        {f.value ? <div className="break-words text-sm font-medium">{isUrl ? <a className="text-sky-700 underline" href={/^https?:/.test(f.value) ? f.value : 'https://' + f.value} target="_blank" rel="noopener">{f.value}</a> : f.value}</div>
          : <div className="text-[13px] italic text-slate-500">Not yet sourced</div>}
        {!compact && (f.url || f.scope) && <div className="text-[11.5px] text-slate-500">{f.scope ? f.scope + ' · ' : ''}{f.url && <a className="text-sky-700 underline" href={f.url} target="_blank" rel="noopener">{host(f.url)}</a>}{f.local ? ` · stamped ${f.at.slice(0, 10)}` : f.url ? ` · checked ${CHECKED}` : ''}</div>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {f.value ? <Badge s={f.status} label={f.local ? 'verified by you' : f.status === 'PENDING' ? 'pending verification' : undefined} /> : null}
        {!compact && <button className={`text-[12px] underline ${f.value ? 'text-sky-700' : 'text-slate-400 hover:text-sky-700'}`} onClick={() => setOpen(!open)} data-testid={`ve-${i.id}-${k}`}>{open ? 'Cancel' : 'Verify & Edit'}</button>}
        {!compact && f.local && !open && <button className="text-[12px] text-slate-500 underline" onClick={undo}>Remove stamp</button>}
      </div>
    </div>
    {open && <div className="mt-2 grid gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
      <input className={inputCls + ' w-full'} aria-label={f.label + ' value'} placeholder={f.label} value={v} onChange={(e) => setV(e.target.value)} />
      <input className={inputCls + ' w-full'} aria-label="Source URL" placeholder="https://… page where you confirmed it" value={u} onChange={(e) => setU(e.target.value)} />
      <div className="flex items-center gap-2"><Btn small primary onClick={save}>Save stamp</Btn><span className="text-[11.5px] text-slate-500">Stored only in this browser; included in Backup.</span></div>
    </div>}
  </div>;
}

/** Structured contact card. compact = read-only (used in Compare). */
export function ContactCard({ i, compact = false }: any) {
  const st = useStore();
  const fs = CFIELDS.map(([k]) => [k, contactField(i, k, st.contactEdits)] as const);
  const n = fs.filter(([, f]) => f.value).length;
  return <div className="rounded-xl border border-slate-200 bg-white px-3 py-1 dark:border-slate-800 dark:bg-slate-900" data-testid={`contact-${i.id}`}>
    {n === 0 && <div className="flex items-center justify-between pt-1.5 text-[12px] text-slate-500"><span>No contact sourced yet</span><Badge s="PENDING" label="pending verification" /></div>}
    {fs.map(([k, f]) => <Row key={k} i={i} k={k} f={f} compact={compact} />)}
  </div>;
}

/** Quick actions: check a licence or a motor certificate before paying. */
export function VerifyCard() {
  const L = [
    ['Insurance agent', 'IRA licensed agents list', 'https://ira.go.ke/licensed-insurance-agents/', 'VERIFIED', 'S36'],
    ['Insurance broker', 'IRA licensed brokers list', 'https://www.ira.go.ke/licensed-insurance-brokers/', 'VERIFIED', 'S37'],
    ['Other intermediaries', 'IRA licensed intermediaries', 'https://ira.go.ke/licensed-intermediaries/', 'PENDING', null],
  ];
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900" data-testid="verify-card">
    <div className="flex items-center justify-between gap-2"><h3 className="font-display text-base font-semibold">Verify an intermediary or cover</h3><span className="text-[11px] text-slate-400">before you pay</span></div>
    <div className="mt-2 grid gap-2 sm:grid-cols-3">{L.map(([t, n, u, s]) => <a key={t} href={u as string} target="_blank" rel="noopener" className="group rounded-xl border border-slate-200 p-3 hover:border-sky-600 hover:bg-sky-50/50 dark:border-slate-700 dark:hover:bg-slate-800">
      <div className="text-sm font-semibold group-hover:text-sky-700">{t} ↗</div><div className="text-[12px] text-slate-500">{n}</div>
      <div className="mt-1"><Badge s={s} label={s === 'PENDING' ? 'link not confirmed' : 'official IRA page'} /></div></a>)}</div>
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/30" data-testid="aki-tip">
      <span className="rounded-md bg-amber-500 px-2 py-0.5 font-mono text-sm font-bold text-white">*352#</span>
      <span>Check a motor certificate: dial <b>*352#</b> or use AKI’s Bima Yangu app.</span>
      <Badge s="REPORTED" /> <a className="text-[12px] text-sky-700 underline" href="https://www.kenyans.co.ke/news/120988-motorists-urged-remain-vigilant-govt-cracks-down-fake-vehicle-insurance-certificates" target="_blank" rel="noopener">Kenyans.co.ke, 19 Feb 2026</a>
    </div>
  </div>;
}
