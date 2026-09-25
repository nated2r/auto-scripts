import Papa from 'papaparse'
import { EXPORT_HEADERS, type ExportRow } from './columns.js'

export type CsvRow = Record<string, string>

/** 去掉 BOM，解析 CSV 為物件列 */
export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const cleaned = text.replace(/^\uFEFF/, '')
  const result = Papa.parse<CsvRow>(cleaned, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => String(h ?? '').trim(),
  })
  if (result.errors.length > 0) {
    const fatal = result.errors.find((e) => e.type === 'Delimiter' || e.type === 'Quotes')
    if (fatal) {
      throw new Error(`CSV 解析失敗：${fatal.message}`)
    }
  }
  const headers = result.meta.fields?.filter(Boolean) ?? []
  const rows = (result.data ?? []).map((row) => {
    const out: CsvRow = {}
    for (const h of headers) {
      const v = row[h]
      out[h] = v == null ? '' : String(v).trim()
    }
    return out
  })
  return { headers, rows }
}

export function toExportCsv(rows: ExportRow[]): string {
  const csv = Papa.unparse({
    fields: [...EXPORT_HEADERS],
    data: rows.map((r) => EXPORT_HEADERS.map((h) => r[h] ?? '')),
  })
  return `\uFEFF${csv}`
}

export function cell(row: CsvRow, header: string | undefined): string {
  if (!header) return ''
  return row[header] ?? ''
}
