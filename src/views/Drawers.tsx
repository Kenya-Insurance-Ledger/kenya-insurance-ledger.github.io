import React, { useMemo, useState } from 'react';
import { FIN, INSURERS, MET, val, idxOf, fyIdx, fmt, pLabel, insById, insurerRows, pParse } from '../lib/fin';
import { CLS, PRODUCTS, LEGAL, CHECKED } from '../data/reference.js';
import { Badge, Drawer, Modal, Src, SrcLink, Table, Num, Tabs, Note, Unav, Btn, Field, inputCls, toast } from '../components/ui';
import { InsBadge } from './Directory';
import { useStore } from '../lib/store';
import { useApp } from '../App';
import { ContactCard, CFIELDS } from '../components/contacts';

const PAL = ['#1d4ed8', '#d97706', '#059669'];

export function InsurerDrawer({ id, onClose }) {
  const { track } = useApp(); const st = useStore();
  const i = insById(id); if (!i) return null;
  const c = i.fid && FIN.comp[i.fid];
  const hist = FIN.ready && c ? fyIdx().map(([p, ix]) => ({ p, g: val(i.fid, 'gpi', ix), u: val(i.fid, 'uw', ix), cr: val(i.fid, 'cr', ix), pat: val(i.fid, 'pat', ix), ms: val(i.fid, 'ms', ix) })).filter((r) => r.g.v != null || r.u.v != null) : [];
  const imp = st.imported.filter((r) => r.entity === i.legal);
  const field = (label, s) => <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 text-xs dark:border-slate-700">{label}: <Badge s={s} label={s === 'UNAVAILABLE' ? 'unavailable' : s} /></span>;
  return <Drawer title={i.trading} onClose={onClose}>
    <p className="text-sm text-slate-500">{i.legal}</p>
    <dl className="mt-2 grid gap-x-3 gap-y-2 text-sm sm:grid-cols-[170px_minmax(0,1fr)]">
      <dt className="text-slate-500">Status</dt><dd><InsBadge i={i} /></dd>
      <dt className="text-slate-500">Category</dt><dd>{i.category}</dd>
      <dt className="text-slate-500">Former / other names</dt><dd>{i.aliases.length ? i.aliases.map((a) => <div key={a.name}>{a.name} <span className="text-slate-500">({a.kind})</span> <Badge s={a.status} label={a.status === 'VERIFIED' ? 'link verified' : 'link reported'} /><div className="text-xs text-slate-500">{a.note} <SrcLink id={a.src} /></div></div>) : 'None recorded'}</dd>
      <dt className="text-slate-500">Names printed by IRA</dt><dd>{i.irasNames.join('; ') || '—'}</dd>
      <dt className="text-slate-500">Authorised classes</dt><dd className="flex flex-wrap gap-1">{i.classes.length ? i.classes.map((k) => <span key={k} title={CLS[k].legal} className="rounded border border-slate-200 px-1.5 text-xs dark:border-slate-700">{k} {CLS[k].legal}</span>) : <Unav />}</dd>
      <dt className="text-slate-500">Licence</dt><dd>{i.status === 'ACTIVE' ? 'Listed in the IRA s.184 notice dated 30 March 2026. Individual effective date not stated.' : <Unav />}</dd>
      <dt className="text-slate-500">Company registration</dt><dd><Unav /></dd>
      {i.note && <><dt className="text-slate-500">Notes</dt><dd>{i.note}</dd></>}
    </dl>
    {i.history.length > 0 && <><h3 className="mt-4 font-semibold">Ownership &amp; listing history</h3><ul className="list-disc pl-5 text-sm">{i.history.map((h, k) => <li key={k}>{h.text}{h.url && <> — <a className="text-sky-700 underline" href={h.url} target="_blank" rel="noopener">evidence</a></>}</li>)}</ul><Src ids={['S19']} /></>}
    <h3 className="mt-4 font-semibold">Verification by field</h3>
    <div className="flex flex-wrap gap-1.5">{field('Licence status', 'VERIFIED')}{hist.slice(-2).map((r) => <React.Fragment key={r.p}>{field('GWP ' + pLabel(r.p, true), r.g.status)}</React.Fragment>)}{c && field('Market share Q1 2025', val(i.fid, 'ms', idxOf('2025 Q1')).status)}{field('Customer care', (i.contacts.find((k) => /Customer care phone/.test(k.type)) || { status: 'PENDING' }).status)}{field('Claims settlement ratio', 'UNAVAILABLE')}{field('Capital adequacy', 'UNAVAILABLE')}</div>
    <h3 className="mt-4 font-semibold">Customer contacts</h3>
    <ContactCard i={i} />
    {i.contacts.filter((k) => !CFIELDS.some(([, , re]) => re.test(k.type))).length > 0 && <details className="mt-2 text-sm"><summary className="cursor-pointer text-slate-600">Other channels ({i.contacts.filter((k) => !CFIELDS.some(([, , re]) => re.test(k.type))).length})</summary><ul className="mt-1 grid gap-1">{i.contacts.filter((k) => !CFIELDS.some(([, , re]) => re.test(k.type))).map((k, n) => <li key={n}><span className="text-slate-500">{k.type}:</span> {k.value} <Badge s={k.status} /> <a className="text-xs text-sky-700 underline" href={k.url} target="_blank" rel="noopener">source</a></li>)}</ul></details>}
    <h3 className="mt-4 font-semibold">Historical reporting (full years)</h3>
    {hist.length ? <><Table><thead><tr><th>Period</th><th className="!text-right">GWP</th><th className="!text-right">Share</th><th className="!text-right">UW result</th><th className="!text-right">Combined*</th><th className="!text-right">Profit after tax</th><th>Status</th></tr></thead><tbody>{hist.map((r) => <tr key={r.p}><td>{pLabel(r.p, true)}</td><Num>{fmt(r.g.v)}</Num><Num>{fmt(r.ms.v, 'pct')}</Num><Num>{fmt(r.u.v)}</Num><Num>{fmt(r.cr.v, 'pct')}</Num><Num>{fmt(r.pat.v)}</Num><td><Badge s={r.g.status} /></td></tr>)}</tbody></Table>
      <p className="mt-1 text-xs text-slate-500">*Calculated from IRA revenue-account lines. Quarterly returns, year to date, unaudited.</p><Btn small onClick={() => track(i.fid)}>Open in historical tracker</Btn></> : <p className="text-sm text-slate-500">Pending IRA report verification.</p>}
    {c?.flags?.length > 0 && <details className="mt-3"><summary className="cursor-pointer font-semibold">Return-quality flags ({c.flags.length})</summary><ul className="list-disc pl-5 text-sm">{c.flags.map((fl, k) => <li key={k}>{fl.period} · <Badge s={fl.severity === 'error' ? 'DISPUTED' : 'PENDING'} label={fl.severity} /> {fl.detail}</li>)}</ul></details>}
    {imp.length > 0 && <><h3 className="mt-4 font-semibold">Imported records</h3><ul className="list-disc pl-5 text-sm">{imp.map((r) => <li key={r.id}>{r.period} · {r.metric}: {fmt(r.valueM, r.unit === 'pct' ? 'pct' : 'm')} <Badge s={r.status} /></li>)}</ul></>}
    <Src ids={i.src} />
  </Drawer>;
}

