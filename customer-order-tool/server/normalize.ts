/** 姓名／字串正規化：全形轉半形，並移除所有空白（含全形空白） */
export function normalizeName(raw: string): string {
  if (!raw) return ''
  let s = String(raw).normalize('NFKC')
  // 比對鍵不保留空白，讓「王 小明」與「王小明」視為同名
  s = s.replace(/[\u3000\s]+/g, '')
  return s.trim()
}

export function normalizePhone(raw: string): string {
  if (!raw) return ''
  let s = String(raw).normalize('NFKC')
  s = s.replace(/[\s\-()（）]/g, '')
  return s.trim()
}

/**
 * 訂單日期正規化：LuckyCat 等平台常為 `2026-09-22/202638`，
 * 匯出只保留 `/` 前的日期部分。
 */
export function normalizeOrderDate(raw: string): string {
  if (!raw) return ''
  const s = String(raw).normalize('NFKC').trim()
  const slash = s.indexOf('/')
  if (slash >= 0) return s.slice(0, slash).trim()
  return s
}
