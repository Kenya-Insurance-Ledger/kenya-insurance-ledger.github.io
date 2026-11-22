// Import validation: column mapping, units, periods, names, duplicates, sources, definitions.
// Nothing here writes data; commit() in the Import view applies an approved preview.
import { FIN, INSURERS, MET, val, idxOf, fmt } from './fin';
import { ALIASES, CHECKED } from '../data/reference.js';

export const FIELDS: [string, string, boolean][] = [['entity', 'Insurer', true], ['period', 'Reporting period', true], ['metric', 'Metric', true], ['value', 'Original value', true], ['currency', 'Currency', false], ['unit', 'Unit', true], ['basis', 'Definition / basis', false], ['page_ref', 'Table / page reference', false], ['source_document', 'Source document', false], ['source_url', 'Source URL', true], ['extraction_date', 'Extraction date', false], ['status', 'Verification status', false]];
const SYN: Record<string, string[]> = { entity: ['entity', 'insurer', 'company', 'name'], period: ['period', 'reporting_period'], metric: ['metric', 'measure'], value: ['value', 'amount', 'original_value'], currency: ['currency', 'ccy'], unit: ['unit', 'units'], basis: ['basis', 'definition'], page_ref: ['page_ref', 'page', 'table', 'table_ref'], source_document: ['source_document', 'source_name', 'document', 'source'], source_url: ['source_url', 'url', 'link'], extraction_date: ['extraction_date', 'extracted'], status: ['status', 'verification', 'verification_status'] };
export const MKEY: Record<string, string> = { 'gross written premium': 'gpi', 'gross premium income': 'gpi', gwp: 'gpi', 'gross direct premium': 'gdp', 'net written premium': 'nwp', 'net earned premium': 'nep', 'claims incurred': 'clm', 'claims paid': 'cpaid', 'underwriting result': 'uw', 'loss ratio': 'lr', 'expense ratio': 'er', 'combined ratio': 'cr', 'market share': 'ms', 'investment income': 'inv', 'profit before tax': 'pbt', 'profit after tax': 'pat', 'total assets': 'ta', 'shareholders funds': 'eq', "shareholders' funds": 'eq', 'capital adequacy ratio': 'car', 'capital adequacy': 'car' };
export const UNITS: Record<string, number> = { KES: 1e-6, KES_000: 1e-3, KES_m: 1, KES_bn: 1000, pct: 1 };

export function normPeriod(p: string) {
  p = String(p || '').trim(); let m;
  if ((m = p.match(/^(\d{4}) Q([1-4])$/))) return { period: p, gran: 'YTD' };
  if ((m = p.match(/^FY ?(\d{4})$/i))) return { period: `${m[1]} Q4`, gran: 'YTD' };
  if ((m = p.match(/^H1[- ](\d{4})$/i))) return { period: `${m[1]} Q2`, gran: 'YTD' };
  if ((m = p.match(/^9M[- ](\d{4})$/i))) return { period: `${m[1]} Q3`, gran: 'YTD' };
  if ((m = p.match(/^Q([1-4])[- ](\d{4}) YTD$/i))) return { period: `${m[2]} Q${m[1]}`, gran: 'YTD' };
  if ((m = p.match(/^Q([1-4])[- ](\d{4})$/i))) return { period: `${m[2]} Q${m[1]}`, gran: m[1] === '1' ? 'YTD' : 'QTR' };
  return null;
}
export function parseCSV(text: string) {
  const rows: string[][] = []; let row: string[] = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some((x) => x.trim())) rows.push(row); row = []; } else cur += c; }
  row.push(cur); if (row.some((x) => x.trim())) rows.push(row);
  if (rows.length < 2) throw new Error('Need a header row and at least one data row.');
  const h = rows[0].map((x) => x.trim());
  return { headers: h, rows: rows.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, (r[i] ?? '').trim()]))) };
}
export function parseInput(text: string, format: string) {
  if (format === 'json') { let d = JSON.parse(text); if (!Array.isArray(d)) d = [d]; if (!d.length) throw new Error('Empty JSON array.'); const h = [...new Set(d.flatMap((o) => Object.keys(o)))] as string[]; return { headers: h, rows: d.map((o) => Object.fromEntries(h.map((k) => [k, o[k] == null ? '' : String(o[k])]))) }; }
  return parseCSV(text);
}
export const autoMap = (h: string[]) => Object.fromEntries(FIELDS.map(([f]) => [f, h.find((x) => SYN[f].includes(x.toLowerCase().replace(/\s+/g, '_'))) || '']));
export function resolveEntity(name: string) {
  const n = String(name).toLowerCase().trim(); if (!n) return null;
  const hit = INSURERS.find((i) => i.legal.toLowerCase() === n || i.trading.toLowerCase() === n || i.irasNames.some((a) => a.toLowerCase() === n)) || (() => { const al = ALIASES.find((a) => a.name.toLowerCase() === n); return al ? INSURERS.find((i) => i.id === al.to) : null; })();
  return hit ? { legal: hit.legal, id: hit.id, fid: hit.fid } : null;
}

