import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { FIN, INSURERS, mval, idxOf, val, fmt, pLabel, fyIdx, insurerRows } from '../lib/fin';
import { FEED, INSTITUTIONS, GLOSSARY, SRC } from '../data/reference.js';
import { Badge, Card, H2, Src, SrcLink, Info, inputCls } from '../components/ui';
import { PcfShield } from '../components/illustrations';
import { VerifyCard } from '../components/contacts';
import { useApp } from '../App';

/** Feed rule: an item renders only if it has a date and its source resolves to a URL. */
export const validFeed = () => FEED.filter((f) => /^\d{4}(-\d{2})?(-\d{2})?$/.test(f.date) && SRC[f.src] && /^https?:\/\//.test(SRC[f.src].url));

function Stat({ label, value, s, info }: any) {
  return <div className="min-w-0 rounded-xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur sm:p-3.5">
    <div className="flex items-center justify-between gap-2 text-[12.5px] text-sky-100/90"><span className="truncate">{label}</span>{info && <span className="text-slate-700"><Info>{info}</Info></span>}</div>
    <div className="mt-1 whitespace-nowrap font-display text-[clamp(19px,2vw,27px)] font-bold leading-none text-white">{value ?? '—'}</div>
    <div className="mt-2"><Badge s={value == null ? 'UNAVAILABLE' : s} /></div></div>;
}

export default function Overview() {
  const { go, setSub } = useApp();
  const [q, setQ] = useState(''); const [allFeed, setAllFeed] = useState(false); const [gloss, setGloss] = useState(false);
  const gi = INSURERS.filter((i) => i.general).length;
  const sm = INSURERS.filter((i) => i.status === 'STATMGMT');
  const ok = FIN.ready; const i25 = ok ? idxOf('2025 Q4') : -1, i24 = ok ? idxOf('2024 Q4') : -1;
  const g25 = ok ? mval('gpi', i25) : null, g24 = ok ? mval('gpi', i24) : null;
  const series = ok ? (() => { const out: any[] = []; for (let y = 2016; y <= 2025; y++) { const i = idxOf(`${y} Q4`); out.push({ y: String(y), v: i < 0 ? null : mval('gpi', i) / 1000 }); } return out; })() : [];
  const top = ok ? insurerRows().map((c) => ({ c, ms: val(c.id, 'ms', i25) })).filter((x) => x.ms.v != null).sort((a, b) => b.ms.v - a.ms.v).slice(0, 6) : [];
  const feed = validFeed(); const shown = allFeed ? feed : feed.slice(0, 5);
  const s = q.toLowerCase(); const gl = GLOSSARY.filter((g) => !s || (g.term + g.def + g.ex).toLowerCase().includes(s));
  return <>
    {/* Hero */}
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-[#0e4a7a] px-[clamp(18px,3vw,32px)] py-7 text-white">
      <svg aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 opacity-[.07]" viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z" fill="#fff" /></svg>
      <p className="text-sm text-sky-200">Kenya · general insurance · IRA &amp; PCF</p>
      <h1 className="mt-1 max-w-3xl font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-[1.08]">The general insurance market, sourced and checked.</h1>
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <Stat label="Licensed general insurers" value={gi} s="VERIFIED" info={<>IRA s.184 notice, 30 March 2026. <Src ids="S1" /></>} />
        <Stat label="Premium income, FY 2025" value={ok ? fmt(g25) : null} s="REPORTED" info={<>IRA Q4 2025 quarterly statistics (gross direct + inward). Annual statistics give 224.24 or 225.38 bn — disputed. <Src ids={['S19', 'S32']} /></>} />
        <Stat label="Growth vs FY 2024" value={ok ? '+' + ((g25 / g24 - 1) * 100).toFixed(1) + '%' : null} s="REPORTED" info="Same quarterly basis both years." />
        <Stat label="Underwriting result, FY 2025" value={ok ? fmt(mval('uw', i25)) : null} s="REPORTED" info={<>Matches the −KSh 7bn reported from IRA annual statistics. <Src ids={['S19', 'S6']} /></>} />
      </div>
    </section>

    {/* Alert */}
    <button onClick={() => go('insurers')} className="mt-4 flex w-full items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm hover:border-red-300 dark:border-red-900 dark:bg-red-950/30">
      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-red-600 font-bold text-white">!</span>
      <span className="min-w-0"><b>{sm.length} insurers under statutory management</b> <span className="text-slate-600 dark:text-slate-400">— {sm.map((x) => x.trading).join(', ')}. Latest effective 10 Mar 2026 (notice) / 11 Mar 2026 (PCF control).</span></span>
      <span className="ml-auto flex-none text-red-700">View →</span></button>

    {/* Market at a glance */}
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Card>
        <div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Premium income, 2016–2025</h2><Badge s="REPORTED" /></div>
        <div className="mt-2 h-[240px]">{ok ? <ResponsiveContainer><AreaChart data={series} margin={{ left: -8, right: 8, top: 8 }}><defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1d4ed8" stopOpacity={0.35} /><stop offset="1" stopColor="#1d4ed8" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#e2e8f0" /><XAxis dataKey="y" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} /><YAxis tickLine={false} axisLine={false} tickFormatter={(v) => v + 'bn'} tick={{ fontSize: 12 }} width={52} />
          <Tooltip formatter={(v: any) => (v == null ? 'no data' : 'KSh ' + v.toFixed(1) + ' bn')} /><Area type="monotone" dataKey="v" stroke="#1d4ed8" strokeWidth={2.5} fill="url(#gArea)" connectNulls={false} dot={{ r: 3 }} isAnimationActive={false} /></AreaChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-slate-400">Loading…</div>}</div>
        <div className="flex items-center justify-between text-[11.5px] text-slate-400"><span>2017 gap: no IRA Q4 2017 workbook</span><button className="text-sky-700 hover:underline" onClick={() => go('performance', 'industry')}>Industry detail →</button></div>
      </Card>
      <Card>
        <div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Largest by share, FY 2025</h2><Info>Share of IRA gross premium income, same table and period. Size only — not strength or service.</Info></div>
        <ol className="mt-3 grid gap-2.5">{top.map((x, k) => <li key={x.c.id} className="grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 text-sm">
          <span className="text-slate-400">{k + 1}</span><div className="min-w-0"><div className="truncate">{x.c.name.replace(/ \(formerly.*\)/, '')}</div><div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800"><i className="block h-full rounded-full bg-navy-800" style={{ width: (x.ms.v / top[0].ms.v) * 100 + '%' }} /></div></div><b className="tabular-nums">{fmt(x.ms.v, 'pct')}</b></li>)}</ol>
        <button className="mt-3 text-[13px] text-sky-700 hover:underline" onClick={() => go('performance', 'share')}>Full market share →</button>
      </Card>
    </div>

    {/* Feed + protection */}
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Latest</h2><Info>Only dated items with an identifiable source appear. Nothing is generated.</Info></div>
        <ol className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">{shown.map((f, i) => <li key={i} className="grid grid-cols-[78px_minmax(0,1fr)] gap-3 py-2.5">
          <time className="pt-0.5 text-[12px] font-semibold tabular-nums text-slate-400">{f.date}</time>
          <div className="min-w-0"><div className="flex items-start justify-between gap-2"><b className="text-[14px] leading-snug">{f.title}</b><Badge s={f.status} /></div><div className="mt-0.5 text-[11.5px] text-slate-400">{f.cat} · <SrcLink id={f.src} short /></div></div></li>)}</ol>
        {feed.length > 5 && <button className="mt-1 text-[13px] text-sky-700 hover:underline" onClick={() => setAllFeed(!allFeed)}>{allFeed ? 'Show fewer' : `Show all ${feed.length}`}</button>}
      </Card>
      <Card><div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">If an insurer fails</h2><Info><Src ids={['S22', 'S2', 'S17']} /></Info></div><PcfShield /></Card>
    </div>

    <div className="mt-4"><VerifyCard /></div>

    {/* Institutions */}
    <H2>Who does what</H2>
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))]">{INSTITUTIONS.map((x) => <Card key={x.name} className="!p-3.5">
      <div className="text-[12px] font-medium text-sky-700 dark:text-sky-400">{x.kind}</div>
      <div className="mt-0.5 flex items-start justify-between gap-2"><h3 className="font-display font-semibold leading-snug">{x.name}</h3><Info><p>{x.mandate}</p>{x.contact && <p className="mt-2"><b>Contact:</b> {x.contact}</p>}<Src ids={x.src} /></Info></div>
      <p className="mt-1 text-[13px] text-slate-500">{x.resp[0]}</p>
      {x.url && <a className="mt-2 inline-block text-[13px] text-sky-700 hover:underline" href={x.url} target="_blank" rel="noopener">{x.url.replace('https://', '').replace(/\/$/, '')} ↗</a>}</Card>)}</div>

    {/* Glossary */}
    <div className="mt-8 flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-xl font-semibold">Glossary</h2>
      <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setGloss(true); }} placeholder={`Search ${GLOSSARY.length} terms…`} aria-label="Search glossary" className={inputCls + ' w-full sm:w-72'} /></div>
    <div className="mt-3 grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">{(gloss || q ? gl : gl.slice(0, 6)).map((g) => <details key={g.term} className="group rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-900"><summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">{g.term}<span className="text-slate-400 transition group-open:rotate-45">+</span></summary><p className="mt-1.5 text-sm">{g.def}</p><p className="mt-1 text-[13px] text-slate-500">e.g. {g.ex}</p></details>)}</div>
    {!gloss && !q && <button className="mt-2 text-[13px] text-sky-700 hover:underline" onClick={() => setGloss(true)}>Show all {GLOSSARY.length} terms</button>}
  </>;
}
