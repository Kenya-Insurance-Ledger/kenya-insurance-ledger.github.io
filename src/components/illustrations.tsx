// Hand-drawn SVG infographics. Every label carries the fact it depicts; statuses match the data layer.
import React from 'react';

const T = 'fill-slate-800 dark:fill-slate-100';
const M = 'fill-slate-500 dark:fill-slate-400';

/** PCF protection: limit increase + statutory-management workflow. */
export function PcfShield() {
  const steps = ['IRA places insurer under statutory management (s.67C(2)(i))', 'PCF appointed statutory manager; no new contracts', 'Moratorium on claim payments (6 months reported, Mar 2026)', 'Claimant lodges claim with PCF', 'PCF pays up to the per-claim limit (s.179)'];
  return <svg viewBox="0 0 760 300" className="h-auto w-full" role="img" aria-labelledby="pcfT pcfD">
    <title id="pcfT">PCF compensation limit and statutory management workflow</title>
    <desc id="pcfD">Maximum compensation per claim rose from KSh 250,000 to KSh 500,000 on 1 January 2026. Steps: IRA places insurer under statutory management, PCF appointed, moratorium, claim lodged, PCF pays up to the limit.</desc>
    <defs><linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1c3a6b" /><stop offset="1" stopColor="#0b1f3f" /></linearGradient></defs>
    <path d="M140 22 L232 52 V140 C232 205 190 246 140 270 C90 246 48 205 48 140 V52 Z" fill="url(#sh)" />
    <path d="M140 22 L232 52 V140 C232 205 190 246 140 270 Z" fill="#ffffff" opacity=".07" />
    <text x="140" y="92" textAnchor="middle" className="fill-sky-200 text-[13px]">Max per claim</text>
    <text x="140" y="118" textAnchor="middle" className="fill-slate-300 text-[15px]" textDecoration="line-through">KSh 250,000</text>
    <text x="140" y="138" textAnchor="middle" className="fill-sky-200 text-[13px]">↓ doubled</text>
    <text x="140" y="172" textAnchor="middle" className="fill-white font-display text-[28px] font-bold">KSh 500,000</text>
    <text x="140" y="196" textAnchor="middle" className="fill-sky-200 text-[13px]">from 1 January 2026</text>
    <rect x="96" y="210" width="88" height="22" rx="11" className="fill-emerald-500" /><text x="140" y="225" textAnchor="middle" className="fill-white text-[11px] font-semibold">VERIFIED · PCF</text>
    {steps.map((s, i) => { const y = 34 + i * 52; return <g key={i}>
      <circle cx="292" cy={y + 12} r="14" className="fill-sky-700" /><text x="292" y={y + 17} textAnchor="middle" className="fill-white text-[13px] font-bold">{i + 1}</text>
      {i < steps.length - 1 && <line x1="292" y1={y + 27} x2="292" y2={y + 50} className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" />}
      <text x="316" y={y + 17} className={`${T} text-[14px]`}>{s}</text></g>; })}
  </svg>;
}

/** Corporate lineage: names that point to the same legal entity vs a separate historical entity. */
export function LineageFlow() {
  const node = (x, y, w, label, sub, tone) => <g>
    <rect x={x} y={y} width={w} height="54" rx="10" className={tone === 'cur' ? 'fill-navy-900' : tone === 'hist' ? 'fill-slate-200 dark:fill-slate-700' : 'fill-white stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600'} strokeWidth="1.5" />
    <text x={x + w / 2} y={y + 23} textAnchor="middle" className={`text-[13px] font-semibold ${tone === 'cur' ? 'fill-white' : T}`}>{label}</text>
    <text x={x + w / 2} y={y + 41} textAnchor="middle" className={`text-[11px] ${tone === 'cur' ? 'fill-sky-200' : M}`}>{sub}</text></g>;
  const tag = (x, y, s) => <g><rect x={x} y={y} width={s === 'VERIFIED' ? 70 : 74} height="20" rx="10" className={s === 'VERIFIED' ? 'fill-emerald-500' : 'fill-sky-600'} /><text x={x + (s === 'VERIFIED' ? 35 : 37)} y={y + 14} textAnchor="middle" className="fill-white text-[10.5px] font-semibold">{s}</text></g>;
  const arrow = (x1, y1, x2, y2, dashed = false) => <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-slate-400" strokeWidth="2" strokeDasharray={dashed ? '6 5' : undefined} markerEnd="url(#ah)" />;
  return <svg viewBox="0 0 760 330" className="h-auto w-full" role="img" aria-labelledby="linT linD">
    <title id="linT">Corporate lineage of selected general insurers</title>
    <desc id="linD">UAP Insurance became Old Mutual General (reported). Jubilee General became Jubilee Allianz, now listed by IRA as Sanlam Allianz General (reported, no renaming notice). Allianz Insurance Company of Kenya merged into Jubilee Allianz in 2022 and is kept as a separate historical entity; Sanlam General transferred its book in 2025.</desc>
    <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" className="fill-slate-400" /></marker></defs>
    {node(20, 20, 200, 'UAP Insurance', '“UAP Old Mutual” brand', 'old')}
    {arrow(222, 47, 486, 47)}
    {tag(300, 22, 'REPORTED')}<text x="380" y="66" textAnchor="middle" className={`${M} text-[11px]`}>rebrand 17 May 2022</text>
    {node(490, 20, 250, 'Old Mutual General', 'Old Mutual General Insurance Kenya Ltd', 'cur')}
    {node(20, 130, 200, 'Jubilee General', 'Jubilee Allianz from 2021–22', 'old')}
    {arrow(222, 157, 486, 157)}
    {tag(300, 132, 'REPORTED')}<text x="380" y="176" textAnchor="middle" className={`${M} text-[11px]`}>IRA lists new name from Q4 2025</text>
    {node(490, 130, 250, 'Sanlam Allianz General', 'Sanlam Allianz General Insurance (K) Ltd', 'cur')}
    {node(20, 240, 200, 'Allianz Insurance Co. of Kenya', 'separate legal entity', 'hist')}
    {arrow(222, 262, 486, 172, true)}
    {tag(300, 214, 'VERIFIED')}<text x="300" y="250" className={`${M} text-[11px]`}>merged business, Oct 2022 (Allianz SE)</text>
    {node(490, 250, 250, 'Sanlam General Insurance', 'book transferred Sep–Oct 2025 · historical', 'hist')}
    {arrow(615, 250, 615, 186, true)}
  </svg>;
}

/** Data pipeline: every path into the live portal passes the checker and the audit log. */
export function PipelineStepper() {
  const boxes: [string, string, string][] = [['GitHub reconstructed panel', 'IRA quarterly workbooks, 52 companies', 'sky'], ['IRA PDF step-by-step extractor', 'text layer → rows → review', 'sky'], ['Human / rule checker', 'units · periods · names · duplicates · sources', 'amber'], ['Superseded history log', 'nothing overwritten silently', 'slate'], ['Live portal', 'badged VERIFIED / REPORTED / DISPUTED', 'emerald']];
  const fill = { sky: 'fill-sky-50 stroke-sky-500 dark:fill-sky-950', amber: 'fill-amber-50 stroke-amber-500 dark:fill-amber-950', slate: 'fill-slate-50 stroke-slate-400 dark:fill-slate-800', emerald: 'fill-emerald-50 stroke-emerald-600 dark:fill-emerald-950' };
  const pos = [[10, 20], [10, 112], [262, 66], [490, 20], [490, 112]];
  return <svg viewBox="0 0 760 196" className="h-auto w-full" role="img" aria-labelledby="pipT"><title id="pipT">Data pipeline: reconstructed panel and PDF extractor feed a checker, then the superseded history log, then the live portal</title>
    <defs><marker id="ah2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" className="fill-slate-400" /></marker></defs>
    {[[232, 47, 258, 82], [232, 139, 258, 104], [484, 82, 488, 52], [612, 76, 612, 108]].map(([a, b, c, d], i) => <line key={i} x1={a} y1={b} x2={c} y2={d} className="stroke-slate-400" strokeWidth="2" markerEnd="url(#ah2)" />)}
    {boxes.map(([t, s, c], i) => { const [x, y] = pos[i]; return <g key={i}><rect x={x} y={y} width="222" height="56" rx="10" className={fill[c]} strokeWidth="1.5" />
      <text x={x + 14} y={y + 24} className={`${T} text-[13px] font-semibold`}>{i + 1}. {t}</text><text x={x + 14} y={y + 42} className={`${M} text-[11px]`}>{s}</text></g>; })}
  </svg>;
}
