import cors from 'cors'
import express from 'express'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCsv, toExportCsv } from './csv.js'
import { matchOrdersToCustomers, toExportRows } from './match.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 8788

const app = express()
app.use(cors())
app.use(express.json({ limit: '32mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'customer-order-tool' })
})

type MatchBody = {
  customersCsv?: string
  ordersCsv?: string
}

app.post('/api/match', (req, res) => {
  try {
    const body = req.body as MatchBody
    const customersCsv = body.customersCsv?.trim() ?? ''
    const ordersCsv = body.ordersCsv?.trim() ?? ''
    if (!customersCsv) {
      res.status(400).json({ error: '請上傳顧客名單 CSV' })
      return
    }
    if (!ordersCsv) {
      res.status(400).json({ error: '請上傳訂單 CSV' })
      return
    }

    const customers = parseCsv(customersCsv)
    const orders = parseCsv(ordersCsv)
    const result = matchOrdersToCustomers(
      customers.rows,
      customers.headers,
      orders.rows,
      orders.headers,
    )
    const exportRows = toExportRows(result.matched)
    const exportCsv = toExportCsv(exportRows)

    res.json({
      summary: result.summary,
      matched: result.matched,
      ambiguous: result.ambiguous,
      unmatched: result.unmatched,
      exportCsv,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(400).json({ error: message })
  }
})

const distPath = join(__dirname, '..', 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    res.sendFile(join(distPath, 'index.html'), (err) => {
      if (err) next(err)
    })
  })
  console.log(`[api] 已掛載前端靜態檔：${distPath}`)
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[api] customer-order-tool http://0.0.0.0:${PORT}`)
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[api] 埠 ${PORT} 已被占用`)
  } else {
    console.error('[api] 啟動失敗', err)
  }
  process.exit(1)
})
