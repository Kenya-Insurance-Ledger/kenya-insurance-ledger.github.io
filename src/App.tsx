import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FIN, loadFin, INSURERS, MET, pLabel, buildRegistry } from './lib/fin';
import { useStore, setState, exportBackup, importBackup } from './lib/store';
import { CHECKED, SOURCES, RECON, PRODUCTS, CLASSES, LEGAL, GLOSSARY, INSTITUTIONS, FEED, ISTATUS } from './data/reference.js';
import { Badge, Toaster, Modal, Btn, toast } from './components/ui';
import Overview from './views/Overview';
import Classes from './views/Classes';
import Directory from './views/Directory';
import Performance from './views/Performance';
import Claims from './views/Claims';
import Toolkit from './views/Toolkit';
import Sources from './views/Sources';
import { contactSummary } from './components/contacts';
import { InsurerDrawer, ProductDrawer, CompareModal } from './views/Drawers';

export const VIEWS: [string, string, string][] = [
  ['overview', 'Overview', 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z'],
  ['classes', 'Insurance Classes', 'M4 4h16v4H4zM4 10h16v4H4zM4 16h16v4H4z'],
  ['insurers', 'Insurer Directory', 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6'],
  ['performance', 'Industry Performance', 'M4 20V10M10 20V4M16 20v-8M22 20H2'],
  ['claims', 'Claims & Consumer Protection', 'M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z'],
  ['toolkit', 'Agency & Broker Toolkit', 'M14 7l3-3 3 3-3 3M3 21l9-9M8 6l10 10'],
  ['sources', 'Data Sources & Verification', 'M4 4h12l4 4v12H4zM8 12h8M8 16h8M8 8h4'],
];
type Ctx = { view: string; sub: Record<string, string>; go: (v: string, sub?: string) => void; setSub: (v: string, s: string) => void; openInsurer: (id: string) => void; openProduct: (id: string) => void; openCompare: () => void; finTick: number; track: (fid: string) => void; trackTarget: string | null };
export const AppCtx = createContext<Ctx>(null as any);
export const useApp = () => useContext(AppCtx);

function Search() {
  const { go, openInsurer, openProduct, setSub } = useApp();
  const [q, setQ] = useState('');
  const res = useMemo(() => {
    const s = q.trim().toLowerCase(); if (s.length < 2) return [];
    const R: [string, string, string, () => void][] = [];
    INSURERS.forEach((i) => { const al = i.aliases.map((a) => a.name).join('; '); if ((i.legal + ' ' + i.trading + ' ' + al + ' ' + i.irasNames.join(' ')).toLowerCase().includes(s)) R.push([i.trading + (al && al.toLowerCase().includes(s) ? ` (formerly ${al})` : ''), 'Insurer Directory · ' + ISTATUS[i.status][0], 'i', () => { go('insurers'); openInsurer(i.id); }]); });
    PRODUCTS.forEach((p) => (p.name + p.over).toLowerCase().includes(s) && R.push([p.name, 'Insurance Classes · product', 'p', () => { go('classes'); openProduct(p.id); }]));
    CLASSES.forEach((c) => (c.code + ' ' + c.legal + ' ' + c.name).toLowerCase().includes(s) && R.push([c.code + ' ' + c.legal, 'Insurance Classes · legal class', 'c', () => go('classes')]));
    Object.entries(MET).forEach(([k, m]: any) => (m.label + ' ' + m.help).toLowerCase().includes(s) && R.push([m.label, 'Industry Performance · metric' + (m.kind === 'unavailable' ? ' (not available)' : ''), 'm', () => go('performance', m.kind === 'unavailable' ? 'rankings' : 'tracker')]));
    LEGAL.forEach((l) => (l.act + l.sec + l.subject + l.text + l.plain).toLowerCase().includes(s) && R.push([l.sec + ' — ' + l.subject, 'Legal library · ' + l.type, 'l', () => go('sources', 'legal')]));
    INSTITUTIONS.forEach((x) => (x.name + x.mandate).toLowerCase().includes(s) && R.push([x.name, 'Overview · institution', 'x', () => go('overview')]));
    SOURCES.forEach((x) => (x.name + x.inst).toLowerCase().includes(s) && R.push([x.name, 'Source register · ' + x.inst, 'r', () => go('sources', 'register')]));
    FEED.forEach((f) => (f.title + f.body).toLowerCase().includes(s) && R.push([f.title, 'Market feed · ' + f.date, 'f', () => go('overview')]));
    GLOSSARY.forEach((g) => (g.term + g.def).toLowerCase().includes(s) && R.push([g.term, 'Glossary', 'g', () => go('overview')]));
    return R.slice(0, 16);
  }, [q]);
  return <div className="relative min-w-0 flex-[1_1_260px] max-w-[540px]">
    <svg className="pointer-events-none absolute left-3 top-3.5 h-[18px] w-[18px] text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
    <input id="gsearch" type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setQ('')} placeholder="Search insurers, laws, metrics…" aria-label="Global search" autoComplete="off" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-base dark:border-slate-700 dark:bg-slate-800" />
    {q.trim().length >= 2 && <div id="gresults" role="listbox" className="absolute left-0 right-0 top-12 z-30 max-h-[60vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
      {res.length ? res.map(([l, m, , fn], i) => <button key={i} role="option" onClick={() => { setQ(''); fn(); }} className="block w-full border-b border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">{l}<br /><small className="text-slate-500">{m}</small></button>) : <div className="p-3 text-sm text-slate-500">No results</div>}
    </div>}
  </div>;
}

function MissingBanner() {
  const st = useStore();
  const pend = INSURERS.filter((i) => i.general && contactSummary(i, st.contactEdits).phone !== 'VERIFIED').length;
  if (st.bannerDismissed) return null;
  return <details className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 text-sm dark:border-amber-900 dark:bg-amber-950/30" role="region" aria-label="Pending data ingestion">
    <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2 [&::-webkit-details-marker]:hidden"><span className="h-2 w-2 rounded-full bg-amber-500" /><b>3 data gaps pending</b><span className="hidden text-slate-500 sm:inline">— 2025 annual statistics · claims settlement data · {pend} insurer contacts</span>
      <button className="ml-auto rounded-md px-2 py-1 text-[13px] text-slate-500 hover:bg-amber-100" onClick={(e) => { e.preventDefault(); setState({ bannerDismissed: true }); }} aria-label="Dismiss pending-ingestion banner">Dismiss</button></summary>
    <ul className="list-disc px-3.5 pb-3 pl-8">
      <li><b>IRA 2025 Annual Statistics PDF</b> — settles KSh 224.24 bn vs 225.38 bn</li>
      <li><b>Insurer claims settlement statistics</b> — claims paid and settlement ratios</li>
      <li><b>Insurer contacts</b> — {pend} of 35 insurers have no verified customer-care line yet</li></ul>
  </details>;
}

function BackupModal({ onClose }) {
  const [txt, setTxt] = useState('');
  const out = useMemo(() => exportBackup(), []);
  return <Modal title="Backup & restore your local data" onClose={onClose}>
    <p className="text-sm text-slate-600 dark:text-slate-400">Imports, resolutions, checklists and the audit log are stored only in this browser. Copy the backup below and keep it somewhere safe; paste it back to restore. (File downloads are blocked inside the hosted viewer, so the backup is copy-based.)</p>
    <div className="my-3 flex flex-wrap gap-2"><Btn primary onClick={() => navigator.clipboard.writeText(out).then(() => toast('Backup copied'), () => toast('Copy blocked — select the text and copy manually'))}>Copy backup JSON</Btn></div>
    <textarea readOnly value={out} className="h-48 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800" aria-label="Backup JSON" />
    <h3 className="mt-4 font-semibold">Restore</h3>
    <textarea value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Paste a backup JSON here" className="h-32 w-full rounded-lg border border-slate-200 p-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-900" aria-label="Paste backup" />
    <div className="mt-2 flex flex-wrap gap-2"><Btn onClick={() => { try { toast(importBackup(txt)); onClose(); } catch (e: any) { toast('Restore failed: ' + e.message); } }} disabled={!txt.trim()}>Restore from pasted backup</Btn>
      <label className="inline-flex min-h-[40px] cursor-pointer items-center rounded-lg border border-slate-200 px-3.5 text-sm font-medium dark:border-slate-700">Restore from file<input type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; f.text().then((t) => { try { toast(importBackup(t)); onClose(); } catch (er: any) { toast('Restore failed: ' + er.message); } }); }} /></label></div>
  </Modal>;
}