export function ProductDrawer({ id, onClose }) {
  const { openInsurer } = useApp();
  const p = PRODUCTS.find((x) => x.id === id); if (!p) return null;
  const L = (t, a) => <section className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800"><h4 className="font-semibold">{t}</h4><ul className="list-disc pl-5 text-sm">{a.map((x) => <li key={x}>{x}</li>)}</ul></section>;
  return <Drawer title={p.name} onClose={onClose}>
    <div className="flex flex-wrap gap-1">{p.codes.map((c) => <span key={c} className="rounded border border-slate-200 px-1.5 text-xs dark:border-slate-700">{c} {CLS[c].legal}</span>)}<span className="rounded border border-slate-200 px-1.5 text-xs dark:border-slate-700">{p.compulsory}</span></div>
    <Note tone="info">Typical market practice — not universal policy terms. Coverage depends on the insurer's wording and schedule.</Note>
    <p className="text-sm">{p.over}</p>
    {L('What it typically covers', p.covers)}{L('What it typically does not cover', p.not)}{L('Target customers', p.target)}{L('Common extensions', p.ext)}{L('Common exclusions', p.excl)}
    <section className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800"><h4 className="font-semibold">Excess / deductible</h4><p className="text-sm">{p.excess}</p></section>
    {L('Information for a quotation', p.quote)}{L('Documents to purchase', p.buy)}{L('Documents to claim', p.claim)}
    <section className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800"><h4 className="font-semibold">Claims process</h4><p className="text-sm">{p.proc}</p></section>
    <section className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800"><h4 className="font-semibold">Relevant legislation</h4>{p.legal.map((l) => { const r = LEGAL.find((x) => x.id === l); return r && <p key={l} className="text-sm"><b>{r.act} {r.sec}</b> — {r.subject} <Badge s={r.status} /><br /><span className="text-slate-500">{r.plain}</span></p>; })}</section>
    {L('Consumer considerations', p.consider)}
    <section className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800"><h4 className="font-semibold">Licensed for {p.codes.join(' + ')}</h4><p className="text-sm">{INSURERS.filter((i) => i.status === 'ACTIVE' && i.category !== 'Reinsurer' && p.codes.every((c) => i.classes.includes(c))).map((i, k) => <React.Fragment key={i.id}>{k > 0 && ', '}<button className="text-sky-700 underline" onClick={() => openInsurer(i.id)}>{i.trading}</button></React.Fragment>)}</p><Src ids="S1" /></section>
  </Drawer>;
}

