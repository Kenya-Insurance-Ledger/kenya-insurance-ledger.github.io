import React, { useState } from 'react';
import { FIN, INSURERS, fmt } from '../lib/fin';
import { CLASSES, CLS, PRODUCTS } from '../data/reference.js';
import { Badge, Card, H1, H2, Lead, Note, Src, Table, Num, Btn, Info, inputCls } from '../components/ui';
import { useApp } from '../App';

/** Count of licensed general insurers authorised for a code — always computed from the licence array. */
export const classCount = (code: string) => INSURERS.filter((i) => i.general && i.classes.includes(code)).length;

export default function Classes() {
  const { openProduct } = useApp();
  const [f, setF] = useState({ q: '', cls: '', cust: '', comp: '', sort: 1 });
  const gp = FIN.ready && FIN.mc['2025'] ? FIN.mc['2025'].gross_premium : null;
  const list = PRODUCTS.filter((p) => (!f.q || (p.name + p.over).toLowerCase().includes(f.q.toLowerCase())) && (!f.cls || p.codes.includes(f.cls)) && (!f.cust || p.cust.includes(f.cust)) && (!f.comp || (f.comp === 'c' ? /compulsory/i.test(p.compulsory) && !/voluntary/i.test(p.compulsory) : /voluntary/i.test(p.compulsory)))).sort((a, b) => a.name.localeCompare(b.name) * f.sort);
  return <>
    
    <H1>Classes &amp; products</H1>
    <Lead>14 legal classes = 14 IRA licence codes. Products and PSV sit inside them.</Lead>
    
    <div className="mt-5 mb-2 flex items-center gap-2"><h2 className="font-display text-xl font-semibold">Licence codes</h2><Badge s="VERIFIED" /><Info>Names from Insurance Regulations reg.10 / Third Schedule; codes from the IRA 2026 licence key. Insurer counts are computed from the licence list. Class premiums are sums of insurer rows in IRA Q4 2025 class tables. <Src ids={['S13', 'S1', 'S19']} /></Info></div>
    <Table><thead><tr><th>Code</th><th>Legal class</th><th>IRA statistics lines</th><th>Products</th><th className="!text-right">FY 2025 premium <Badge s="REPORTED" /></th><th className="!text-right">Insurers licensed</th></tr></thead>
      <tbody>{CLASSES.map((c) => { const v = gp && c.stat.length ? c.stat.reduce((a, k) => a + (gp[k] || 0), 0) : null; const ps = PRODUCTS.filter((p) => p.codes.includes(c.code)); return <tr key={c.code} data-code={c.code}>
        <td className="font-bold">{c.code}</td><td className="font-medium">{c.legal}</td>
        <td>{c.stat.length ? <ul>{c.stat.map((s) => <li key={s}>{s === 'Motor Commercial PSV' ? <span className="ml-3 text-slate-600 dark:text-slate-400">↳ PSV (statistical sub-line){gp ? ' · ' + fmt(gp[s]) : ''}</span> : s}</li>)}</ul> : <span className="text-slate-500">Microinsurance tables</span>}</td>
        <td><div className="flex flex-wrap gap-1">{ps.map((p) => <button key={p.id} className="rounded-full bg-sky-50 px-2 py-0.5 text-left text-[12px] text-sky-800 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300" onClick={() => openProduct(p.id)}>{p.name.replace(/ \(.*\)$/, '')}</button>)}</div></td>
        <Num>{v != null ? fmt(v) : '—'}</Num>
        <td className="count whitespace-nowrap text-right tabular-nums">{c.code === '13' ? <span className="text-slate-500">5 micro only</span> : <><span className="mr-2 inline-block h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 align-middle dark:bg-slate-800"><i className="block h-full bg-navy-800" style={{ width: (classCount(c.code) / 35) * 100 + '%' }} /></span>{classCount(c.code)} of 35</>}</td></tr>; })}</tbody></Table>
    
    <H2>Product explorer</H2>
    <div className="my-2 flex flex-wrap gap-2">
      <input type="search" aria-label="Search products" placeholder="Search products…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} className={inputCls + ' flex-[1_1_220px]'} />
      <select aria-label="Class" value={f.cls} onChange={(e) => setF({ ...f, cls: e.target.value })} className={inputCls}><option value="">All classes</option>{CLASSES.map((c) => <option key={c.code} value={c.code}>{c.code} {c.legal}</option>)}</select>
      <select aria-label="Customer" value={f.cust} onChange={(e) => setF({ ...f, cust: e.target.value })} className={inputCls}><option value="">All customers</option>{['Individual', 'Business', 'Professional'].map((c) => <option key={c}>{c}</option>)}</select>
      <select aria-label="Compulsory" value={f.comp} onChange={(e) => setF({ ...f, comp: e.target.value })} className={inputCls}><option value="">Compulsory &amp; voluntary</option><option value="c">Compulsory</option><option value="v">Voluntary</option></select>
      <Btn onClick={() => setF({ ...f, sort: -f.sort })}>Sort {f.sort === 1 ? 'A→Z' : 'Z→A'}</Btn></div>
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">{list.map((p) => <button key={p.id} onClick={() => openProduct(p.id)} className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-sky-400 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="font-display font-semibold">{p.name}</h3><div className="my-1.5 flex flex-wrap gap-1">{p.codes.map((c) => <span key={c} className="rounded border border-slate-200 px-1.5 text-[11.5px] dark:border-slate-700">{c} {CLS[c].name}</span>)}</div><p className="text-[13px] text-slate-600 dark:text-slate-400">{p.over}</p></button>)}
      {!list.length && <Card>No products match.</Card>}</div>
    
  </>;
}
