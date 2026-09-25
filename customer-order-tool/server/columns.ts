/** 訂單／顧客 CSV 欄位別名對應 */

export type OrderField =
  | 'name'
  | 'mobile'
  | 'orderDate'
  | 'type'
  | 'count'
  | 'price'
  | 'note'
  | 'orderNo'

export type CustomerField = 'displayName' | 'mobile' | 'userId' | 'city'

/**
 * 各欄別名依優先順序排列：先出現的別名優先於 CSV 欄位順序。
 * 姓名：收件人資訊 > 一般姓名欄 > 訂購人（常為店家／帳號名）
 */
const ORDER_ALIASES: Record<OrderField, string[]> = {
  name: [
    '收件姓名',
    '收件人',
    '顧客姓名',
    '客戶姓名',
    '姓名',
    '名字',
    'name',
    'customername',
    'customer_name',
    '客戶名稱',
    '訂購人',
  ],
  mobile: [
    '收件電話',
    '電話',
    '手機',
    '電話/手機',
    '聯絡電話',
    '手機號碼',
    'mobile',
    'phone',
    'tel',
  ],
  orderDate: [
    '訂單日期',
    '日期',
    '下單日期',
    '訂購日期',
    'orderdate',
    'order_date',
    'date',
  ],
  type: ['類型', '訂單類型', 'type', 'ordertype', 'order_type'],
  count: ['數量', 'count', 'qty', 'quantity', '件數'],
  price: [
    '訂單金額',
    '價格',
    '金額',
    '單價',
    '售價',
    'price',
    'amount',
  ],
  note: ['備註', 'note', 'remark', 'memo', '說明'],
  orderNo: [
    '訂單編號',
    '訂單號',
    '訂單号码',
    '單號',
    'orderno',
    'order_no',
    'orderid',
    'order_id',
    'order number',
  ],
}

const CUSTOMER_ALIASES: Record<CustomerField, string[]> = {
  displayName: ['顯示名稱', 'displayname', 'display_name', '名稱', '姓名'],
  mobile: ['電話/手機', '電話', '手機', 'mobile', 'phone'],
  userId: [
    'agentone 用戶 id',
    'agentone用戶id',
    '用戶 id',
    '用戶id',
    'userid',
    'user_id',
    'customerid',
    'customer_id',
  ],
  city: [
    '位置（現居城市）',
    '位置(現居城市)',
    '現居城市',
    '城市',
    '位置',
    'city',
  ],
}

function normalizeHeader(h: string): string {
  return String(h ?? '')
    .normalize('NFKC')
    .replace(/[\u3000\s]+/g, '')
    .toLowerCase()
}

/**
 * 依別名陣列優先順序找表頭（別名順序勝於 CSV 欄位順序）。
 */
function findAlias(
  headers: string[],
  aliases: string[],
): string | undefined {
  const byNorm = new Map<string, string>()
  for (const header of headers) {
    const nh = normalizeHeader(header)
    if (nh && !byNorm.has(nh)) byNorm.set(nh, header)
  }
  for (const alias of aliases) {
    const hit = byNorm.get(normalizeHeader(alias))
    if (hit) return hit
  }
  return undefined
}

export function mapOrderColumns(
  headers: string[],
): Partial<Record<OrderField, string>> {
  const result: Partial<Record<OrderField, string>> = {}
  for (const field of Object.keys(ORDER_ALIASES) as OrderField[]) {
    const hit = findAlias(headers, ORDER_ALIASES[field])
    if (hit) result[field] = hit
  }
  return result
}

export function mapCustomerColumns(
  headers: string[],
): Partial<Record<CustomerField, string>> {
  const result: Partial<Record<CustomerField, string>> = {}
  for (const field of Object.keys(CUSTOMER_ALIASES) as CustomerField[]) {
    const hit = findAlias(headers, CUSTOMER_ALIASES[field])
    if (hit) result[field] = hit
  }
  return result
}

export const EXPORT_HEADERS = [
  'customerId',
  'mobile',
  'orderDate',
  'type',
  'count',
  'price',
  'note',
  'orderNo',
] as const

export type ExportRow = Record<(typeof EXPORT_HEADERS)[number], string>