/** Percentile position of each selected insurer on five calculated measures, among comparable insurers. */
function radarData(sel, per: string) {
  const i = idxOf(per); const { y, q } = pParse(per); const j = idxOf(`${y - 1} Q${q}`);
  const pool = insurerRows().filter((c) => { const n = c.s.nep[i]; const r = val(c.id, 'gpi', i); return r.v != null && r.status !== 'DISPUTED' && n != null && n >= 50; });
  const growth = (cid) => { const a = val(cid, 'gpi', i).v, b = j >= 0 ? val(cid, 'gpi', j).v : null; return a == null || !b ? null : (a / b - 1) * 100; };
  const axes: [string, (cid: string) => number | null][] = [['Market share', (cid) => val(cid, 'ms', i).v], ['Premium growth (YoY)', growth], ['Loss ratio', (cid) => val(cid, 'lr', i).v], ['Expense ratio', (cid) => val(cid, 'er', i).v], ['Combined ratio', (cid) => val(cid, 'cr', i).v]];
  const rows = axes.map(([name, fn]) => {
    const vals = pool.map((c) => fn(c.id)).filter((v) => v != null) as number[];
    const row: any = { axis: name, n: vals.length };
    sel.forEach((s) => { const v = s.fid ? fn(s.fid) : null; row[s.trading] = v == null || !pool.some((c) => c.id === s.fid) ? null : Math.round((vals.filter((x) => x < v).length / Math.max(1, vals.length - 1)) * 100); row[s.trading + '__raw'] = v; });
    return row;
  });
  return { rows, n: pool.length };
}


