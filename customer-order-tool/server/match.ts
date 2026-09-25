import {
  mapCustomerColumns,
  mapOrderColumns,
  type ExportRow,
} from './columns.js'
import { cell, type CsvRow } from './csv.js'
import {
  normalizeName,
  normalizeOrderDate,
  normalizePhone,
} from './normalize.js'

export type CustomerCandidate = {
  userId: string
  displayName: string
  mobile: string
  city: string
}

export type MatchedExport = ExportRow & {
  orderName: string
  matchCount: 1
}

export type AmbiguousItem = {
  orderName: string
  orderMobile: string
  orderDate: string
  orderNo: string
  note: string
  candidates: CustomerCandidate[]
}

export type UnmatchedItem = {
  orderName: string
  orderMobile: string
  orderDate: string
  orderNo: string
  note: string
  reason: string
}

export type MatchResult = {
  matched: MatchedExport[]
  ambiguous: AmbiguousItem[]
  unmatched: UnmatchedItem[]
  summary: {
    orderCount: number
    customerCount: number
    matchedCount: number
    ambiguousCount: number
    unmatchedCount: number
    orderColumns: Partial<Record<string, string>>
    customerColumns: Partial<Record<string, string>>
  }
}

function getField(
  row: CsvRow,
  mapping: Partial<Record<string, string>>,
  field: string,
): string {
  return cell(row, mapping[field])
}

export function matchOrdersToCustomers(
  customerRows: CsvRow[],
  customerHeaders: string[],
  orderRows: CsvRow[],
  orderHeaders: string[],
): MatchResult {
  const customerColumns = mapCustomerColumns(customerHeaders)
  const orderColumns = mapOrderColumns(orderHeaders)

  if (!customerColumns.displayName || !customerColumns.userId) {
    throw new Error(
      '顧客名單缺少必要欄位：需要「顯示名稱」與「AgentONE 用戶 ID」（或等價別名）',
    )
  }
  if (!orderColumns.name) {
    throw new Error(
      '訂單缺少必要欄位：需要姓名欄（收件姓名／收件人／客戶姓名／姓名／訂購人 等）',
    )
  }

  const byName = new Map<string, CustomerCandidate[]>()
  for (const row of customerRows) {
    const displayName = getField(row, customerColumns, 'displayName')
    const key = normalizeName(displayName)
    if (!key) continue
    const candidate: CustomerCandidate = {
      userId: getField(row, customerColumns, 'userId'),
      displayName,
      mobile: normalizePhone(getField(row, customerColumns, 'mobile')),
      city: getField(row, customerColumns, 'city'),
    }
    const list = byName.get(key) ?? []
    list.push(candidate)
    byName.set(key, list)
  }

  const matched: MatchedExport[] = []
  const ambiguous: AmbiguousItem[] = []
  const unmatched: UnmatchedItem[] = []

  for (const row of orderRows) {
    const orderName = getField(row, orderColumns, 'name')
    const key = normalizeName(orderName)
    const orderMobileRaw = getField(row, orderColumns, 'mobile')
    const orderMobile = normalizePhone(orderMobileRaw)
    const orderDate = normalizeOrderDate(
      getField(row, orderColumns, 'orderDate'),
    )
    const orderNo = getField(row, orderColumns, 'orderNo')
    const note = getField(row, orderColumns, 'note')
    const price = getField(row, orderColumns, 'price')
    const countRaw = getField(row, orderColumns, 'count')
    const typeRaw = getField(row, orderColumns, 'type')

    if (!key) {
      unmatched.push({
        orderName,
        orderMobile,
        orderDate,
        orderNo,
        note,
        reason: '訂單姓名為空',
      })
      continue
    }

    const candidates = byName.get(key) ?? []

    if (candidates.length === 1) {
      const c = candidates[0]!
      matched.push({
        customerId: c.userId,
        mobile: orderMobile || c.mobile,
        orderDate,
        type: typeRaw || '一般訂單',
        count: countRaw || '1',
        price,
        note,
        orderNo,
        orderName,
        matchCount: 1,
      })
    } else if (candidates.length >= 2) {
      ambiguous.push({
        orderName,
        orderMobile,
        orderDate,
        orderNo,
        note,
        candidates: candidates.map((c) => ({ ...c })),
      })
    } else {
      unmatched.push({
        orderName,
        orderMobile,
        orderDate,
        orderNo,
        note,
        reason: '姓名對不到顧客',
      })
    }
  }

  return {
    matched,
    ambiguous,
    unmatched,
    summary: {
      orderCount: orderRows.length,
      customerCount: customerRows.length,
      matchedCount: matched.length,
      ambiguousCount: ambiguous.length,
      unmatchedCount: unmatched.length,
      orderColumns,
      customerColumns,
    },
  }
}

/** 匯出列：僅範本表頭、僅唯一對中 */
export function toExportRows(matched: MatchedExport[]): ExportRow[] {
  return matched.map(
    ({ customerId, mobile, orderDate, type, count, price, note, orderNo }) => ({
      customerId,
      mobile,
      orderDate,
      type,
      count,
      price,
      note,
      orderNo,
    }),
  )
}