export default function App() {
  const [view, setView] = useState('overview');
  const [sub, setSubs] = useState<Record<string, string>>({ performance: 'industry', sources: 'register', claims: 'timeline', toolkit: 'licensing' });
  const [finTick, setFinTick] = useState(0);
  const [drawer, setDrawer] = useState<null | { t: 'i' | 'p'; id: string }>(null);
  const [cmp, setCmp] = useState(false);
  const [backup, setBackup] = useState(false);
  const [nav, setNav] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [trackTarget, setTrack] = useState<string | null>(null);
  const st = useStore();
  useEffect(() => { buildRegistry(); const r = () => { const h = location.hash.slice(1); const m = /^compare((?:-\d{1,2}){2,3})$/.exec(h);
    if (m) { const ids = m[1].slice(1).split('-').map((n) => INSURERS[+n]?.id).filter(Boolean); if (ids.length >= 2) { setState({ compare: ids.slice(0, 3) }); setView('insurers'); setDrawer(null); setNav(false); setCmp(true); return; } }
    setView(VIEWS.some((v) => v[0] === h) ? h : 'overview'); setDrawer(null); setCmp(false); setNav(false); window.scrollTo(0, 0); }; r(); addEventListener('hashchange', r); loadFin().then(() => setFinTick((t) => t + 1)); return () => removeEventListener('hashchange', r); }, []);
  const go = (v: string, s?: string) => { if (s) setSubs((x) => ({ ...x, [v]: s })); if (location.hash !== '#' + v) location.hash = '#' + v; else { setView(v); setDrawer(null); setCmp(false); } };
  const ctx: Ctx = { view, sub, go, setSub: (v, s) => setSubs((x) => ({ ...x, [v]: s })), openInsurer: (id) => setTimeout(() => setDrawer({ t: 'i', id }), 30), openProduct: (id) => setTimeout(() => setDrawer({ t: 'p', id }), 30), openCompare: () => setCmp(true), finTick, track: (fid) => { setTrack(fid); setDrawer(null); go('performance', 'tracker'); }, trackTarget };
  const V = { overview: Overview, classes: Classes, insurers: Directory, performance: Performance, claims: Claims, toolkit: Toolkit, sources: Sources }[view] || Overview;
  const disputed = RECON.filter((r) => r.status === 'DISPUTED' && !st.resolutions[r.id]).length;
  return <AppCtx.Provider value={ctx}>
    <div className={`grid min-h-screen ${collapsed ? 'lg:grid-cols-[68px_minmax(0,1fr)]' : 'lg:grid-cols-[250px_minmax(0,1fr)]'}`}>
      <nav aria-label="Main" className={`fixed inset-y-0 left-0 z-[60] lg:z-10 flex w-[270px] flex-col overflow-y-auto bg-navy-900 text-slate-300 transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0 ${nav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-white/10 px-4 py-4"><b className="block font-display text-[15px] leading-tight text-white">KE General Insurance{!collapsed && ' Intelligence'}</b>{!collapsed && <small className="text-xs text-slate-400">IRA · PCF regulatory &amp; financial intelligence</small>}</div>
        {VIEWS.map(([k, n, d]) => <a key={k} href={'#' + k} aria-current={view === k ? 'page' : undefined} className={`flex min-h-[44px] items-center gap-3 border-l-[3px] px-4 py-2.5 ${view === k ? 'border-emerald-400 bg-navy-800 text-white' : 'border-transparent hover:bg-navy-800'}`}>
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] flex-none" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden><path d={d} /></svg>{!collapsed && <span>{n}</span>}</a>)}
        {!collapsed && <div className="mt-auto border-t border-white/10 p-4 text-xs text-slate-400">Independent reference — not affiliated with IRA, AKI, PCF or any insurer. Not legal or financial advice. Last full source check: {CHECKED}.</div>}
      </nav>
      {nav && <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setNav(false)} />}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <button className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 lg:hidden dark:border-slate-700" aria-label="Open menu" onClick={() => setNav(true)}>☰</button>
          <button className="hidden h-11 w-11 place-items-center rounded-lg border border-slate-200 lg:grid dark:border-slate-700" aria-label="Collapse sidebar" onClick={() => setCollapsed(!collapsed)}>⇤</button>
          <Search />
          <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
            <a href="#sources" onClick={() => ctx.setSub('sources', 'register')}><Badge s="VERIFIED" label={`${SOURCES.filter((s) => s.status === 'VERIFIED').length} verified sources`} /></a>
            <a href="#performance" onClick={() => ctx.setSub('performance', 'recon')}><Badge s="DISPUTED" label={`${disputed} disputed`} /></a>
            {FIN.ready && <Badge s="REPORTED" label={'Data to ' + pLabel(FIN.P[FIN.P.length - 1], true)} />}
            <Btn small onClick={() => setBackup(true)}>Backup</Btn>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1280px] px-[clamp(14px,3vw,32px)] pb-16 pt-5"><MissingBanner /><V key={view + finTick} /></main>
      </div>
    </div>
    {drawer?.t === 'i' && <InsurerDrawer id={drawer.id} onClose={() => setDrawer(null)} />}
    {drawer?.t === 'p' && <ProductDrawer id={drawer.id} onClose={() => setDrawer(null)} />}
    {cmp && <CompareModal onClose={() => { setCmp(false); if (/^#compare-/.test(location.hash)) history.replaceState(null, '', '#insurers'); }} />}
    {backup && <BackupModal onClose={() => setBackup(false)} />}
    <Toaster />
  </AppCtx.Provider>;
}
