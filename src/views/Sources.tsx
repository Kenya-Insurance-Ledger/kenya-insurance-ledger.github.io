import React, { useState } from 'react';
import { FIN, INSURERS, MET, fyIdx, val, fmt, pLabel } from '../lib/fin';
import { SOURCES, LEGAL, CONTACTS, CHECKED, ALIASES, CLASSES, PRODUCTS, FEED } from '../data/reference.js';
import { Badge, Card, Kpi, H1, H2, Lead, Note, Src, SrcLink, Table, Num, Tabs, Btn, Field, Info, inputCls, toast, STATUS_HELP } from '../components/ui';
import { PipelineStepper } from '../components/illustrations';
import { Explainer90 } from './Claims';
import { Explainer156 } from './Toolkit';
import { FIELDS, UNITS, MKEY, parseInput, autoMap, validate, resolveEntity, TEMPLATE_CSV } from '../lib/importer';
import { useStore, setState, log, getState } from '../lib/store';
import { useApp } from '../App';

const LEGAL_TYPES = ['Statute', 'Regulation', 'Guidance', 'Practice', 'Court Decision'];
const TYPE_TONE = { Statute: 'bg-navy-900 text-white', Regulation: 'bg-sky-700 text-white', Guidance: 'bg-teal-700 text-white', Practice: 'bg-slate-500 text-white', 'Court Decision': 'bg-amber-700 text-white' };
export const TypeBadge = ({ t }) => <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold ${TYPE_TONE[t]}`}>{t}</span>;

export default function Sources() {
  const { sub, setSub } = useApp(); const t = sub.sources || 'register';
  const Body = { register: Register, coverage: Coverage, checks: Checks, legal: Legal, import: Importer, pdf: PdfExtractor, history: Audit, model: Model }[t] || Register;
  return <><H1>Sources &amp; data</H1><div className="mt-2 flex flex-wrap items-center gap-1.5">{['VERIFIED', 'REPORTED', 'DISPUTED', 'PENDING', 'SUPERSEDED', 'UNAVAILABLE'].map((s) => <Badge key={s} s={s} />)}<Info>{['VERIFIED', 'REPORTED', 'DISPUTED', 'PENDING', 'SUPERSEDED', 'UNAVAILABLE'].map((s) => <p key={s} className="mb-1"><b>{s}</b> — {STATUS_HELP[s]}</p>)}</Info></div>
    <Tabs items={[['register', 'Source register'], ['coverage', 'Coverage'], ['checks', 'Spot checks'], ['legal', 'Legal library'], ['import', 'Import data'], ['pdf', 'IRA PDF extractor'], ['history', 'Audit log'], ['model', 'Pipeline & data model']]} value={t} onChange={(k) => setSub('sources', k)} /><Body /></>;
}

function Register() {
  return <Table><thead><tr><th>ID</th><th>Institution</th><th>Document</th><th>Published</th><th>Period</th><th>What was extracted</th><th>Status</th></tr></thead><tbody>{SOURCES.map((s) => <tr key={s.id}><td>{s.id}</td><td>{s.inst}<div className="text-xs text-slate-500">{s.type}</div></td><td><a className="text-sky-700 underline" href={s.url} target="_blank" rel="noopener">{s.name}</a></td><td>{s.pub}</td><td>{s.period}</td><td className="text-[13px]">{s.extract}</td><td><Badge s={s.status === 'HISTORICAL' ? 'REPORTED' : s.status} /></td></tr>)}</tbody></Table>;
}
function Coverage() {
  const gi = INSURERS.filter((i) => i.general); const fys = FIN.ready ? fyIdx() : [];
  const cv = gi.filter((i) => (CONTACTS[i.id] || []).some((c) => c.type === 'Customer care phone' && c.status === 'VERIFIED')).length;
  return <><div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
    <Kpi label="Verified legal references" value={`${LEGAL.filter((l) => l.status === 'VERIFIED').length} / ${LEGAL.length}`} s="VERIFIED" />
    <Kpi label="Insurer status records" value={String(INSURERS.length)} s="VERIFIED" sub="35 licensed general insurers + micro, re and historical entities." />
    <Kpi label="Financial periods" value={FIN.ready ? String(FIN.P.length) : null} s="REPORTED" sub={FIN.ready ? `${pLabel(FIN.P[0], true)} – ${pLabel(FIN.P[FIN.P.length - 1], true)}; FY 2017 missing at source.` : ''} />
    <Kpi label="Insurer-years with GWP" value={FIN.ready ? String(gi.reduce((a, i) => a + (i.fid ? fys.filter(([, ix]) => val(i.fid, 'gpi', ix).v != null).length : 0), 0)) : null} s="REPORTED" />
    <Kpi label="Licensed insurers with verified contacts" value={`${cv} / 35`} s="VERIFIED" sub={`${35 - cv} pending (APA reported via third party).`} /></div>
    <H2>Still missing</H2><ul className="list-disc pl-5 text-sm"><li>Claims paid, net written premium, profit before tax and capital adequacy by insurer — import needed</li><li>IRA 2025 Annual Statistics document (settles 224.24 vs 225.38)</li><li>Insurer-level claims settlement statistics</li><li>Verified contacts for {35 - cv} licensed general insurers</li></ul></>;
}
function Checks() {
  if (!FIN.ready) return <Card>Loading…</Card>;
  return <><Lead>The reconstructed panel was checked against figures read directly from IRA PDFs on {CHECKED}. A value turns VERIFIED only where such a check covers it.</Lead>
    <div className="mt-2"><Table><thead><tr><th>Check</th><th className="!text-right">Portal</th><th className="!text-right">IRA document</th><th>Result</th><th>Reference</th></tr></thead><tbody>{FIN.checks.map((c) => <tr key={c.label}><td>{c.label}</td><Num>{c.portal?.toLocaleString('en-KE') ?? '—'}</Num><Num>{c.ira.toLocaleString('en-KE')}</Num><td><Badge s={c.ok ? 'VERIFIED' : 'DISPUTED'} label={c.ok ? 'match' : 'mismatch'} /></td><td className="text-xs">{c.ref}</td></tr>)}</tbody></Table></div></>;
}
function Legal() {
  const [type, setType] = useState('');
  const L = LEGAL.filter((l) => !type || l.type === type);
  return <>
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]"><Explainer90 /><Explainer156 />
      <Card><h3 className="font-display font-semibold">Licensing &amp; statutory management</h3><p className="text-sm">Licensing under ss.30–31; annual list under s.184. IRA can place a failing insurer under statutory management (s.67C(2)(i)) with PCF as manager — no new business — and cancel licences (s.196). Invesco since 14 Aug 2024; Trident, Corporate, KUSCCO Mutual from 10 Mar 2026 (notice) / 11 Mar 2026 (PCF control, media statement).</p><Src ids={['S2', 'S27', 'S3', 'S28']} /></Card>
      <Card><h3 className="font-display font-semibold">Policyholder protection</h3><ul className="list-disc pl-5 text-sm"><li>90-day claims rule with penalties (s.203)</li><li>Complaints to the Commissioner (s.204A); Tribunal appeal (s.169)</li><li>PCF compensation up to KSh 500,000 per claim from 1 Jan 2026 (was KSh 250,000)</li><li>Data Protection Act s.25 principles for personal and health data</li></ul><Src ids={['S2', 'S22', 'S31']} /></Card></div>
    <H2>Legal library</H2>
    <div className="flex flex-wrap gap-1.5"><Btn small primary={!type} onClick={() => setType('')}>All ({LEGAL.length})</Btn>{LEGAL_TYPES.map((x) => <Btn key={x} small primary={type === x} onClick={() => setType(x)}>{x} ({LEGAL.filter((l) => l.type === x).length})</Btn>)}</div>
    <div className="mt-3"><Table><thead><tr><th>Type</th><th>Legislation / document</th><th>Section</th><th>Plain English</th><th>Practical application</th><th>Status</th><th>Source</th></tr></thead><tbody>{L.map((l) => <tr key={l.id}><td><TypeBadge t={l.type} /></td><td><b>{l.act}</b><div className="text-xs text-slate-500">{l.subject}</div></td><td>{l.sec}</td><td className="text-sm">{l.plain}<details><summary className="cursor-pointer text-xs">Summary of text</summary><span className="text-xs text-slate-500">{l.text}</span></details></td><td className="text-sm">{l.practice}</td><td><Badge s={l.status} /></td><td className="text-xs"><SrcLink id={l.src} /><br />{CHECKED}</td></tr>)}</tbody></Table></div>
    <p className="mt-1 text-xs text-slate-500">Commentary that conflicts with the statute (Legal 500 on “ss.204–205”) is kept in the source register as DISPUTED and excluded from the library. Not legal advice.</p></>;
}

/* ---------- Import ---------- */
function Importer() {
  const st = useStore();
  const [I, setI] = useState<any>({ text: '', format: 'csv', raw: null, map: {}, who: '', period: '', srcurl: '', srcdoc: '', status: 'REPORTED', res: null, approve: {}, summary: '', parseErr: '' });
  const up = (p) => setI((x) => ({ ...x, ...p }));
  const parse = () => { try { const raw = parseInput(I.text, I.format); up({ raw, map: autoMap(raw.headers), res: null, summary: '', parseErr: '' }); } catch (e: any) { up({ raw: null, res: null, parseErr: 'Could not parse ' + I.format.toUpperCase() + ': ' + e.message }); } };
  const run = () => up({ res: validate(I.raw, I.map, I, getState().imported), approve: {}, summary: '' });
  const commit = () => {
    const s = getState(); const who = I.who.trim() || 'Anonymous (demo)', at = new Date().toISOString();
    let imported = s.imported.slice(), superseded = s.superseded.slice(), history = s.history.slice(); let add = 0, rep = 0, con = 0, skip = 0;
    I.res.rows.forEach((r) => {
      if (!r.ok || (r.action === 'replace' && !I.approve[r._i])) { skip++; return; }
      const rec = { id: 'imp' + Date.now() + Math.random().toString(36).slice(2, 6), entity: r.entity, eid: r.eid, period: r.period, gran: r.gran, metric: r.metric, mkey: r.mkey, raw: r.raw, unit: r.unit, currency: r.currency, valueM: r.valueM, basis: r.basis, pageRef: r.pageRef, srcdoc: r.srcdoc, srcurl: r.srcurl, extracted: r.extracted, status: r.status, conflict: r.conflict || null, who, at };
      const key = `${r.entity} · ${r.period} · ${r.metric}`;
      if (r.action === 'replace') { imported = imported.filter((x) => x.id !== r.prev.id); superseded.push({ ...r.prev, status: 'SUPERSEDED', supersededBy: rec.id, supersededAt: at }); history.push({ at, who, action: 'replace (original archived as SUPERSEDED)', key, prev: r.prev.raw + ' ' + r.prev.unit, next: r.raw + ' ' + r.unit, src: r.srcurl, status: r.status }); rep++; }
      else { history.push({ at, who, action: r.conflict ? 'import (competing value → audit queue)' : 'import', key, prev: null, next: r.raw + ' ' + r.unit, src: r.srcurl, status: r.status }); add++; }
      if (r.conflict) con++; imported.push(rec);
    });
    setState({ imported, superseded, history });
    up({ res: null, summary: `${add} added, ${rep} replaced (originals archived as SUPERSEDED), ${con} logged as competing values, ${skip} skipped.` }); toast('Import complete');
  };
  const remove = (r) => { setState({ imported: st.imported.filter((x) => x.id !== r.id), superseded: [...st.superseded, { ...r, status: 'SUPERSEDED', removed: true }] }); log({ action: 'remove (archived as SUPERSEDED)', key: `${r.entity} · ${r.period} · ${r.metric}`, prev: r.raw + ' ' + r.unit, src: r.srcurl, status: r.status }); };
  const res = I.res; const good = res?.rows?.filter((r) => r.ok) || []; const ready = good.filter((r) => r.action !== 'replace' || I.approve[r._i]); const needs = good.filter((r) => r.action === 'replace' && !I.approve[r._i]);
  return <>
    <Note tone="bad"><b>Demonstration persistence.</b> Imports are stored in this browser's localStorage — not secure, not shared. Use Backup in the header to keep a copy. Production needs authenticated admin roles and a database.</Note>
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
      <Card><h3 className="font-semibold">1 · Provide data</h3>
        <div className="my-2 flex flex-wrap gap-1.5">{['csv', 'json'].map((f) => <Btn key={f} small primary={I.format === f} onClick={() => up({ format: f, raw: null })}>{f.toUpperCase()}</Btn>)}
          <label className="inline-flex min-h-[34px] cursor-pointer items-center rounded-lg border border-slate-200 px-3 text-[13px] font-medium dark:border-slate-700">Upload file<input id="impFile" type="file" accept=".csv,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) f.text().then((t) => { up({ text: t, format: /\.json$/i.test(f.name) ? 'json' : 'csv', raw: null }); toast('Loaded ' + f.name); }); }} /></label>
          <Btn small onClick={() => { up({ text: TEMPLATE_CSV, format: 'csv', raw: null }); toast('Template for the missing metrics inserted — fill values and official sources first'); }}>Missing-metrics template</Btn></div>
        <textarea id="impText" aria-label="Paste data" spellCheck={false} value={I.text} onChange={(e) => up({ text: e.target.value })} className="h-44 w-full rounded-lg border border-slate-200 p-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-900" />
        <Btn className="mt-2" onClick={parse}>Parse &amp; map columns</Btn>{I.parseErr && <p className="mt-1 text-sm text-red-700">{I.parseErr}</p>}</Card>
      <Card><h3 className="font-semibold">2 · Batch defaults</h3><div className="mt-2 grid gap-2">
        <Field label="Imported by"><input id="impWho" className={inputCls} value={I.who} onChange={(e) => up({ who: e.target.value })} /></Field>
        <Field label="Default reporting period"><input className={inputCls} value={I.period} placeholder="FY2025" onChange={(e) => up({ period: e.target.value })} /></Field>
        <Field label="Default source document"><input className={inputCls} value={I.srcdoc} onChange={(e) => up({ srcdoc: e.target.value })} /></Field>
        <Field label="Default source URL"><input className={inputCls} value={I.srcurl} placeholder="https://www.ira.go.ke/…" onChange={(e) => up({ srcurl: e.target.value })} /></Field>
        <Field label="Default status"><select className={inputCls} value={I.status} onChange={(e) => up({ status: e.target.value })}>{['REPORTED', 'VERIFIED', 'PENDING'].map((s) => <option key={s}>{s}</option>)}</select></Field></div></Card></div>
    {I.raw && <Card className="mt-3"><h3 className="font-semibold">3 · Map columns ({I.raw.rows.length} rows)</h3><p className="text-[13px] text-slate-500">Supported metrics include those missing from the IRA panel: Claims Paid, Net Written Premium, Profit Before Tax, Capital Adequacy Ratio. Units: {Object.keys(UNITS).join(', ')}.</p>
      <div className="mt-2 grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">{FIELDS.map(([f, l, req]) => <Field key={f} label={l + (req ? ' *' : '')}><select data-map={f} className={inputCls} value={I.map[f] || ''} onChange={(e) => up({ map: { ...I.map, [f]: e.target.value } })}><option value="">— not in file —</option>{I.raw.headers.map((h) => <option key={h}>{h}</option>)}</select></Field>)}</div>
      <Btn primary className="mt-3" onClick={run} data-testid="validate">Validate &amp; preview changes</Btn></Card>}
    {I.summary && <Note tone="ok"><b>Import summary.</b> {I.summary} Logged in the audit log.</Note>}
    {res && <Card className="mt-3" data-testid="imp-result"><h3 className="font-semibold">4 · Validation &amp; change preview</h3>
      {res.errors.length ? <Note tone="bad"><b>{res.errors.length} error(s) — those rows will not be imported.</b><ul className="list-disc pl-5">{res.errors.slice(0, 30).map((e) => <li key={e}>{e}</li>)}</ul></Note> : <Note tone="ok">No errors.</Note>}
      {res.warnings.length > 0 && <Note><b>{res.warnings.length} warning(s)</b><ul className="list-disc pl-5">{res.warnings.slice(0, 30).map((e) => <li key={e}>{e}</li>)}</ul></Note>}
      {res.rows && <><Table><thead><tr><th>OK</th><th>Insurer</th><th>Period</th><th>Metric</th><th>Raw input</th><th className="!text-right">Converted</th><th>Change</th><th>Status</th></tr></thead><tbody>{res.rows.map((r) => <tr key={r._i}>
        <td>{r.ok ? <span className="text-emerald-700">✓</span> : <span className="text-red-700">✕</span>}</td><td>{r.entity || r.entityIn}</td><td>{r.period || r.periodIn}{r.gran === 'QTR' ? ' (quarter)' : ''}</td><td>{r.metric}</td><td className="text-xs text-slate-500">{r.raw} {r.unit}</td><Num>{r.valueM != null ? fmt(r.valueM, r.unit === 'pct' ? 'pct' : 'm') : '—'}</Num>
        <td className="text-sm">{!r.ok ? <span className="text-red-700">skip</span> : r.action === 'replace' ? <label className="flex items-start gap-2"><input type="checkbox" data-testid="approve" className="mt-0.5 h-5 w-5" checked={!!I.approve[r._i]} onChange={(e) => up({ approve: { ...I.approve, [r._i]: e.target.checked } })} /><span>Approve replacing {r.prev.raw} {r.prev.unit} → {r.raw} ({r.diff >= 0 ? '+' : ''}{fmt(r.diff, r.unit === 'pct' ? 'pct' : 'm')}). Original archived as SUPERSEDED.</span></label> : r.conflict ? 'add · competing value' : 'add'}</td><td>{r.status}</td></tr>)}</tbody></Table>
        <div className="mt-3 flex flex-wrap items-center gap-2"><Btn primary disabled={!ready.length} onClick={commit} data-testid="confirm">Confirm {ready.length} row(s)</Btn><Btn onClick={() => up({ res: null })}>Discard</Btn>{needs.length > 0 && <span className="text-[13px] text-slate-500">{needs.length} replacement(s) await approval</span>}</div></>}</Card>}
    {st.imported.length > 0 && <><H2>Imported records ({st.imported.length})</H2><Table><thead><tr><th>Insurer</th><th>Period</th><th>Metric</th><th>Raw</th><th className="!text-right">Converted</th><th>Status</th><th>Source</th><th /></tr></thead><tbody>{st.imported.map((r) => <tr key={r.id}><td>{r.entity}</td><td>{r.period}</td><td>{r.metric}</td><td className="text-xs">{r.raw} {r.unit}</td><Num>{fmt(r.valueM, r.unit === 'pct' ? 'pct' : 'm')}</Num><td><Badge s={r.status} />{r.conflict && <> <Badge s="DISPUTED" label="competing" /></>}</td><td className="text-xs"><a className="text-sky-700 underline" href={r.srcurl} target="_blank" rel="noopener">{r.srcdoc || 'link'}</a> {r.pageRef}</td><td><Btn small onClick={() => remove(r)}>Archive</Btn></td></tr>)}</tbody></Table></>}
    {st.superseded.length > 0 && <><H2>Superseded archive ({st.superseded.length})</H2><ul className="list-disc pl-5 text-sm">{st.superseded.map((r, k) => <li key={k}>{r.entity} · {r.period} · {r.metric}: {r.raw} {r.unit} <Badge s="SUPERSEDED" /></li>)}</ul></>}
  </>;
}

/* ---------- PDF extractor ---------- */
function PdfExtractor() {
  const [X, setX] = useState<any>({ stage: 0, name: '', pages: [], doc: null, sel: null, grid: [], msg: '', cols: { e: 0, v: 1 }, meta: { period: '', metric: 'gross written premium', unit: 'KES_000', status: 'VERIFIED', doc: '', url: '' } });
  const [staged, setStaged] = useState<any>(null);
  const up = (p) => setX((x) => ({ ...x, ...p }));
  const open = async (file: File) => {
    up({ msg: 'Reading ' + file.name + '…' });
    try {
      const pdfjs: any = await import('pdfjs-dist/build/pdf');
      const worker = (await import('pdfjs-dist/build/pdf.worker.min.js?url')).default; pdfjs.GlobalWorkerOptions.workerSrc = worker;
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const names = INSURERS.flatMap((i) => [i.trading, ...i.irasNames]).map((n) => n.toLowerCase()).filter((n) => n.length > 3);
      const pages: any[] = [];
      for (let n = 1; n <= doc.numPages; n++) { const tc = await (await doc.getPage(n)).getTextContent(); const text = tc.items.map((t: any) => t.str).join(' '); const low = text.toLowerCase(); const nm = new Set(names.filter((x) => low.includes(x))).size; const kw = ['gross premium', 'market share', 'underwriting', 'claims incurred', 'net earned', 'claims paid'].filter((k) => low.includes(k)); pages.push({ n, text, names: nm, kw, score: nm * 2 + kw.length }); }
      up({ doc, name: file.name, pages, stage: 1, msg: pages.every((p) => !p.text.trim()) ? 'No text layer — this PDF looks scanned. OCR it elsewhere, then paste the table as CSV.' : '', meta: { ...X.meta, doc: file.name } });
    } catch (e: any) { up({ msg: 'Could not read the PDF: ' + e.message }); }
  };
  const extract = async (n) => {
    try { const tc = await (await X.doc.getPage(n)).getTextContent();
      const items = tc.items.filter((t: any) => t.str.trim()).map((t: any) => ({ s: t.str.trim(), x: t.transform[4], y: t.transform[5], w: t.width || 0 }));
      const lines: any[] = []; items.sort((a, b) => b.y - a.y || a.x - b.x).forEach((it) => { const l = lines.find((L) => Math.abs(L.y - it.y) < 3); l ? l.items.push(it) : lines.push({ y: it.y, items: [it] }); });
      const grid = lines.map((L) => { const cells: any[] = []; let cur: any = null; L.items.sort((a, b) => a.x - b.x).forEach((it) => { if (cur && it.x - (cur.x + cur.w) < 6) { cur.s += ' ' + it.s; cur.w = it.x + it.w - cur.x; } else { cur = { ...it }; cells.push(cur); } }); return cells.map((c) => c.s); }).filter((r) => r.length > 1);
      up({ sel: n, grid, stage: 2, msg: grid.length ? '' : 'No multi-column rows on this page.' });
    } catch (e: any) { up({ msg: 'Extraction failed: ' + e.message }); }
  };
  const ncol = X.grid.length ? Math.max(...X.grid.map((r) => r.length)) : 0;
  const toValidator = () => {
    const rows = X.grid.map((r) => ({ entity: r[X.cols.e] || '', period: X.meta.period, metric: X.meta.metric, value: r[X.cols.v] || '', currency: 'KES', unit: X.meta.unit, basis: '', page_ref: 'p.' + X.sel, source_document: X.meta.doc, source_url: X.meta.url, extraction_date: CHECKED, status: X.meta.status }));
    const raw = { headers: FIELDS.map((f) => f[0]), rows };
    setStaged(validate(raw, Object.fromEntries(FIELDS.map((f) => [f[0], f[0]])), { period: '', srcurl: '', srcdoc: '', status: X.meta.status }, getState().imported));
    toast('Sent to the checker — review before anything is saved');
  };
  const steps = ['Upload PDF', 'Find tables', 'Review & correct', 'Map, units & period', 'Validate'];
  return <>
    <Note tone="info">Administrator workflow for IRA reports. Text is read in your browser with PDF.js. Extracted rows always go through the checker; nothing is saved until you confirm in Import data.</Note>
    <ol className="my-3 flex flex-wrap gap-2" aria-label="Extraction steps">{steps.map((s, k) => <li key={s} className={`rounded-lg px-3 py-1.5 text-[13px] ${X.stage === k || (k === 4 && staged) ? 'bg-navy-900 text-white' : X.stage > k ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{k + 1}. {s}</li>)}</ol>
    {X.msg && <Note>{X.msg}</Note>}
    {X.stage === 0 && <Card><label className="inline-flex min-h-[40px] cursor-pointer items-center rounded-lg bg-sky-700 px-4 font-medium text-white">Choose IRA PDF<input id="pdfFile" type="file" accept="application/pdf" hidden onChange={(e) => e.target.files?.[0] && open(e.target.files[0])} /></label><p className="mt-2 text-[13px] text-slate-500">IRA quarterly releases carry insurer tables in appendices; annual reports in the general-insurance chapter.</p></Card>}
    {X.stage === 1 && <Card><h3 className="font-semibold">{X.name} — {X.pages.length} pages ranked by likely insurer tables</h3><div className="mt-2"><Table><thead><tr><th>Page</th><th className="!text-right">Insurer names</th><th>Keywords</th><th>Preview</th><th /></tr></thead><tbody>{X.pages.slice().sort((a, b) => b.score - a.score).slice(0, 15).map((p) => <tr key={p.n}><td>p.{p.n}</td><Num>{p.names}</Num><td>{p.kw.join(', ')}</td><td className="text-xs text-slate-500">{p.text.slice(0, 110)}…</td><td><Btn small onClick={() => extract(p.n)}>Extract</Btn></td></tr>)}</tbody></Table></div><Btn className="mt-2" onClick={() => up({ stage: 0, msg: '' })}>Start again</Btn></Card>}
    {X.stage === 2 && <Card><h3 className="font-semibold">Page {X.sel} — {X.grid.length} rows. Correct cells; remove header, total and note rows.</h3>
      <div className="mt-2 overflow-x-auto"><table className="text-sm"><tbody>{X.grid.map((r, ri) => <tr key={ri}><td><Btn small aria-label="Remove row" onClick={() => up({ grid: X.grid.filter((_, k) => k !== ri) })}>✕</Btn></td>{r.map((c, ci) => <td key={ci} className="p-0.5"><input data-pcell={`${ri}:${ci}`} value={c} onChange={(e) => { const g = X.grid.map((row) => row.slice()); g[ri][ci] = e.target.value; up({ grid: g }); }} className="h-8 min-w-[90px] rounded border border-slate-200 px-1.5 text-[13px] dark:border-slate-700 dark:bg-slate-900" /></td>)}</tr>)}</tbody></table></div>
      <div className="mt-2 flex gap-2"><Btn onClick={() => up({ stage: 1 })}>Back</Btn><Btn primary onClick={() => up({ stage: 3 })}>Continue to mapping</Btn></div></Card>}
    {X.stage === 3 && <Card data-testid="pdf-map"><h3 className="font-semibold">Map columns, units and period</h3><div className="mt-2 grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
      <Field label="Insurer column"><select className={inputCls} value={X.cols.e} onChange={(e) => up({ cols: { ...X.cols, e: +e.target.value } })}>{[...Array(ncol).keys()].map((k) => <option key={k} value={k}>Column {k + 1} ({X.grid[0]?.[k] || ''})</option>)}</select></Field>
      <Field label="Value column"><select className={inputCls} value={X.cols.v} onChange={(e) => up({ cols: { ...X.cols, v: +e.target.value } })}>{[...Array(ncol).keys()].map((k) => <option key={k} value={k}>Column {k + 1} ({X.grid[0]?.[k] || ''})</option>)}</select></Field>
      <Field label="Metric"><select className={inputCls} value={X.meta.metric} onChange={(e) => up({ meta: { ...X.meta, metric: e.target.value } })}>{Object.keys(MKEY).filter((k, i, a) => a.findIndex((x) => MKEY[x] === MKEY[k]) === i).map((k) => <option key={k} value={k}>{k}</option>)}</select></Field>
      <Field label="Unit as printed"><select className={inputCls} value={X.meta.unit} onChange={(e) => up({ meta: { ...X.meta, unit: e.target.value } })}>{Object.keys(UNITS).map((u) => <option key={u}>{u}</option>)}</select></Field>
      <Field label="Reporting period"><input id="pdfPeriod" className={inputCls} value={X.meta.period} placeholder="FY2025 or 2025 Q4" onChange={(e) => up({ meta: { ...X.meta, period: e.target.value } })} /></Field>
      <Field label="Status"><select className={inputCls} value={X.meta.status} onChange={(e) => up({ meta: { ...X.meta, status: e.target.value } })}>{['VERIFIED', 'REPORTED', 'PENDING'].map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Source document"><input className={inputCls} value={X.meta.doc} onChange={(e) => up({ meta: { ...X.meta, doc: e.target.value } })} /></Field>
      <Field label="Official source URL"><input id="pdfUrl" className={inputCls} value={X.meta.url} placeholder="https://www.ira.go.ke/…" onChange={(e) => up({ meta: { ...X.meta, url: e.target.value } })} /></Field></div>
      <H2>Insurer matching</H2><Table><thead><tr><th>As printed</th><th>Matched to</th><th>Value</th></tr></thead><tbody>{X.grid.map((r, k) => { const m = resolveEntity(r[X.cols.e] || ''); return <tr key={k}><td>{r[X.cols.e]}</td><td>{m ? <>{m.legal} <Badge s="VERIFIED" label="matched" /></> : <Badge s="PENDING" label="no match — edit or remove" />}</td><td>{r[X.cols.v]}</td></tr>; })}</tbody></Table>
      <div className="mt-2 flex gap-2"><Btn onClick={() => up({ stage: 2 })}>Back</Btn><Btn primary onClick={toValidator} data-testid="pdf-send">Run the checker</Btn></div></Card>}
    {staged && <Card className="mt-3" data-testid="pdf-staged"><h3 className="font-semibold">5 · Checker result (not saved)</h3><p className="text-sm">{staged.rows ? staged.rows.filter((r) => r.ok).length : 0} row(s) pass, {staged.errors.length} error(s), {staged.warnings.length} warning(s).</p>
      {staged.errors.length > 0 && <ul className="list-disc pl-5 text-sm text-red-700">{staged.errors.slice(0, 15).map((e) => <li key={e}>{e}</li>)}</ul>}
      <p className="mt-2 text-sm">To save, copy the reviewed rows into <b>Import data</b> and confirm there — every import passes the same approval and superseded-archive rules.</p>
      <Btn className="mt-2" onClick={() => navigator.clipboard.writeText(JSON.stringify(X.grid.map((r) => ({ entity: r[X.cols.e], period: X.meta.period, metric: X.meta.metric, value: r[X.cols.v], unit: X.meta.unit, page_ref: 'p.' + X.sel, source_document: X.meta.doc, source_url: X.meta.url, status: X.meta.status })), null, 1)).then(() => toast('Reviewed rows copied as JSON'), () => toast('Copy blocked'))}>Copy reviewed rows (JSON)</Btn></Card>}
  </>;
}

