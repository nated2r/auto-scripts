import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EXPORT_HEADERS } from '../server/columns.js'
import { parseCsv, toExportCsv } from '../server/csv.js'
import { matchOrdersToCustomers, toExportRows } from '../server/match.js'
import { normalizeName } from '../server/normalize.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixtures = join(__dirname, '..', 'fixtures')

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

function section(title: string) {
  console.log(`\n=== ${title} ===`)
}

section('normalizeName')
assert(normalizeName('  王　小明  ') === '王小明', '全形空白與前後空白應移除')
assert(normalizeName('ＡＢＣ商店') === 'ABC商店', '全形英數轉半形')

section('fixture match')
const customersText = readFileSync(
  join(fixtures, 'customers-sample.csv'),
  'utf8',
)
const ordersText = readFileSync(join(fixtures, 'orders-sample.csv'), 'utf8')
const customers = parseCsv(customersText)
const orders = parseCsv(ordersText)
const result = matchOrdersToCustomers(
  customers.rows,
  customers.headers,
  orders.rows,
  orders.headers,
)

console.log('summary', result.summary)
assert(result.summary.matchedCount === 3, `可匯出應為 3，實際 ${result.summary.matchedCount}`)
assert(result.summary.ambiguousCount === 1, `同名應為 1，實際 ${result.summary.ambiguousCount}`)
assert(result.summary.unmatchedCount === 2, `對不到應為 2，實際 ${result.summary.unmatchedCount}`)

const exportRows = toExportRows(result.matched)
assert(
  exportRows.every((r) => Object.keys(r).length === EXPORT_HEADERS.length),
  '匯出列應只有範本欄位',
)

const mei = exportRows.find((r) => r.orderNo === 'ORD-003')
assert(mei, '應有 ORD-003')
assert(mei.customerId === 'U20001', 'ORD-003 customerId')
assert(mei.mobile === '0912000000', '訂單電話優先於顧客電話')
assert(mei.count === '2', '數量來自訂單')
assert(mei.type === '一般訂單', 'type 預設一般訂單')

const abc = exportRows.find((r) => r.orderNo === 'ORD-004')
assert(abc?.customerId === 'U40001', '全形名稱應對到顧客')
assert(abc?.count === '1', '數量空則預設 1')
assert(abc?.mobile === '0933333333', '訂單電話空則用顧客電話')

const li = exportRows.find((r) => r.orderNo === 'ORD-007')
assert(li?.customerId === 'U30001', '李大同應對中')
assert(li?.mobile === '0922222222', '用顧客電話')

assert(
  !exportRows.some((r) => r.orderNo === 'ORD-002'),
  '同名 ORD-002 不可進匯出',
)
assert(
  !exportRows.some((r) => r.orderNo === 'ORD-005'),
  '對不到 ORD-005 不可進匯出',
)
assert(result.ambiguous[0]?.candidates.length === 2, '同名應有兩位候選')

const csvOut = toExportCsv(exportRows)
assert(csvOut.startsWith('\uFEFF'), '匯出應含 UTF-8 BOM')
assert(csvOut.includes('customerId,mobile,orderDate,type,count,price,note,orderNo'), '表頭')
assert(!csvOut.includes('orderName'), '匯出不可含內部欄位')

section('alias columns')
const aliasText = readFileSync(join(fixtures, 'orders-alias-alt.csv'), 'utf8')
const aliasOrders = parseCsv(aliasText)
const aliasResult = matchOrdersToCustomers(
  customers.rows,
  customers.headers,
  aliasOrders.rows,
  aliasOrders.headers,
)
assert(aliasResult.summary.matchedCount === 1, '別名訂單應對中 1 筆')
assert(aliasResult.matched[0]?.customerId === 'U30001', '李大同 ID')
assert(aliasResult.matched[0]?.type === '加購訂單', '保留訂單類型')
assert(aliasResult.matched[0]?.count === '3', '件數別名')

section('large customers sample (optional)')
const largePathCandidates = [
  join(fixtures, 'customers-real-sample.csv'),
  '/home/ubuntu/.cursor/projects/workspace/uploads/customers_20260925_090115_da2b.csv',
]
let largeLoaded = false
for (const p of largePathCandidates) {
  try {
    const text = readFileSync(p, 'utf8')
    const parsed = parseCsv(text)
    assert(parsed.headers.length > 0, '大檔應有表頭')
    assert(parsed.rows.length > 100, `大檔應有大量列，實際 ${parsed.rows.length}`)
    const mapped = matchOrdersToCustomers(
      parsed.rows,
      parsed.headers,
      orders.rows,
      orders.headers,
    )
    console.log('real customers sample ok:', {
      path: p,
      customers: mapped.summary.customerCount,
      matched: mapped.summary.matchedCount,
      ambiguous: mapped.summary.ambiguousCount,
      unmatched: mapped.summary.unmatchedCount,
    })
    largeLoaded = true
    break
  } catch {
    // try next
  }
}
if (!largeLoaded) {
  console.warn(
    'WARN: 真實顧客樣本 CSV 不在環境中；已用 fixtures/customers-sample.csv 完成 smoke。',
  )
}

console.log('\nAll smoke checks passed.')
