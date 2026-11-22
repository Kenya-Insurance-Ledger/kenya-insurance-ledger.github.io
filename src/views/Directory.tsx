import React, { useState } from 'react';
import { FIN, INSURERS, val, idxOf, fmt } from '../lib/fin';
import { CLASSES, ISTATUS } from '../data/reference.js';
import { Badge, Card, H1, H2, Lead, Src, Table, Num, Btn, Info, inputCls, toast } from '../components/ui';
import { LineageFlow } from '../components/illustrations';
import { useStore, setState } from '../lib/store';
import { useApp } from '../App';
import { ContactCard, VerifyCard, contactSummary } from '../components/contacts';

export const InsBadge = ({ i }: any) => { const [l, b] = ISTATUS[i.status]; return <Badge s={b} label={l} />; };
export const contactStatus = (i: any, edits: any = {}) => contactSummary(i, edits).phone;

export default function Directory() {
  const { openInsurer, openCompare } = useApp();
  const st = useStore();
  const [mode, setMode] = useState<'table' | 'cards'>('table');
  const [f, setF] = useState({ q: '', cat: 'gi', status: '', cls: '', sort: 'legal', dir: 1, page: 1 });
  const i25 = FIN.ready ? idxOf('2025 Q4') : -1;
  const gwp = (i) => (i.fid && i25 >= 0 ? val(i.fid, 'gpi', i25) : null);
  const q = f.q.toLowerCase();
  let l = INSURERS.filter((i) => (!q || (i.legal + ' ' + i.trading + ' ' + i.aliases.map((a) => a.name).join(' ') + ' ' + i.irasNames.join(' ')).toLowerCase().includes(q)) && (!f.cls || i.classes.includes(f.cls)) && (!f.status || i.status === f.status) && (f.cat === 'all' || (f.cat === 'gi' ? i.category.startsWith('General') : i.category === f.cat)));
  l = l.slice().sort((a, b) => { let va, vb; if (f.sort === 'gwp') { va = gwp(a)?.v ?? -1e15; vb = gwp(b)?.v ?? -1e15; } else if (f.sort === 'n') { va = a.classes.length; vb = b.classes.length; } else { va = String(a[f.sort]); vb = String(b[f.sort]); } return (va > vb ? 1 : va < vb ? -1 : 0) * f.dir; });
  const per = 10, pages = Math.max(1, Math.ceil(l.length / per)), page = Math.min(f.page, pages), rows = l.slice((page - 1) * per, page * per);
  const sortBy = (k) => setF({ ...f, sort: k, dir: f.sort === k ? -f.dir : k === 'gwp' ? -1 : 1 });
  const ar = (k) => (f.sort === k ? (f.dir === 1 ? ' ▲' : ' ▼') : '');
  const toggle = (id) => { const c = st.compare.slice(); const k = c.indexOf(id); if (k >= 0) c.splice(k, 1); else { if (c.length >= 3) { toast('You can compare up to three insurers'); return; } c.push(id); } setState({ compare: c }); };
  const gi = INSURERS.filter((i) => i.general);
  const ce = st.contactEdits; const cV = gi.filter((i) => contactStatus(i, ce) === 'VERIFIED').length, cR = gi.filter((i) => contactStatus(i, ce) === 'REPORTED').length;
  return <>
    
    <H1>Insurers</H1>
    <Lead>35 licensed general insurers, plus micro, re and historical entities.</Lead>
    <div className="my-3 flex flex-wrap gap-1.5">{Object.entries(ISTATUS).map(([k, [lab, b]]: any) => <button key={k} onClick={() => setF({ ...f, status: f.status === k ? '' : k, cat: 'all', page: 1 })} aria-pressed={f.status === k} className={`min-h-[36px] rounded-full border px-1.5 ${f.status === k ? 'border-sky-600' : 'border-transparent'}`}><Badge s={b} label={lab} /> <b className="text-sm">{INSURERS.filter((i) => i.status === k).length}</b></button>)}</div>
    
    <div className="my-3 flex flex-wrap items-end gap-2">
      <input type="search" aria-label="Search insurers" placeholder="Search legal, trading or former names…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value, page: 1 })} className={inputCls + ' flex-[1_1_220px]'} />
      <select aria-label="Category" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value, page: 1 })} className={inputCls}><option value="gi">General insurers</option><option value="Microinsurer">Microinsurers</option><option value="Reinsurer">Reinsurers</option><option value="all">All records</option></select>
      <select aria-label="Class" value={f.cls} onChange={(e) => setF({ ...f, cls: e.target.value, page: 1 })} className={inputCls + ' w-full sm:w-56'}><option value="">Any class</option>{CLASSES.map((c) => <option key={c.code} value={c.code}>{c.code} {c.legal}</option>)}</select>
      <Btn primary disabled={st.compare.length < 2} onClick={openCompare}>Compare ({st.compare.length}/3)</Btn>{st.compare.length > 0 && <Btn small onClick={() => setState({ compare: [] })}>Clear</Btn>}
      <div className="ml-auto inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700" role="group" aria-label="View">{[['table', 'Table'], ['cards', 'Contact cards']].map(([k, t]) => <button key={k} data-testid={'mode-' + k} aria-pressed={mode === k} onClick={() => setMode(k as any)} className={`min-h-[36px] rounded-md px-3 text-[13px] ${mode === k ? 'bg-navy-800 text-white' : 'text-slate-600 dark:text-slate-300'}`}>{t}</button>)}</div></div>
    {mode === 'cards' ? <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]" data-testid="contact-grid">{rows.map((i) => <div key={i.id} className="min-w-0"><div className="mb-1 flex items-center justify-between gap-2"><button className="truncate text-left font-semibold hover:text-sky-700" onClick={() => openInsurer(i.id)}>{i.trading}</button><InsBadge i={i} /></div><ContactCard i={i} /></div>)}</div> :
    <Table><thead><tr><th>Compare</th><th className="cursor-pointer" onClick={() => sortBy('legal')}>Legal name{ar('legal')}</th><th>Status</th><th className="cursor-pointer !text-right" onClick={() => sortBy('n')}>Classes{ar('n')}</th><th className="cursor-pointer !text-right" onClick={() => sortBy('gwp')}>FY 2025 GWP{ar('gwp')}</th><th>Contacts</th></tr></thead>
      <tbody>{rows.map((i) => { const g = gwp(i); return <tr key={i.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => openInsurer(i.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openInsurer(i.id)}>
        <td onClick={(e) => e.stopPropagation()}>{i.category !== 'Reinsurer' ? <input type="checkbox" className="h-5 w-5" aria-label={'Compare ' + i.trading} checked={st.compare.includes(i.id)} onChange={() => toggle(i.id)} /> : '—'}</td>
        <td><b>{i.legal}</b><div className="text-[12.5px] text-slate-500">{i.trading}{i.aliases.length ? ' · formerly ' + i.aliases[0].name + (i.aliases.length > 1 ? ' +' + (i.aliases.length - 1) : '') : ''}</div></td>
        <td><InsBadge i={i} /></td><Num>{i.classes.length || '—'}</Num>
        <Num>{g && g.v != null ? <>{fmt(g.v)} <Badge s={g.status} /></> : <span className="text-[13px] italic text-slate-500">Not available</span>}</Num>
        <td>{(() => { const cs = contactSummary(i, ce); return <span className="inline-flex items-center gap-1.5"><Badge s={cs.phone} label={cs.phone === 'PENDING' ? 'pending' : cs.phone.toLowerCase()} /><span className="text-[11.5px] tabular-nums text-slate-400">{cs.filled}/4</span></span>; })()}</td></tr>; })}
        {!rows.length && <tr><td colSpan={6} className="py-8 text-center text-slate-500">No insurers match.</td></tr>}</tbody></Table>}
    <div className="flex items-center justify-end gap-2 p-2 text-[13px] text-slate-500"><span>{l.length} records · page {page} of {pages}</span><Btn small disabled={page <= 1} onClick={() => setF({ ...f, page: page - 1 })}>Previous</Btn><Btn small disabled={page >= pages} onClick={() => setF({ ...f, page: page + 1 })}>Next</Btn></div>
    <p className="flex items-center gap-2 text-xs text-slate-500">Contacts: {cV} verified · {cR} reported · {gi.length - cV - cR} pending <Info>Status from the IRA s.184 notice (30 Mar 2026) and statutory-management notices. No insurer is recorded in receivership or run-off — no official notice was found. Former names are linked only on documented renames or mergers. FY 2025 GWP = IRA quarterly gross premium income: size, not strength. <Src ids={['S1', 'S3', 'S27', 'S19']} /></Info></p>
    <div className="mt-4"><VerifyCard /></div>
    <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><summary className="cursor-pointer font-display text-lg font-semibold">Name changes &amp; mergers</summary><LineageFlow /><Src ids={['S19', 'S30', 'S21']} /></details>
  </>;
}