/** Deterministic SVG radar: radius = percentile (0–100). Missing values are omitted, never set to zero. */
function RadarSvg({ rows, sel }) {
  const W = 640, H = 360, cx = W / 2, cy = 175, R = 130, n = rows.length;
  const pt = (k, v) => { const a = -Math.PI / 2 + (2 * Math.PI * k) / n; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; };
  return <div data-rows={JSON.stringify(rows)}><svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-[560px]" role="img" aria-label="Radar of percentile positions">
    {[25, 50, 75, 100].map((g) => <polygon key={g} points={rows.map((_, k) => pt(k, g).join(',')).join(' ')} fill="none" className="stroke-slate-200 dark:stroke-slate-700" />)}
    {rows.map((r, k) => { const [x, y] = pt(k, 100); const [lx, ly] = pt(k, 118); return <g key={k}><line x1={cx} y1={cy} x2={x} y2={y} className="stroke-slate-200 dark:stroke-slate-700" /><text x={lx} y={ly} textAnchor={Math.abs(lx - cx) < 10 ? 'middle' : lx > cx ? 'start' : 'end'} dominantBaseline="middle" className="fill-slate-600 text-[12px] dark:fill-slate-300">{r.axis}</text></g>; })}
    {[50, 100].map((g) => <text key={g} x={cx + 4} y={cy - (R * g) / 100 + 10} className="fill-slate-400 text-[10px]">P{g}</text>)}
    {sel.map((s, si) => { const pts = rows.map((r, k) => (r[s.trading] == null ? null : pt(k, r[s.trading]))); const full = pts.every(Boolean);
      return <g key={s.id}>{full && <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={PAL[si]} fillOpacity={0.12} stroke={PAL[si]} strokeWidth={2} />}
        {pts.map((p, k) => p && <circle key={k} cx={p[0]} cy={p[1]} r={4} fill={PAL[si]}><title>{s.trading} · {rows[k].axis}: P{rows[k][s.trading]}</title></circle>)}</g>; })}
  </svg><div className="flex flex-wrap justify-center gap-4 text-sm">{sel.map((s, si) => <span key={s.id}><i className="mr-1.5 inline-block h-3 w-3 rounded-sm align-[-1px]" style={{ background: PAL[si] }} />{s.trading}</span>)}</div></div>;
}

