/**
 * Spreadsheet helpers for import/export. SheetJS is loaded on demand so the
 * ~400 KB parser only ships when someone actually imports or exports.
 */

export type SheetRow = Record<string, unknown> & { __line: number };

/** "Stock Qty " → "stockqty": header matching ignores case, spaces and symbols. */
export const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Reads the first sheet of an .xlsx / .xls / .csv file into rows keyed by normalized header. */
export async function readSheet(file: File): Promise<{ headers: string[]; rows: SheetRow[] }> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return { headers: [], rows: [] };

  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true });
  const headerIndex = raw.findIndex((r) => r.some((c) => String(c).trim() !== ""));
  if (headerIndex < 0) return { headers: [], rows: [] };

  const headers = raw[headerIndex].map((h) => String(h).trim());
  const keys = headers.map(normalizeHeader);
  const rows: SheetRow[] = [];
  for (let i = headerIndex + 1; i < raw.length; i++) {
    const cells = raw[i];
    if (!cells.some((c) => String(c).trim() !== "")) continue;
    const row: SheetRow = { __line: i + 1 };
    keys.forEach((k, j) => {
      if (k) row[k] = cells[j];
    });
    rows.push(row);
  }
  return { headers, rows };
}

/** First non-empty value among several accepted header spellings. */
export function pick(row: SheetRow, ...names: string[]): unknown {
  for (const n of names) {
    const v = row[normalizeHeader(n)];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

export function text(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
}

/** Accepts 1299, "1,299", "₹1,299.50". Returns NaN for junk so the server reports the row. */
export function num(v: unknown): number | undefined {
  if (v === undefined || v === null || String(v).trim() === "") return undefined;
  if (typeof v === "number") return v;
  return Number(String(v).replace(/[₹,\s]/g, ""));
}

export function bool(v: unknown): boolean | undefined {
  const s = text(v)?.toLowerCase();
  if (s === undefined) return undefined;
  if (["yes", "y", "true", "1", "active", "shown"].includes(s)) return true;
  if (["no", "n", "false", "0", "hidden", "inactive"].includes(s)) return false;
  return undefined;
}

/** Excel dates arrive as Date objects (cellDates); text dates are passed through. */
export function isoDate(v: unknown): string | undefined {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    // Keep the calendar day the user typed, regardless of timezone.
    const d = new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate(), 12));
    return d.toISOString();
  }
  const s = text(v);
  if (!s) return undefined;
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/); // 12/10/2026 → day first (India)
  if (m) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(Date.UTC(year, Number(m[2]) - 1, Number(m[1]), 12)).toISOString();
  }
  return s;
}

export interface Column<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
  width?: number;
}

/** Writes rows to an .xlsx download. */
export async function exportSheet<T>(filename: string, rows: T[], columns: Column<T>[], sheetName = "Sheet1") {
  const XLSX = await import("xlsx");
  const data = [
    columns.map((c) => c.header),
    ...rows.map((r) => columns.map((c) => c.value(r) ?? "")),
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = columns.map((c) => ({ wch: c.width ?? Math.max(10, c.header.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

/** A ready-to-fill template: header row plus example rows. */
export async function downloadTemplate(filename: string, headers: string[], examples: (string | number)[][]) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(12, h.length + 4) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, filename);
}

export const today = () => new Date().toISOString().slice(0, 10);
