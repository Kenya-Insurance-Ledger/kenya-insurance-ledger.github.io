import React, { useEffect, useRef } from 'react';
import { SRC, CHECKED } from '../data/reference.js';

export const STATUS_HELP: Record<string, string> = {
  VERIFIED: 'Exact figure or fact matched against an official primary document (IRA, PCF, Kenya Law, insurer’s own site).',
  REPORTED: 'Second-hand: from the reconstructed dataset, media, or an unconfirmed corporate transition.',
  DISPUTED: 'Flagged faulty return or unresolved conflict between credible sources. Excluded from rankings.',
  PENDING: 'Awaiting verification against an official source.',
  SUPERSEDED: 'Replaced by a newer record — archived, never deleted.',
  UNAVAILABLE: 'No sourced value. Nothing is estimated in its place.',
};
const TONE: Record<string, string> = {
  VERIFIED: 'bg-emerald-50 text-emerald-800 ring-emerald-600/30 dark:bg-emerald-950 dark:text-emerald-300',
  REPORTED: 'bg-sky-50 text-sky-800 ring-sky-600/30 dark:bg-sky-950 dark:text-sky-300',
  DISPUTED: 'bg-red-50 text-red-800 ring-red-600/40 ring-dashed dark:bg-red-950 dark:text-red-300',
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-600/30 dark:bg-amber-950 dark:text-amber-300',
  SUPERSEDED: 'bg-slate-100 text-slate-500 ring-slate-400/40 line-through dark:bg-slate-800',
  UNAVAILABLE: 'bg-slate-100 text-slate-500 ring-slate-400/40 dark:bg-slate-800 dark:text-slate-400',
};
export function Badge({ s, label }: { s: string; label?: string }) {
  return <span title={STATUS_HELP[s]} className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset align-middle ${TONE[s] || TONE.UNAVAILABLE}`}>{s === 'DISPUTED' && <span aria-hidden className="mr-1">⚠</span>}{label || s}</span>;
}
export const Unav = ({ text }: { text?: string }) => <span className="text-[13px] italic text-slate-500">{text || 'Data unavailable — requires official verification'}</span>;
export function SrcLink({ id, short }: { id: string; short?: boolean }) { const s = SRC[id]; return s ? <a title={`${s.inst} — ${s.name}`} className="underline decoration-slate-300 underline-offset-2 hover:text-sky-700" href={s.url} target="_blank" rel="noopener">{short ? s.inst.replace(/\s*\(.*\)/, '').split(/[,—]/)[0].trim() : `${s.inst} · ${s.id}`}</a> : <>{id}</>; }
export function Src({ ids }: { ids: string | string[] }) {
  const list = ([] as string[]).concat(ids).filter(Boolean);
  return <div className="mt-2 truncate text-[11.5px] text-slate-400" title={`Checked ${CHECKED}`}>↗ {list.map((id, i) => <React.Fragment key={id}>{i > 0 && ' · '}<SrcLink id={id} short /></React.Fragment>)}</div>;
}
/** Small (i) pop-over: keeps explanations one tap away instead of on the page. */
export function Info({ children, label = 'More information' }: any) {
  return <details className="group relative inline-block align-middle"><summary aria-label={label} className="grid h-5 w-5 cursor-pointer list-none place-items-center rounded-full border border-slate-300 text-[11px] font-semibold text-slate-500 hover:border-sky-600 hover:text-sky-700 [&::-webkit-details-marker]:hidden">i</summary>
    <div className="absolute right-0 z-30 mt-1.5 w-[min(300px,80vw)] rounded-lg border border-slate-200 bg-white p-3 text-[13px] font-normal leading-snug text-slate-700 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{children}</div></details>;
}
export const Card = ({ children, className = '', ...p }: any) => <div {...p} className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.04)] dark:border-slate-800 dark:bg-slate-900 ${className}`}>{children}</div>;
export function Kpi({ label, value, s, sub, src, accent }: any) {
  return <Card><div className="flex items-start justify-between gap-2"><div className="text-[13px] font-medium text-slate-500">{label}</div>{(sub || src) && <Info>{sub}{src && <Src ids={src} />}</Info>}</div>
    {value == null ? <div className="my-1 text-[15px] font-semibold text-slate-400">Unavailable</div> : <div className="my-1.5 whitespace-nowrap font-display text-[clamp(20px,2.2vw,28px)] font-bold leading-none tracking-tight">{value}</div>}
    <Badge s={value == null ? 'UNAVAILABLE' : s} /></Card>;
}
export function Tabs({ items, value, onChange }: { items: [string, string][]; value: string; onChange: (k: string) => void }) {
  return <div role="tablist" className="my-4 flex gap-1 overflow-x-auto rounded-xl bg-slate-200/60 p-1 dark:bg-slate-800">{items.map(([k, n]) => <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)} className={`min-h-[40px] flex-none whitespace-nowrap rounded-lg px-3.5 text-sm font-medium transition ${value === k ? 'bg-white text-navy-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}>{n}</button>)}</div>;
}
export const Note = ({ tone = 'warn', children }: any) => {
  const t = { warn: 'border-amber-500 bg-amber-50 dark:bg-amber-950/40', bad: 'border-red-600 bg-red-50 dark:bg-red-950/40', ok: 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40', info: 'border-sky-600 bg-sky-50 dark:bg-sky-950/40' }[tone];
  return <div className={`my-3 rounded-xl border-l-4 px-3.5 py-2.5 text-[13.5px] ${t}`}>{children}</div>;
};
export const H1 = ({ children }) => <h1 className="font-display text-[clamp(24px,3vw,32px)] font-bold leading-tight">{children}</h1>;
export const H2 = ({ children, className = '' }: any) => <h2 className={`mt-7 mb-2 font-display text-xl font-semibold ${className}`}>{children}</h2>;
export const Lead = ({ children }) => <p className="mt-1 max-w-[70ch] text-[15px] text-slate-500 dark:text-slate-400">{children}</p>;
export const Btn = ({ primary, small, className = '', ...p }: any) => <button {...p} className={`rounded-lg border px-3.5 font-medium disabled:cursor-not-allowed disabled:opacity-40 ${small ? 'min-h-[34px] text-[13px]' : 'min-h-[40px] text-sm'} ${primary ? 'border-sky-700 bg-sky-700 text-white hover:bg-sky-800' : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900'} ${className}`} />;
export const Field = ({ label, children }) => <label className="grid min-w-0 max-w-full gap-1 text-[13px] text-slate-500">{label}{children}</label>;
export const inputCls = 'max-w-full min-w-0 h-[42px] rounded-lg border border-slate-200 bg-white px-2.5 text-[15px] text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
export const Table = ({ children }) => <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"><table className="w-full border-collapse bg-white text-sm dark:bg-slate-900 [&_td]:border-b [&_td]:border-slate-100 [&_td]:px-2.5 [&_td]:py-2 [&_td]:align-top dark:[&_td]:border-slate-800 [&_th]:whitespace-nowrap [&_th]:bg-slate-50 [&_th]:px-2.5 [&_th]:py-2 [&_th]:text-left [&_th]:text-[12.5px] [&_th]:font-semibold [&_th]:text-slate-500 dark:[&_th]:bg-slate-800">{children}</table></div>;
export const Num = ({ children, className = '' }: any) => <td className={`whitespace-nowrap text-right tabular-nums ${className}`}>{children}</td>;

export function Drawer({ title, onClose, children }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { ref.current?.focus(); const k = (e) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  return <><div className="fixed inset-0 z-[70] bg-black/50" onClick={onClose} /><aside role="dialog" aria-modal="true" className="fixed inset-y-0 right-0 z-[75] w-full max-w-[680px] overflow-y-auto bg-white shadow-2xl dark:bg-slate-900">
    <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-display text-xl font-semibold">{title}</h2><button ref={ref} onClick={onClose} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 dark:border-slate-700">✕</button></div>
    <div className="p-4">{children}</div></aside></>;
}
export function Modal({ title, onClose, children }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  return <><div className="fixed inset-0 z-[70] bg-black/50" onClick={onClose} /><section role="dialog" aria-modal="true" className="fixed inset-[max(3vh,10px)] z-[75] overflow-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900 md:inset-x-[max(4vw,10px)]">
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-display text-xl font-semibold">{title}</h2><button onClick={onClose} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 dark:border-slate-700">✕</button></div>
    <div className="p-4">{children}</div></section></>;
}
let toastFn: (m: string) => void = () => {};
export const toast = (m: string) => toastFn(m);
export function Toaster() {
  const [m, setM] = React.useState(''); const t = useRef<any>();
  toastFn = (x) => { setM(x); clearTimeout(t.current); t.current = setTimeout(() => setM(''), 2800); };
  return m ? <div role="status" className="fixed bottom-5 left-1/2 z-[80] max-w-[92vw] -translate-x-1/2 rounded-lg bg-navy-900 px-4 py-3 text-sm text-white shadow-lg">{m}</div> : null;
}
export const Checkbox = ({ checked, onChange, children }: any) => <label className="flex cursor-pointer items-start gap-2.5 border-b border-dashed border-slate-200 py-2 dark:border-slate-700"><input type="checkbox" className="mt-0.5 h-5 w-5 flex-none accent-emerald-600" checked={!!checked} onChange={(e) => onChange(e.target.checked)} /><span>{children}</span></label>;