function Audit() {
  const st = useStore();
  return st.history.length ? <Table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Record</th><th>Previous</th><th>New</th><th>Source</th><th>Status</th></tr></thead><tbody>{st.history.slice().reverse().map((h, k) => <tr key={k}><td className="text-xs">{h.at.slice(0, 16).replace('T', ' ')}</td><td>{h.who}</td><td>{h.action}</td><td>{h.key}</td><td>{h.prev ?? '—'}</td><td>{h.next ?? '—'}</td><td className="text-xs">{h.src ? <a className="text-sky-700 underline" href={h.src} target="_blank" rel="noopener">link</a> : '—'}</td><td>{h.status && <Badge s={h.status} />}</td></tr>)}</tbody></Table>
    : <Card className="text-center text-slate-500"><b className="block text-slate-800 dark:text-slate-100">No changes yet</b>Imports, replacements, archive actions, resolutions and backup restores are logged here.</Card>;
}

const SCHEMA = `model Insurer { id String @id  legalName String  tradingName String  category String  status InsurerStatus  aliases InsurerAlias[]  licenses LicenseRecord[]  contacts InsurerContact[]  metrics FinancialMetric[] }
model InsurerAlias { id String @id  insurerId String  name String  kind String  evidenceUrl String?  verification Verification }
model LicenseRecord { id String @id  insurerId String  noticeId String  classes String[]  status InsurerStatus  effectiveDate DateTime?  sourceId String }
model InsuranceClass { code String @id  legalName String  licenceKeyName String  statisticsLines String[] }
model SourceDocument { id String @id  institution String  title String  url String  publishedAt String?  reportingPeriod String?  sha256 String? }
model FinancialMetric { id String @id  insurerId String  metric MetricCode  periodEnd String  granularity Granularity  rawValue String  rawUnit String  currency String  valueKshM Decimal  basis String  tableRef String?  sourceId String  extractedAt DateTime  verification Verification  supersededById String? }
model ImportAudit { id String @id  at DateTime  by String  action String  recordKey String  previous String?  next String?  sourceUrl String?  verification Verification? }
model Resolution { id String @id  itemId String  acceptedValue String  justification String  by String  at DateTime }
model InsurerContact { id String @id  insurerId String  type String  value String  sourceUrl String  verifiedAt DateTime  verification Verification }
enum Verification { VERIFIED REPORTED DISPUTED PENDING SUPERSEDED }
enum InsurerStatus { ACTIVE STATMGMT RECEIVERSHIP RUNOFF HISTORICAL UNVERIFIED }`;
function Model() {
  return <><Card><PipelineStepper /></Card>
    <Lead>The browser holds the same entities a production backend would (PostgreSQL via Prisma, authenticated admin roles). Reporting period, metric definition, raw value and source are first-class fields.</Lead>
    <div className="mt-2"><Table><thead><tr><th>Entity</th><th>Held here as</th><th className="!text-right">Records</th></tr></thead><tbody>{[['Insurer / LicenseRecord', 'reference.js RAW_GI + EXTRA', INSURERS.length], ['InsurerAlias', 'ALIASES', ALIASES.length], ['InsurerContact', 'CONTACTS', Object.values(CONTACTS).flat().length], ['InsuranceClass', 'CLASSES', CLASSES.length], ['InsuranceProduct', 'PRODUCTS', PRODUCTS.length], ['FinancialMetric', 'public/data/ira_general.json + imports', FIN.ready ? `${Object.keys(FIN.comp).length} companies × ${FIN.P.length} periods` : '—'], ['SourceDocument', 'SOURCES + IRA workbook manifest', SOURCES.length + (FIN.ready ? Object.keys(FIN.wb).length : 0)], ['RegulatoryNotice', 'FEED', FEED.length], ['LegalReference', 'LEGAL', LEGAL.length]].map((r) => <tr key={r[0] as string}><td className="font-semibold">{r[0]}</td><td>{r[1]}</td><Num>{r[2]}</Num></tr>)}</tbody></Table></div>
    <div className="mt-3"><Btn onClick={() => navigator.clipboard.writeText(SCHEMA).then(() => toast('Schema copied'), () => toast('Copy blocked'))}>Copy Prisma schema</Btn></div>
    <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800">{SCHEMA}</pre></>;
}
