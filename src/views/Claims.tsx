import React, { useState } from 'react';
import { TIMELINE, CHECKLISTS } from '../data/reference.js';
import { Badge, Card, H1, Lead, Note, Src, Table, Tabs, Btn, Checkbox, Unav, toast } from '../components/ui';
import { useStore, setState } from '../lib/store';
import { useApp } from '../App';

export function Explainer90() {
  const rows: [string, React.ReactNode][] = [
    ['Provision', 'Insurance Act, Cap. 487, s.203 (Settlement of claims)'],
    ['When it starts', '“Within ninety days of the date of the reporting of the claim” — or of a court’s determination where a court decides liability.'],
    ['What must be submitted', 'The duty is framed around the claimant submitting all relevant documents. The Act does not prescribe one claim form; the policy and insurer specify documents.'],
    ['What the insurer must do', 'Admit or deny liability, determine the amount, establish the claimant’s identity and pay.'],
    ['Extension', 'On the insurer’s application the Commissioner may extend by up to 30 days.'],
    ['Exemptions', 's.203(1A): does not apply to index-based insurance or micro-insurance claims.'],
    ['If unpaid', '5% penalty on the unpaid amount, payable to the PCF Board; persistent non-payment means the insurer is deemed unable to pay its debts (s.123).'],
    ['Your remedies', 'Written decision and assessment report (s.203(2)); complaint to the Commissioner (s.204A); Tribunal appeal within 30 days; courts/arbitration; PCF if the insurer fails (up to KSh 500,000 per claim from 1 Jan 2026).'],
  ];
  return <Card><h3 className="font-display font-semibold">The 90-day rule — Insurance Act s.203 <Badge s="VERIFIED" /></h3>
    <dl className="mt-2 grid gap-x-3 gap-y-1.5 text-sm sm:grid-cols-[170px_minmax(0,1fr)]">{rows.map(([a, b]) => <React.Fragment key={a}><dt className="text-slate-500">{a}</dt><dd>{b}</dd></React.Fragment>)}</dl>
    <Note>Not a universal rule: micro-insurance and index-based claims are excluded, and the clock depends on reporting and documents. Not legal advice.</Note><Src ids={['S2']} /></Card>;
}

export default function Claims() {
  const { sub, setSub } = useApp(); const st = useStore();
  const t = sub.claims || 'timeline';
  const [open, setOpen] = useState(0); const [ck, setCk] = useState(Object.keys(CHECKLISTS)[0]);
  const setCheck = (key, v) => { const c = { ...st.checks }; if (v) c[key] = 1; else delete c[key]; setState({ checks: c }); };
  let body: React.ReactNode = null;
  if (t === 'timeline') body = <ol className="grid gap-2">{TIMELINE.map((s, i) => <li key={i} className="grid grid-cols-[40px_minmax(0,1fr)] gap-3">
    <span className={`grid h-9 w-9 place-items-center rounded-full border-2 font-display font-bold ${open === i ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'}`}>{i + 1}</span>
    <div><button className="min-h-[36px] w-full text-left font-semibold" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>{s[0]}</button>
      {open === i && <Card className="!p-3"><dl className="grid gap-x-3 gap-y-1 text-sm sm:grid-cols-[160px_minmax(0,1fr)]">{['You should', 'Insurer generally', 'Documents', 'Common delays', 'Policy / legal conditions'].map((l, k) => <React.Fragment key={l}><dt className="text-slate-500">{l}</dt><dd>{s[k + 1]}</dd></React.Fragment>)}</dl></Card>}</div></li>)}</ol>;
  if (t === 'law') body = <><Explainer90 /><div className="mt-4"><Table><thead><tr><th>Type</th><th>Example</th><th>Binding on</th><th>Source</th></tr></thead><tbody>
    <tr><td className="font-semibold">Statutory deadline</td><td>Decide and pay within 90 days of reporting (+ up to 30)</td><td>Insurer (law)</td><td>s.203 <Badge s="VERIFIED" /></td></tr>
    <tr><td className="font-semibold">Contractual policy deadline</td><td>Notify “immediately” / within N days</td><td>Policyholder (contract)</td><td>Your policy wording</td></tr>
    <tr><td className="font-semibold">Industry service standard</td><td>Voluntary industry charters</td><td>Adopting members</td><td><Unav /></td></tr>
    <tr><td className="font-semibold">Internal insurer target</td><td>CIC General: discharge voucher 5 days (motor) / 14 days (non-motor) after assessor's reports</td><td>The insurer's own commitment</td><td>2022 service charter <Badge s="VERIFIED" /></td></tr></tbody></Table></div></>;
  if (t === 'checklists') { const items = CHECKLISTS[ck]; const done = items.filter((_, i) => st.checks['c:' + ck + ':' + i]).length; body = <>
    <div className="flex flex-wrap gap-1.5">{Object.keys(CHECKLISTS).map((n) => <Btn key={n} small primary={n === ck} onClick={() => setCk(n)}>{n}</Btn>)}</div>
    <Card className="mt-3"><h3 className="font-semibold">{ck} claim — documents</h3><div className="my-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><i className="block h-full bg-emerald-600" style={{ width: (done / items.length) * 100 + '%' }} /></div><p className="text-[13px] text-slate-500" data-testid="ck-progress">{done} of {items.length} ticked · saved in this browser (back up via the header)</p>
      {items.map((it, i) => <Checkbox key={i} checked={st.checks['c:' + ck + ':' + i]} onChange={(v) => setCheck('c:' + ck + ':' + i, v)}>{it}</Checkbox>)}
      <Btn small className="mt-2" onClick={() => { const c = { ...st.checks }; Object.keys(c).forEach((k) => k.startsWith('c:' + ck + ':') && delete c[k]); setState({ checks: c }); toast('Checklist reset'); }}>Reset</Btn></Card></>; }
  if (t === 'escalation') body = <div className="grid gap-2.5">{[
    ['1 — Insurer claims / customer service', 'Write to the claims department; quote policy and claim numbers.', 'Verified insurer contacts are on each directory page.'],
    ['2 — Complaints desk / Principal Officer', 'Write to the insurer\'s complaints unit with your timeline.', 'E.g. CIC complaint form; Britam complaints email (verified).'],
    ['3 — Insurance Regulatory Authority', 'Written complaint to the Commissioner under s.204A.', <>complaints@ira.go.ke · customercare@ira.go.ke · 0800 724 499 <Badge s="VERIFIED" /></>],
    ['4 — Insurance Appeals Tribunal / courts', 'Appeal an IRA determination within 30 days (s.204A(3)).', <>Tribunal contacts: <Unav /></>],
    ['If the insurer has failed', 'Claims move to the PCF. Maximum KSh 500,000 per claim from 1 January 2026.', <>PCF: +254 794 582 700 · info@pcf.go.ke <Badge s="VERIFIED" /></>]].map(([h, b, c]: any) => <Card key={h} className="border-l-4 !border-l-navy-800"><h3 className="font-semibold">{h}</h3><p className="text-sm">{b}</p><p className="text-[13px] text-slate-500">{c}</p></Card>)}<Src ids={['S2', 'S16', 'S22']} /></div>;
  return <><H1>Claims &amp; protection</H1>
    <Tabs items={[['timeline', 'Claims timeline'], ['law', 'Statutory guidance'], ['checklists', 'Document checklists'], ['escalation', 'Complaint escalation']]} value={t} onChange={(k) => setSub('claims', k)} />{body}</>;
}
