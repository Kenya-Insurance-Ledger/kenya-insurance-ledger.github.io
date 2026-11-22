import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, Cell, Treemap, ReferenceLine, LabelList } from 'recharts';
import { FIN, INSURERS, MET, val, mval, idxOf, fyIdx, fmt, pLabel, insurerRows, sourceForPeriod, insById, VERIFIED_MARKET } from '../lib/fin';
import { RECON, SRC } from '../data/reference.js';
import { Badge, Card, Kpi, H1, H2, Lead, Note, Src, SrcLink, Table, Num, Tabs, Btn, Field, Info, inputCls, toast } from '../components/ui';
import { useStore, setState, log } from '../lib/store';
import { useApp } from '../App';

const PAL = ['#1d4ed8', '#d97706', '#059669', '#be123c', '#0891b2', '#64748b'];
const axisTick = (unit) => (v) => (unit === 'pct' ? Math.round(v) + '%' : Math.abs(v) >= 1000 ? (v / 1000).toFixed(Math.abs(v) >= 10000 ? 0 : 1) + 'bn' : Math.round(v) + 'm');
const tipFmt = (unit) => (v) => (v == null ? 'no value' : fmt(v as number, unit));

export default function Performance() {
  const { sub, setSub } = useApp();
  const t = sub.performance || 'industry';
  const Body = { industry: Industry, tracker: Tracker, rankings: Rankings, share: Share, recon: Recon }[t] || Industry;
  return <>
    
    <H1>Performance</H1>
    <div className="flex items-center gap-2"><Lead>IRA quarterly statistics, 2016 – Q1 2026.</Lead><Info>From IRA's quarterly workbooks (year to date, unaudited) via Marion Peter's reconstructed panel. REPORTED by default; VERIFIED where matched to an IRA PDF; DISPUTED where IRA flagged the return. <Src ids={['S19', 'S18']} /></Info></div>
    <Tabs items={[['industry', 'Industry'], ['tracker', 'Historical tracker'], ['rankings', 'Rankings'], ['share', 'Market share'], ['recon', 'Reconciliation & audit']]} value={t} onChange={(k) => setSub('performance', k)} />
    {!FIN.ready && t !== 'recon' ? <Card>{FIN.error ? 'Financial dataset could not be loaded: ' + FIN.error : 'Loading IRA financial dataset…'}</Card> : <Body />}
  </>;
}

