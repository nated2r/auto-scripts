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

export type CustomerField = 'displayName' | 'mobile' | 'platformId' | 'city'

const ORDER_ALIASES: Record<OrderField, string[]> = {
  // 優先收件人姓名；不含「訂購人」（Luckycat 常為公司／帳號名）
  name: [
    '收件姓名',
    '收件人姓名',
    '收件人',
    '姓名',
    '名字',
    '客戶姓名',
    '顧客姓名',
    'name',
    'customername',
    'customer_name',
    '客戶名稱',
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
  // note ← 備註 only（不自動併入訂購商品）
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
  // 匯出 customerId 只用平台 ID；勿綁 AgentONE 用戶 ID／泛用「用戶 id」
  platformId: [
    '平台 id',
    '平台id',
    'platform id',
    'platform_id',
    'platformid',
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

/** 依別名陣列優先順序找表頭（前面的別名優先，避免誤綁較弱欄位） */
function findAlias(
  headers: string[],
  aliases: string[],
): string | undefined {
  for (const alias of aliases) {
    const na = normalizeHeader(alias)
    for (const header of headers) {
      if (normalizeHeader(header) === na) return header
    }
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