export function validate(raw: { headers: string[]; rows: any[] }, map: Record<string, string>, defaults: any, existing: any[]) {
  const errors: string[] = [], warnings: string[] = [];
  FIELDS.filter((f) => f[2]).forEach(([f, l]) => { if (!map[f] && !(f === 'source_url' && defaults.srcurl) && !(f === 'period' && defaults.period)) errors.push(`Required field “${l}” is not mapped to a column.`); });
  if (errors.length) return { errors, warnings, rows: null };
  const seen = new Set<string>(); const out: any[] = [];
  raw.rows.forEach((r, n) => {
    const g = (f) => (map[f] ? String(r[map[f]] ?? '').trim() : ''); const line = 'Row ' + (n + 1);
    const rec: any = { _i: n, entityIn: g('entity'), periodIn: g('period') || defaults.period, metric: g('metric'), raw: g('value'), currency: (g('currency') || 'KES').toUpperCase(), unit: g('unit'), basis: g('basis'), pageRef: g('page_ref'), srcdoc: g('source_document') || defaults.srcdoc, srcurl: g('source_url') || defaults.srcurl, extracted: g('extraction_date') || CHECKED, status: (g('status') || defaults.status).toUpperCase(), ok: true, action: 'add' };
    const err = (m) => { rec.ok = false; errors.push(line + ': ' + m); }, warn = (m) => warnings.push(line + ': ' + m);
    if (!rec.entityIn) err('missing insurer'); const ent = resolveEntity(rec.entityIn);
    if (rec.entityIn && !ent) err(`“${rec.entityIn}” does not match any insurer, trading name or documented former name`); else if (ent) Object.assign(rec, { entity: ent.legal, eid: ent.id, fid: ent.fid });
    const np = normPeriod(rec.periodIn); if (!np) err(`period “${rec.periodIn}” not recognised (2025 Q4, FY2025, H1-2025, 9M-2025, Q3-2025 YTD, Q3-2025)`); else Object.assign(rec, np);
    rec.mkey = MKEY[rec.metric.toLowerCase()]; if (!rec.mkey) err(`metric “${rec.metric}” is not defined`);
    const num = rec.raw.replace(/[,\s]/g, '').replace(/^\((.*)\)$/, '-$1'); if (!/^-?\d+(\.\d+)?$/.test(num)) err(`value “${rec.raw}” is not numeric`);
    if (!(rec.unit in UNITS)) err('unit must be KES, KES_000, KES_m, KES_bn or pct'); if (rec.currency !== 'KES' && rec.unit !== 'pct') err('currency must be KES');
    if (rec.mkey && MET[rec.mkey]) { const pct = MET[rec.mkey].unit === 'pct'; if (pct && rec.unit !== 'pct') err(MET[rec.mkey].label + ' must use unit pct'); if (!pct && rec.unit === 'pct') err(MET[rec.mkey].label + ' is an amount, not a percentage'); }
    if (rec.ok) rec.valueM = parseFloat(num) * UNITS[rec.unit];
    if (!rec.srcurl) err('missing source URL — every number needs a source'); else if (!/^https?:\/\//.test(rec.srcurl)) err('source URL must start with http(s)://');
    if (!rec.pageRef) warn('no table/page reference');
    if (!['VERIFIED', 'REPORTED', 'DISPUTED', 'PENDING'].includes(rec.status)) err('status must be VERIFIED, REPORTED, DISPUTED or PENDING');
    if (rec.status === 'VERIFIED' && rec.srcurl && !/ira\.go\.ke|kenyalaw\.org|pcf\.go\.ke/.test(rec.srcurl)) warn('marked VERIFIED but the source is not IRA, PCF or Kenya Law');
    if (rec.mkey === 'gpi' && /net/i.test(rec.basis)) err('basis says net but metric is gross — inconsistent definition');
    if (['nep', 'nwp'].includes(rec.mkey) && /gross/i.test(rec.basis)) err('basis says gross but metric is net — inconsistent definition');
    if (rec.gran === 'QTR') warn('single-quarter value — kept separate from year-to-date series');
    const key = [rec.entity, rec.period, rec.mkey, rec.gran].join('|');
    if (rec.ok && seen.has(key)) err('duplicate of another row in this batch'); if (rec.ok) seen.add(key);
    if (rec.ok) {
      const dup = existing.find((e) => [e.entity, e.period, e.mkey, e.gran].join('|') === key);
      if (dup) { rec.action = 'replace'; rec.prev = dup; rec.diff = rec.valueM - dup.valueM; warn(`replaces existing ${dup.raw} ${dup.unit} (${dup.status}) — needs your approval; original archived as SUPERSEDED`); }
      if (rec.fid && FIN.ready && rec.gran === 'YTD' && MET[rec.mkey].kind !== 'unavailable') { const i = idxOf(rec.period); if (i >= 0) { const cv = val(rec.fid, rec.mkey, i).v; if (cv != null) { const pct = cv ? (Math.abs(rec.valueM - cv) / Math.abs(cv)) * 100 : 0; if (pct > 0.5) { rec.conflict = { compiled: cv, pct }; warn(`differs ${pct.toFixed(2)}% from the reconstructed IRA figure ${fmt(cv, MET[rec.mkey].unit)} — logged as a competing value in the audit queue, not an overwrite`); } } } }
    }
    out.push(rec);
  });
  return { errors, warnings, rows: out };
}
export const TEMPLATE_CSV = `entity,period,metric,value,currency,unit,basis,page_ref,source_document,source_url,extraction_date,status
CIC General Insurance Limited,FY2025,Claims Paid,,KES,KES_000,Claims paid (gross),Table __ p.__,IRA claims settlement statistics Q4 2025,https://www.ira.go.ke/,${CHECKED},PENDING
CIC General Insurance Limited,FY2025,Net Written Premium,,KES,KES_000,Net written premium,Table __ p.__,IRA Insurance Industry Annual Report 2025,https://www.ira.go.ke/,${CHECKED},PENDING
CIC General Insurance Limited,FY2025,Profit Before Tax,,KES,KES_000,Profit before tax,Table __ p.__,Insurer audited financial statements 2025,https://,${CHECKED},PENDING
CIC General Insurance Limited,FY2025,Capital Adequacy Ratio,,KES,pct,Capital adequacy ratio,Table __ p.__,IRA Insurance Industry Annual Report 2025,https://www.ira.go.ke/,${CHECKED},PENDING
`;