function Industry() {
  const i25 = idxOf('2025 Q4');
  const years = fyIdx().map(([p, i]) => ({ y: p.slice(0, 4), gpi: mval('gpi', i), uw: mval('uw', i), inv: mval('inv', i) }));
  const full: any[] = []; for (let y = 2016; y <= 2025; y++) full.push(years.find((r) => r.y === String(y)) || { y: String(y), gpi: null, uw: null, inv: null });
  const cls = FIN.mc['2025'] ? Object.entries(FIN.mc['2025'].gross_premium).sort((a: any, b: any) => b[1] - a[1]).map(([n, v]) => ({ n: n === 'Motor Commercial PSV' ? '08 ↳ PSV sub-line' : n, v })) : [];
  return <>
    <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))]">
      <Kpi label="Premium income, FY 2025" value={fmt(mval('gpi', i25))} s="REPORTED" />
      <Kpi label="Loss ratio (calc.)" value={fmt(mval('lr', i25), 'pct')} s="REPORTED" />
      <Kpi label="Combined ratio (calc.)" value={fmt(mval('cr', i25), 'pct')} s="REPORTED" />
      <Kpi label="Investment income" value={fmt(mval('inv', i25))} s="REPORTED" /></div>
    <H2>Premium income, full years</H2>
    <Card><div className="h-[300px]"><ResponsiveContainer><LineChart data={full} margin={{ left: 8, right: 16, top: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="y" /><YAxis tickFormatter={axisTick('m')} width={56} /><Tooltip formatter={tipFmt('m')} /><Line isAnimationActive={false} type="linear" dataKey="gpi" name="Gross premium income" stroke="#1d4ed8" strokeWidth={2} dot connectNulls={false} /></LineChart></ResponsiveContainer></div>
      <p className="text-[11.5px] text-slate-400">2017 gap: no IRA Q4 2017 workbook.</p><Src ids="S19" /></Card>
    <H2>Underwriting vs investment income</H2>
    <Card><div className="h-[280px]"><ResponsiveContainer><BarChart data={full} margin={{ left: 8, right: 16, top: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="y" /><YAxis tickFormatter={axisTick('m')} width={56} /><Tooltip formatter={tipFmt('m')} /><Legend /><ReferenceLine y={0} stroke="#64748b" /><Bar isAnimationActive={false} dataKey="uw" name="Underwriting result" fill="#be123c" /><Bar isAnimationActive={false} dataKey="inv" name="Investment income" fill="#059669" /></BarChart></ResponsiveContainer></div><Src ids="S19" /></Card>
    <H2>Gross premium by class, FY 2025</H2>
    <Card><div className="h-[420px]"><ResponsiveContainer><BarChart data={cls} layout="vertical" margin={{ left: 10, right: 40 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" tickFormatter={axisTick('m')} /><YAxis type="category" dataKey="n" width={150} tick={{ fontSize: 12 }} /><Tooltip formatter={tipFmt('m')} /><Bar isAnimationActive={false} dataKey="v" name="Gross premium" fill="#1c3a6b" /></BarChart></ResponsiveContainer></div>
      </Card>
  </>;
}

function Tracker() {
  const { trackTarget } = useApp(); const st = useStore();
  const ents = insurerRows().sort((a, b) => a.name.localeCompare(b.name));
  const [T, setT] = useState({ cid: trackTarget || 'cic_general', metric: 'gpi', gran: 'FY', group: 'none', from: '2016', to: '2026' });
  const M = MET[T.metric]; const single = T.gran === 'Q';
  const last = FIN.P[FIN.P.length - 1];
  const axis = useMemo(() => {
    if (single) return FIN.P.map((p, i) => ({ lab: p, i })).filter((a) => +a.lab.slice(0, 4) >= +T.from && +a.lab.slice(0, 4) <= +T.to);
    const q = { FY: 4, '9M': 3, H1: 2, Q1: 1 }[T.gran]; const out: any[] = [];
    for (let y = +T.from; y <= +T.to; y++) { const p = `${y} Q${q}`; if (p > last) break; out.push({ lab: String(y), i: idxOf(p) }); }
    return out;
  }, [T]);
  const series: { key: string; name: string; dash?: boolean }[] = [{ key: T.cid, name: FIN.comp[T.cid]?.name || T.cid }];
  if (T.group === 'market' && M.unit === 'pct') series.push({ key: '__market', name: 'Market (all general insurers)', dash: true });
  if (T.group === 'top4') { const li = axis.filter((a) => a.i >= 0).pop(); insurerRows().map((c) => ({ c, v: li ? val(c.id, 'gpi', li.i).v : null })).filter((x) => x.v != null && x.c.id !== T.cid).sort((a, b) => b.v - a.v).slice(0, 4).forEach((x) => series.push({ key: x.c.id, name: x.c.name })); }
  if (T.group === 'compare') st.compare.map(insById).filter((i) => i?.fid && i.fid !== T.cid).forEach((i) => series.push({ key: i.fid, name: FIN.comp[i.fid].name }));
  const data = axis.map((a) => { const row: any = { lab: a.lab }; series.forEach((s) => { const r = a.i < 0 ? null : val(s.key, T.metric, a.i, single); row[s.key] = r ? r.v : null; row[s.key + '__s'] = r ? r.status : 'UNAVAILABLE'; }); return row; });
  const recs = axis.filter((a) => a.i >= 0).map((a) => ({ a, r: val(T.cid, T.metric, a.i, single) }));
  const set = (k) => (e) => setT({ ...T, [k]: e.target.value });
  const yrs: string[] = []; for (let y = 2016; y <= +last.slice(0, 4); y++) yrs.push(String(y));
  const Tip = ({ active, payload, label }: any) => active && payload?.length ? <div className="rounded-lg border border-slate-200 bg-white p-2 text-xs shadow dark:border-slate-700 dark:bg-slate-900"><b>{label}</b>{payload.map((p) => <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value == null ? 'no value' : fmt(p.value, M.unit)} · {p.payload[p.dataKey + '__s']}</div>)}</div> : null;
  return <>
    <div className="flex flex-wrap items-end gap-2">
      <Field label="Insurer"><select id="trCid" className={inputCls} value={T.cid} onChange={set('cid')}>{ents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="Metric"><select id="trMetric" className={inputCls} value={T.metric} onChange={set('metric')}>{Object.entries(MET).filter(([, m]: any) => m.kind !== 'unavailable').map(([k, m]: any) => <option key={k} value={k}>{m.label}{m.kind === 'calculated' ? ' (calc.)' : ''}</option>)}</select></Field>
      <Field label="Reporting period"><select id="trGran" className={inputCls} value={T.gran} onChange={set('gran')}><option value="FY">Full year (Q4 YTD)</option><option value="9M">Nine months (Q3 YTD)</option><option value="H1">Half year (Q2 YTD)</option><option value="Q1">First quarter</option><option value="Q">Single quarters (derived)</option></select></Field>
      <Field label="From"><select className={inputCls} value={T.from} onChange={set('from')}>{yrs.map((y) => <option key={y}>{y}</option>)}</select></Field>
      <Field label="To"><select className={inputCls} value={T.to} onChange={set('to')}>{yrs.map((y) => <option key={y}>{y}</option>)}</select></Field>
      <Field label="Peer group"><select id="trGroup" className={inputCls} value={T.group} onChange={set('group')}><option value="none">None</option><option value="market">Market average (ratios)</option><option value="top4">Four largest others</option><option value="compare">My comparison list ({st.compare.length})</option></select></Field></div>
    
    <Card className="mt-2"><div className="h-[340px]" data-testid="tracker-chart"><ResponsiveContainer><LineChart data={data} margin={{ left: 8, right: 16, top: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="lab" tick={{ fontSize: 11 }} minTickGap={12} /><YAxis tickFormatter={axisTick(M.unit)} width={56} /><Tooltip content={<Tip />} /><Legend />
      {series.map((s, k) => <Line key={s.key} type="linear" dataKey={s.key} name={s.name} stroke={s.dash ? '#64748b' : PAL[k % PAL.length]} strokeDasharray={s.dash ? '5 4' : undefined} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} isAnimationActive={false} />)}</LineChart></ResponsiveContainer></div>
      <p className="text-[11.5px] text-slate-400">Gaps = no comparable value. Lines are never joined across a gap. {M.help}</p></Card>
    <details className="mt-5"><summary className="cursor-pointer font-display text-lg font-semibold">Records behind the chart</summary><div className="mt-2">
    <Table><thead><tr><th>Period</th><th className="!text-right">Display value</th><th>Raw value</th><th>Status</th><th>Source document</th></tr></thead><tbody>
      {recs.map(({ a, r }) => { const p = FIN.P[a.i]; const w = sourceForPeriod(p); return <tr key={a.lab}><td>{single ? p + ' (single quarter)' : pLabel(p, true)}</td><Num>{r.v == null ? '—' : fmt(r.v, M.unit)}</Num>
        <td className="text-xs text-slate-500">{r.v == null ? r.reason : M.unit === 'pct' ? 'calculated' : `${r.v.toLocaleString('en-KE', { maximumFractionDigits: 1 })} KSh m (as received; IRA original in KSh '000)`}</td>
        <td><Badge s={r.status} />{r.note && <div className="text-xs text-slate-500">{r.note}</div>}</td>
        <td className="text-xs">{w ? <a className="text-sky-700 underline" href={w.url} target="_blank" rel="noopener">{w.title}</a> : 'IRA workbook link not recorded'} · via <SrcLink id="S19" /></td></tr>; })}</tbody></Table></div></details>
  </>;
}

const RANK = ['gpi', 'ms', 'uw', 'lr', 'cr', 'clm', 'cpaid', 'pat', 'pbt'];
function Rankings() {
  const st = useStore();
  const [R, setR] = useState({ metric: 'gpi', per: '2025 Q4', dir: -1 });
  const M = MET[R.metric]; const i = idxOf(R.per);
  const licensed = INSURERS.filter((x) => x.general);
  const head = <div className="flex flex-wrap items-end gap-2">
    <Field label="Rank by"><select id="rkMetric" className={inputCls} value={R.metric} onChange={(e) => setR({ ...R, metric: e.target.value })}>{RANK.map((k) => <option key={k} value={k}>{MET[k].label}{MET[k].kind === 'unavailable' ? ' — import needed' : ''}</option>)}</select></Field>
    <Field label="Reporting period"><select id="rkPer" className={inputCls} value={R.per} onChange={(e) => setR({ ...R, per: e.target.value })}>{FIN.P.slice().reverse().map((p) => <option key={p} value={p}>{pLabel(p)}</option>)}</select></Field>
    <Btn onClick={() => setR({ ...R, dir: -R.dir })}>Order: {R.dir === -1 ? 'highest first' : 'lowest first'}</Btn></div>;
  if (M.kind === 'unavailable') {
    const im = st.imported.filter((r) => r.mkey === R.metric && r.period === R.per && r.gran !== 'QTR');
    const sorted = im.slice().sort((a, b) => (R.dir === -1 ? b.valueM - a.valueM : a.valueM - b.valueM));
    const bases = [...new Set(sorted.map((r) => r.basis || ''))];
    return <>{head}<p className="mt-2 text-[13px] text-slate-500">{M.help}</p>
      {!sorted.length ? <Card className="mt-3 text-center"><b>{M.label} cannot be ranked yet.</b><p className="text-sm text-slate-500">0 of 35 licensed insurers have a sourced value for {pLabel(R.per, true)}. Import IRA figures (Data Sources → Import) to enable this ranking.</p></Card> :
        <>{bases.length > 1 && <Note tone="bad">Imported records use different definitions ({bases.join(' / ')}). Ranking withheld.</Note>}
          <p className="my-2 font-semibold">{sorted.length} of 35 licensed insurers had comparable data.</p>
          <Table><thead><tr><th className="!text-right">#</th><th>Insurer</th><th className="!text-right">Value</th><th>Status</th><th>Source</th></tr></thead><tbody>{sorted.map((r, k) => <tr key={r.id}><Num>{bases.length > 1 ? '—' : k + 1}</Num><td>{r.entity}</td><Num>{fmt(r.valueM, M.unit)}</Num><td><Badge s={r.status} /></td><td className="text-xs"><a className="text-sky-700 underline" href={r.srcurl} target="_blank" rel="noopener">{r.srcdoc || 'source'}</a> {r.pageRef}</td></tr>)}</tbody></Table></>}</>;
  }
  const ratio = ['lr', 'cr'].includes(R.metric);
  const all = insurerRows().map((c) => ({ c, r: val(c.id, R.metric, i), small: ratio && (c.s.nep[i] == null || c.s.nep[i] < 50), lic: licensed.find((x) => x.fid === c.id) }));
  const ok = all.filter((x) => x.r.v != null && x.r.status !== 'DISPUTED' && !x.small).sort((a, b) => (R.dir === -1 ? b.r.v - a.r.v : a.r.v - b.r.v));
  const disputed = all.filter((x) => x.r.status === 'DISPUTED');
  const small = all.filter((x) => x.small && x.r.v != null && x.r.status !== 'DISPUTED');
  const missing = licensed.filter((x) => !ok.some((o) => o.c.id === x.fid) && !disputed.some((d) => d.c.id === x.fid) && !small.some((s) => s.c.id === x.fid));
  const licOk = ok.filter((x) => x.lic).length;
  const i25 = idxOf('2025 Q4');
  const fy25 = insurerRows().filter((c) => { const r = val(c.id, R.metric, i25); return r.v != null && r.status !== 'DISPUTED' && !(ratio && (c.s.nep[i25] == null || c.s.nep[i25] < 50)) && licensed.some((x) => x.fid === c.id); }).length;
  const cmp = st.compare.map((id) => insById(id)?.fid);
  const top = ok.slice(0, 20).map((x) => ({ n: x.c.name.replace(/ \(formerly.*\)/, ''), v: x.r.v, hl: cmp.includes(x.c.id) }));
  return <>{head}<Card className="mt-3"><p className="font-display text-lg font-semibold" data-testid="rank-header">{licOk} of 35 licensed insurers had comparable data{R.per === '2025 Q4' ? ` for ${pLabel(R.per, true)}` : ` (${fy25} for FY 2025)`}.</p>
      <p className="text-[13px] text-slate-500">{ok.length - licOk > 0 && `+${ok.length - licOk} since-delisted entities ranked. `}Same table, period and definition.</p>
      <details className="mt-2" data-testid="rank-excluded"><summary className="cursor-pointer font-semibold">Excluded or missing ({disputed.length + small.length + missing.length}) — why</summary>
        <ul className="mt-1 list-disc pl-5 text-sm">
          {disputed.map((x) => <li key={x.c.id}><Badge s="DISPUTED" /> <b>{x.c.name}</b> — {x.r.note}</li>)}
          {small.map((x) => <li key={x.c.id}><b>{x.c.name}</b> — net earned premium below KSh 50m; ratio not meaningful.</li>)}
          {missing.map((x) => <li key={x.id}><b>{x.trading}</b> — {x.fid ? val(x.fid, R.metric, i).reason : 'no IRA statistical record under this entity'}.</li>)}
          {!disputed.length && !small.length && !missing.length && <li>None.</li>}</ul></details></Card>
    <Card className="mt-3"><div style={{ height: Math.max(220, top.length * 26) }}><ResponsiveContainer><BarChart data={top} layout="vertical" margin={{ left: 10, right: 50 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" tickFormatter={axisTick(M.unit)} /><YAxis type="category" dataKey="n" width={170} tick={{ fontSize: 11 }} /><Tooltip formatter={tipFmt(M.unit)} /><ReferenceLine x={0} stroke="#64748b" />
      <Bar isAnimationActive={false} dataKey="v" name={M.label}>{top.map((r, k) => <Cell key={k} fill={r.hl ? '#d97706' : r.v < 0 ? '#be123c' : '#1c3a6b'} />)}</Bar></BarChart></ResponsiveContainer></div>
      {ok.length > 20 && <p className="text-xs text-slate-500">Top 20 of {ok.length} drawn; full table below. Your comparison list is highlighted.</p>}</Card>
    <div className="mt-3"><Table><thead><tr><th className="!text-right">#</th><th>Insurer</th><th className="!text-right">Value</th><th>Status</th><th>Source</th></tr></thead><tbody>{ok.map((x, k) => <tr key={x.c.id} className={cmp.includes(x.c.id) ? 'bg-amber-50 dark:bg-amber-950/30' : ''}><Num>{k + 1}</Num><td>{x.c.name}</td><Num>{fmt(x.r.v, M.unit)}{x.r.calc && <span className="text-xs text-slate-500"> calc.</span>}</Num><td><Badge s={x.r.status} /></td><td className="text-xs">{sourceForPeriod(R.per) ? <a className="text-sky-700 underline" href={sourceForPeriod(R.per).url} target="_blank" rel="noopener">{sourceForPeriod(R.per).title}</a> : ''} via S19</td></tr>)}</tbody></Table></div>
    <p className="mt-2 text-[12px] text-slate-500">{R.metric === 'gpi' || R.metric === 'ms' ? 'Size, not financial strength or service.' : 'One metric, one period. Lower is not automatically better.'} {M.help}</p></>;
}

function Share() {
  const st = useStore();
  const [H, setH] = useState({ per: '2025 Q4', top: 10, mode: 'pct', view: 'bar' });
  const i = idxOf(H.per); const tot = mval('gpi', i);
  const rows = insurerRows().map((c) => ({ c, g: val(c.id, 'gpi', i), ms: val(c.id, 'ms', i) })).filter((x) => x.g.v != null).sort((a, b) => b.g.v - a.g.v);
  const top = rows.slice(0, H.top), rest = rows.slice(H.top), restV = rest.reduce((a, x) => a + x.g.v, 0);
  const cmp = st.compare.map((id) => insById(id)?.fid);
  const toV = (g) => (H.mode === 'pct' ? (g / tot) * 100 : g / 1000);
  const unit = H.mode === 'pct' ? '%' : ' bn';
  const data = [...top.map((x) => ({ name: x.c.name.replace(/ \(formerly.*\)/, ''), size: toV(x.g.v), v: toV(x.g.v), st: x.ms.status, hl: cmp.includes(x.c.id) })), { name: `Remaining ${rest.length} participants`, size: toV(restV), v: toV(restV), st: 'REPORTED', hl: false }];
  const verifiedLeaders = top.filter((x) => x.ms.status === 'VERIFIED');
  const Tile = (p: any) => { const { x, y, width, height, name, v, index } = p; if (width < 2 || height < 2) return null; return <g><rect x={x} y={y} width={width} height={height} fill={index === data.length - 1 ? '#cbd5e1' : PAL[index % 5]} stroke="#fff" />{width > 70 && height > 34 && <><text x={x + 6} y={y + 18} fill={index === data.length - 1 ? '#0f172a' : '#fff'} fontSize={12} fontWeight={600}>{String(name).slice(0, Math.floor(width / 7))}</text><text x={x + 6} y={y + 33} fill={index === data.length - 1 ? '#0f172a' : '#fff'} fontSize={11}>{v?.toFixed(H.mode === 'pct' ? 1 : 2)}{unit}</text></>}</g>; };
  return <>
    <div className="flex flex-wrap items-end gap-2">
      <Field label="Reporting period"><select id="shPer" className={inputCls} value={H.per} onChange={(e) => setH({ ...H, per: e.target.value })}>{FIN.P.slice().reverse().map((p) => <option key={p} value={p}>{pLabel(p)}</option>)}</select></Field>
      <Field label="Show top"><select className={inputCls} value={H.top} onChange={(e) => setH({ ...H, top: +e.target.value })}>{[5, 10, 15, 20].map((n) => <option key={n}>{n}</option>)}</select></Field>
      <div role="group" aria-label="Unit" className="flex gap-1"><Btn primary={H.mode === 'pct'} onClick={() => setH({ ...H, mode: 'pct' })}>Share %</Btn><Btn primary={H.mode === 'abs'} onClick={() => setH({ ...H, mode: 'abs' })}>KSh billions</Btn></div>
      <div role="group" aria-label="Chart type" className="flex gap-1"><Btn primary={H.view === 'bar'} onClick={() => setH({ ...H, view: 'bar' })}>Bar</Btn><Btn primary={H.view === 'tree'} onClick={() => setH({ ...H, view: 'tree' })}>Treemap</Btn></div></div>
    {verifiedLeaders.length > 0 && <Note tone="ok"><b>Verified leaders, {pLabel(H.per, true)}:</b> {verifiedLeaders.map((x) => `${x.c.name.replace(/ \(formerly.*\)/, '')} ${fmt(x.ms.v, 'pct')}`).join(' · ')} <Badge s="VERIFIED" /> — matched to IRA Q1 2025 release, Table 16.</Note>}
    <Card className="mt-3">{H.view === 'bar' ? <div style={{ height: data.length * 30 + 40 }}><ResponsiveContainer><BarChart data={data} layout="vertical" margin={{ left: 10, right: 60 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" tickFormatter={(v) => v + (H.mode === 'pct' ? '%' : '')} /><YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 11 }} /><Tooltip formatter={(v: any) => v.toFixed(H.mode === 'pct' ? 1 : 2) + unit} />
      <Bar isAnimationActive={false} dataKey="v" name={H.mode === 'pct' ? 'Market share' : 'Gross premium income (KSh bn)'}>{data.map((d, k) => <Cell key={k} fill={k === data.length - 1 ? '#94a3b8' : d.hl ? '#d97706' : d.st === 'VERIFIED' ? '#059669' : '#1c3a6b'} />)}<LabelList dataKey="v" position="right" formatter={(v: any) => v.toFixed(H.mode === 'pct' ? 1 : 2) + unit} style={{ fontSize: 11 }} /></Bar></BarChart></ResponsiveContainer></div>
      : <div className="h-[420px]"><ResponsiveContainer><Treemap data={data} dataKey="size" isAnimationActive={false} content={<Tile />} /></ResponsiveContainer></div>}
      <p className="mt-1 text-xs text-slate-500">{H.view === 'bar' ? 'Green bars = share VERIFIED against IRA; amber = your comparison list; grey = all remaining participants combined.' : 'Tile area is proportional to gross premium income; grey = all remaining participants combined. Verification status per insurer is in the table below.'}</p></Card>
    <div className="mt-3"><Table><thead><tr><th className="!text-right">#</th><th>Insurer</th><th className="!text-right">Share</th><th className="!text-right">Gross premium income</th><th>Status</th></tr></thead><tbody>
      {top.map((x, k) => <tr key={x.c.id} className={cmp.includes(x.c.id) ? 'bg-amber-50 dark:bg-amber-950/30' : ''}><Num>{k + 1}</Num><td>{x.c.name}</td><Num>{fmt(x.ms.v, 'pct')}</Num><Num>{fmt(x.g.v)}</Num><td><Badge s={x.ms.status} /></td></tr>)}
      <tr><td /><td className="font-semibold">Remaining {rest.length} participants</td><Num>{fmt((restV / tot) * 100, 'pct')}</Num><Num>{fmt(restV)}</Num><td><Badge s="REPORTED" /></td></tr>
      <tr><td /><td className="font-semibold">Market total (same IRA table)</td><Num>100.0%</Num><Num>{fmt(tot)}</Num><td><Badge s={(VERIFIED_MARKET[H.per] || []).includes('gpi') ? 'VERIFIED' : 'REPORTED'} /></td></tr></tbody></Table></div>
    <p className="mt-1 text-xs text-slate-500">Shares are calculated only from insurer GWP and the market total of the same IRA table and period.</p><Src ids={['S19', 'S18']} />
  </>;
}

/* ---------- Reconciliation & audit queue ---------- */
const recon25 = [
  { yr: 'FY 2024', A: 205.03, B: 205.03, Q: 204.10 },
  { yr: 'FY 2025', A: 224.24, B: 225.38, Q: 227.17 },
];
export function ReconChart() {
  return <Card><h3 className="font-display font-semibold">2025 general-insurance premium: competing figures</h3>
    <div className="h-[320px]" data-testid="recon-chart"><ResponsiveContainer><BarChart data={recon25} margin={{ left: 8, right: 16, top: 24 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="yr" /><YAxis domain={[0, 'auto']} tickFormatter={(v) => v + 'bn'} width={52} /><Tooltip formatter={(v: any) => 'KSh ' + v.toFixed(2) + ' bn'} /><Legend />
      <Bar isAnimationActive={false} dataKey="A" name="Annual statistics — figure A (224.24)" fill="#be123c"><LabelList dataKey="A" position="top" style={{ fontSize: 11 }} formatter={(v: any) => v.toFixed(2)} /></Bar>
      <Bar isAnimationActive={false} dataKey="B" name="Annual statistics — figure B (225.38)" fill="#f97316"><LabelList dataKey="B" position="top" style={{ fontSize: 11 }} formatter={(v: any) => v.toFixed(2)} /></Bar>
      <Bar isAnimationActive={false} dataKey="Q" name="Quarterly cumulative (distinct measure)" fill="#1d4ed8"><LabelList dataKey="Q" position="top" style={{ fontSize: 11 }} formatter={(v: any) => v.toFixed(2)} /></Bar></BarChart></ResponsiveContainer></div>
    <Table><thead><tr><th>Series</th><th className="!text-right">FY 2024 base</th><th className="!text-right">FY 2025</th><th className="!text-right">Implied growth</th><th>Status</th></tr></thead><tbody>
      <tr><td>Verified 2024 baseline (IRA Annual Report 2024, Table 6: KES 205,031,948 thousand)</td><Num>205.03</Num><Num>—</Num><Num>—</Num><td><Badge s="VERIFIED" /></td></tr>
      <tr><td>Annual A — The Standard</td><Num>205.03</Num><Num>224.24</Num><Num>9.37%</Num><td><Badge s="DISPUTED" /></td></tr>
      <tr><td>Annual B — Business Daily (also prints 225.39)</td><Num>205.03</Num><Num>225.38</Num><Num>9.93%</Num><td><Badge s="DISPUTED" /></td></tr>
      <tr><td>Quarterly cumulative (gross direct 223.24 + inward 3.93), IRA Q4 statistics</td><Num>204.10</Num><Num>227.17</Num><Num>11.3%</Num><td><Badge s="REPORTED" /></td></tr></tbody></Table>
    <p className="mt-2 text-sm">205.03 × 1.0937 = <b>224.24</b> · 205.03 × 1.0993 = <b>225.39</b> — both exact from the same verified base, so the gap is in IRA's 2025 figure, not rounding.</p>
    <Src ids={['S16', 'S4', 'S5', 'S19']} /></Card>;
}

export function Recon() {
  const st = useStore();
  const [form, setForm] = useState<Record<string, { choice: string; reason: string; who: string }>>({});
  const auto = st.imported.filter((r) => r.conflict).map((r) => ({ id: 'RI-' + r.id, topic: `${r.entity} · ${r.metric} · ${r.period}`, status: 'DISPUTED', values: [{ v: r.conflict.compiled / 1000, label: 'Reconstructed IRA quarterly panel', src: 'S19', status: 'REPORTED', note: '' }, { v: r.valueM / 1000, label: 'Imported value', srcurl: r.srcurl, status: r.status, note: `${r.srcdoc || ''} ${r.pageRef || ''}` }], findings: [], unresolved: `Imported value differs by ${r.conflict.pct.toFixed(2)}% from the reconstructed figure. Check the definition (gross vs net, YTD vs quarter) and the source table.` }));
  const items = [...RECON, ...auto];
  const save = (id) => {
    const f = form[id] || { choice: '', reason: '', who: '' };
    if (f.reason.trim().length < 15) { toast('A written justification (at least 15 characters, naming the official source) is required.'); return; }
    const res = { choice: f.choice || 'Keep all values (definitions differ)', reason: f.reason.trim(), who: f.who.trim() || 'Anonymous (demo)', at: new Date().toISOString() };
    setState({ resolutions: { ...st.resolutions, [id]: res } }); log({ who: res.who, action: 'reconciliation resolved', key: id, next: res.choice, status: 'VERIFIED' }); toast('Resolution recorded');
  };
  const reopen = (id) => { const r = { ...st.resolutions }; delete r[id]; setState({ resolutions: r }); log({ action: 'reconciliation reopened', key: id, status: 'DISPUTED' }); };
  return <>
    <ReconChart />
    <H2>Audit queue</H2>
    <Lead>Competing values stay side by side until an official source settles them.</Lead>
    {items.map((r: any) => { const res = st.resolutions[r.id]; const f = form[r.id] || { choice: '', reason: '', who: '' }; return <Card key={r.id} className="mt-3">
      <div className="flex flex-wrap justify-between gap-2"><h3 className="font-display font-semibold">{r.topic}</h3><Badge s={res ? 'VERIFIED' : r.status} label={res ? 'Resolved' : r.status} /></div>
      <div className="mt-2"><Table><thead><tr><th>Value</th><th>Definition</th><th>Status</th><th>Source</th><th>Note</th></tr></thead><tbody>{r.values.map((v, k) => <tr key={k}><Num><b>{typeof v.v === 'number' ? 'KSh ' + v.v.toFixed(2) + ' bn' : v.v}</b></Num><td>{v.label}</td><td><Badge s={v.status === 'HISTORICAL' ? 'REPORTED' : v.status} /></td><td className="text-xs">{v.src ? <SrcLink id={v.src} /> : <a className="text-sky-700 underline" href={v.srcurl} target="_blank" rel="noopener">link</a>}</td><td className="text-xs text-slate-500">{v.note}</td></tr>)}</tbody></Table></div>
      {r.findings?.length > 0 && <><h4 className="mt-2 font-semibold">Findings</h4><ul className="list-disc pl-5 text-sm">{r.findings.map((x) => <li key={x}>{x}</li>)}</ul></>}
      <p className="mt-2 text-sm"><b>Unresolved:</b> {r.unresolved}</p>
      {res ? <Note tone="ok"><b>Resolved</b> {res.at.slice(0, 10)} by {res.who}: “{res.choice}”. Justification: {res.reason} <Btn small onClick={() => reopen(r.id)}>Reopen</Btn></Note> :
        <details className="mt-2"><summary className="cursor-pointer font-semibold">Record a resolution</summary><div className="mt-2 grid max-w-xl gap-2">
          <Field label="Accepted value"><select className={inputCls} value={f.choice} onChange={(e) => setForm({ ...form, [r.id]: { ...f, choice: e.target.value } })}><option value="">Keep all values (definitions differ)</option>{r.values.map((v, k) => <option key={k}>{String(v.v)} — {v.label}</option>)}</select></Field>
          <Field label="Written justification and official source (required)"><textarea aria-label={'Justification for ' + r.id} className={inputCls + ' h-20 py-2'} value={f.reason} onChange={(e) => setForm({ ...form, [r.id]: { ...f, reason: e.target.value } })} placeholder="e.g. IRA 2025 annual statistics, Table 3 p.12, shows …" /></Field>
          <Field label="Your name"><input className={inputCls} value={f.who} onChange={(e) => setForm({ ...form, [r.id]: { ...f, who: e.target.value } })} /></Field>
          <Btn primary onClick={() => save(r.id)} data-testid={'resolve-' + r.id}>Save resolution</Btn></div></details>}
    </Card>; })}
  </>;
}
