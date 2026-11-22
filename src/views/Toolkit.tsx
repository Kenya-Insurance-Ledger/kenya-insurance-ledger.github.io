import React, { useState } from 'react';
import { KYC, TOOLS } from '../data/reference.js';
import { Badge, Card, H1, Lead, Note, Src, Table, Tabs, Btn, Checkbox, Unav } from '../components/ui';
import { useStore, setState } from '../lib/store';
import { useApp } from '../App';

export function Explainer156() {
  return <Card><h3 className="font-display font-semibold">Premium before cover — Insurance Act s.156 <Badge s="VERIFIED" /></h3>
    <dl className="mt-2 grid gap-x-3 gap-y-1.5 text-sm sm:grid-cols-[170px_minmax(0,1fr)]">
      <dt className="text-slate-500">Core wording</dt><dd>s.156(1): “No insurer shall assume a risk in Kenya” until the premium has been received. Only this fragment is quoted — read the full section on Kenya Law.</dd>
      <dt className="text-slate-500">Commencement</dt><dd>Cover cannot start before the insurer receives the premium. A 2023 High Court decision treated full premium for a 3-year bond as a condition precedent.</dd>
      <dt className="text-slate-500">Intermediaries</dt><dd>s.156(2): may not receive premiums on the insurer's behalf (2019 amendment; challenged by brokers in 2021).</dd>
      <dt className="text-slate-500">Penalties</dt><dd>Intermediary 20% of unremitted premium; officers fine or imprisonment; insurer KES 5m per contravention for paying commission later than 30 days after receiving premium.</dd>
      <dt className="text-slate-500">Exceptions</dt><dd><Unav text="None verified — none shown" />. An earlier version allowed brokers 60 days' credit <Badge s="SUPERSEDED" />.</dd></dl><Src ids={['S2', 'S14', 'S34']} /></Card>;
}
function List({ title, items, prefix }) {
  const st = useStore(); const done = items.filter((_, i) => st.checks[prefix + i]).length;
  const set = (k, v) => { const c = { ...st.checks }; if (v) c[k] = 1; else delete c[k]; setState({ checks: c }); };
  return <Card><h3 className="font-semibold">{title}</h3><div className="my-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><i className="block h-full bg-emerald-600" style={{ width: (done / items.length) * 100 + '%' }} /></div><p className="text-[13px] text-slate-500">{done} of {items.length} complete</p>
    {items.map((it, i) => <Checkbox key={i} checked={st.checks[prefix + i]} onChange={(v) => set(prefix + i, v)}>{it}</Checkbox>)}</Card>;
}
export default function Toolkit() {
  const { sub, setSub } = useApp(); const t = sub.toolkit || 'licensing'; const [tl, setTl] = useState(Object.keys(TOOLS)[0]);
  const body = {
    licensing: <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
      <Card><h3 className="font-semibold">Legal requirements <Badge s="VERIFIED" /></h3><ul className="list-disc pl-5 text-sm"><li>Only licensed persons may carry on insurance business (s.19).</li><li>Brokers, agents, risk managers, motor assessors must be licensed (s.150); ss.151–153 on applications, disqualification, re-licensing.</li><li>Do not place risks with insurers under statutory management (s.67C).</li></ul><Src ids={['S2', 'S27']} /></Card>
      <Card><h3 className="font-semibold">Not yet verified</h3><p className="text-sm">Agent qualifications, broker capital/bonds, renewal deadlines, CPD: <Unav /></p></Card>
      <Card><h3 className="font-semibold">Best practice (not statutory)</h3><ul className="list-disc pl-5 text-sm"><li>Check status and authorised classes in the directory first.</li><li>Personal and health data fall under the Data Protection Act (s.25).</li></ul></Card></div>,
    premium: <Explainer156 />,
    kyc: <><Note tone="info">POCAMLA 2009, its Regulations, and IRA's AML/CFT Guidelines 2020. IRA guidance focuses on life and investment-related business; reach into purely general business is unverified. <Src ids={['S11', 'S25']} /></Note><List title="KYC / AML reference checklist" items={KYC} prefix="k:" /></>,
    commission: <Table><thead><tr><th>Category</th><th>What we know</th><th>Status</th></tr></thead><tbody>
      <tr><td className="font-semibold">Regulatory limits</td><td>s.73 restricts rebates and brokerage; maximum rates not extracted.</td><td><Badge s="PENDING" /></td></tr>
      <tr><td className="font-semibold">Payment timing</td><td>Within 30 days of the insurer receiving premium (s.156(5)).</td><td><Badge s="VERIFIED" /></td></tr>
      <tr><td className="font-semibold">Market rates</td><td>No percentages shown until sourced.</td><td><Badge s="UNAVAILABLE" /></td></tr></tbody></Table>,
    tools: <><div className="mb-3 flex flex-wrap gap-1.5">{Object.keys(TOOLS).map((n) => <Btn key={n} small primary={n === tl} onClick={() => setTl(n)}>{n}</Btn>)}</div><List title={tl + ' checklist'} items={TOOLS[tl]} prefix={'t:' + tl + ':'} /></>,
  }[t];
  return <><H1>Agent &amp; broker toolkit</H1>
    <Tabs items={[['licensing', 'Licensing'], ['premium', 'Premium & s.156'], ['kyc', 'KYC & AML'], ['commission', 'Commission'], ['tools', 'Business tools']]} value={t} onChange={(k) => setSub('toolkit', k)} />{body}</>;
}