export function CompareModal({ onClose }) {
  const st = useStore();
  const sel = st.compare.map(insById).filter(Boolean);
  const [tab, setTab] = useState('fin');
  const fys = FIN.ready ? fyIdx().map(([p]) => p).reverse() : [];
  const [per, setPer] = useState('2025 Q4');
  const ix = FIN.ready ? idxOf(per) : -1;
  const rd = useMemo(() => (FIN.ready ? radarData(sel, per) : null), [per, st.compare.join()]);
  const cell = (i, k) => {
    if (MET[k].kind === 'unavailable') { const im = st.imported.find((r) => r.entity === i.legal && r.mkey === k && r.period === per); return im ? <>{fmt(im.valueM, MET[k].unit)} <Badge s={im.status} /></> : <span className="text-[13px] italic text-slate-500">Not available</span>; }
    if (!i.fid || !FIN.ready) return <span className="text-[13px] italic text-slate-500">Not available</span>;
    const r = val(i.fid, k, ix); return r.v == null ? <span title={r.reason} className="text-[13px] italic text-slate-500">Not available</span> : <>{fmt(r.v, MET[k].unit)} <Badge s={r.status} />{r.calc && <span className="text-xs text-slate-500"> calc.</span>}</>;
  };
  const ct = (i, re) => { const k = i.contacts.filter((x) => re.test(x.type)); return k.length ? k.map((x, n) => <div key={n}>{x.value} <Badge s={x.status} /></div>) : <Badge s="PENDING" label="pending verification" />; };
  const prods = (i) => PRODUCTS.filter((p) => p.codes.every((c) => i.classes.includes(c))).map((p) => p.name).join(', ') || '—';
  const yrs = (i) => (!i.fid || !FIN.ready ? 0 : fyIdx().filter(([, k]) => val(i.fid, 'gpi', k).v != null).length);
  let rows: [string, (i: any) => React.ReactNode][] = [];
  if (tab === 'fin') rows = ['gpi', 'ms', 'uw', 'lr', 'cr', 'clm', 'cpaid', 'pat', 'pbt'].map((k) => [MET[k].label + (MET[k].kind === 'calculated' ? ' (calculated)' : ''), (i) => cell(i, k)]);
  if (tab === 'biz') rows = [['Status', (i) => <InsBadge i={i} />], ['Authorised classes', (i) => (i.classes.length ? `${i.classes.length}: ${i.classes.join(', ')}` : '—')], ['Product categories (by licensed classes)', prods], ['Years of full-year data', (i) => `${yrs(i)} of ${fyIdx().length}`], ['Former names', (i) => i.aliases.map((a) => a.name).join('; ') || '—']];
  const shareHash = '#compare-' + sel.map((s) => INSURERS.indexOf(s)).join('-');
  const share = () => { try { history.replaceState(null, '', shareHash); } catch { /* sandbox */ } const url = location.href.split('#')[0] + shareHash; navigator.clipboard.writeText(url).then(() => toast('Link copied — opens this comparison'), () => toast('Copy blocked — link: ' + shareHash)); };
  return <Modal title="Compare insurers" onClose={onClose}>
    <div className="mb-3 grid gap-2 sm:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]" style={{ ['--n' as any]: sel.length }} data-testid="cmp-heads">{sel.map((i, si) => <div key={i.id} className="min-w-0 rounded-xl border border-slate-200 p-2.5 dark:border-slate-700" style={{ borderTopColor: PAL[si], borderTopWidth: 3 }}>
      <div className="flex items-start justify-between gap-1"><b className="truncate">{i.trading}</b><InsBadge i={i} /></div>
      <div className="mt-1.5 flex flex-wrap gap-1" data-testid="cmp-classes">{i.classes.length ? i.classes.map((k) => <span key={k} title={CLS[k].legal} className="rounded bg-slate-100 px-1.5 text-[11px] tabular-nums dark:bg-slate-800">{k}</span>) : <span className="text-xs text-slate-500">No classes recorded</span>}</div></div>)}</div>
    <div className="flex flex-wrap items-center justify-between gap-2"><Tabs items={[['fin', 'Financial'], ['radar', 'Radar profile'], ['biz', 'Business profile'], ['con', 'Contacts']]} value={tab} onChange={setTab} /><Btn small onClick={share} data-testid="cmp-share">Copy share link</Btn></div>
    {(tab === 'fin' || tab === 'radar') && <div className="mb-3 max-w-xs"><Field label="Reporting period"><select className={inputCls} value={per} onChange={(e) => setPer(e.target.value)}>{fys.map((p) => <option key={p} value={p}>{pLabel(p)}</option>)}</select></Field></div>}
    {tab === 'radar' ? (rd && <>
      <RadarSvg rows={rd.rows} sel={sel} />
      <Table><thead><tr><th>Measure (calculated)</th>{sel.map((s) => <th key={s.id} className="!text-right">{s.trading}</th>)}</tr></thead><tbody>{rd.rows.map((r) => <tr key={r.axis}><td>{r.axis}</td>{sel.map((s) => <Num key={s.id}>{r[s.trading + '__raw'] == null ? '—' : `${fmt(r[s.trading + '__raw'], 'pct')} · P${r[s.trading] ?? '—'}`}</Num>)}</tr>)}</tbody></Table>
      <Note tone="info">Each axis shows the insurer's percentile position (0 = lowest value, 100 = highest) among {rd.n} insurers with non-disputed {pLabel(per, true)} data and net earned premium ≥ KSh 50m. It is a position, not a score: a high loss ratio can reflect generous claims payment or under-pricing. Insurers without comparable data are left off the chart.</Note>
    </>) : tab === 'con' ? <>
      <div className="grid gap-3 sm:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]" style={{ ['--n' as any]: sel.length }} data-testid="cmp-contacts">{sel.map((i) => <div key={i.id} className="min-w-0"><div className="mb-1 truncate text-sm font-semibold">{i.trading}</div><ContactCard i={i} compact /></div>)}</div>
      <p className="mt-2 text-sm">Complaints to the regulator: IRA complaints@ira.go.ke · 0800 724 499 <Badge s="VERIFIED" /> <SrcLink id="S16" short /></p>
    </> : <Table><thead><tr><th>Attribute</th>{sel.map((i) => <th key={i.id}>{i.trading}</th>)}</tr></thead><tbody>{rows.map(([l, fn]) => <tr key={l}><td className="font-semibold">{l}</td>{sel.map((i) => <td key={i.id}>{fn(i)}</td>)}</tr>)}</tbody></Table>}
    <Note tone="info">No rating, reliability score or claims-settlement ranking is produced — there is no defensible source for one. Financial rows compare the same IRA table and period only.</Note>
    <Src ids={['S1', 'S19', 'S33']} />
  </Modal>;
}
