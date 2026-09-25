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
