import { useState } from 'react'
import './App.css'

type CustomerCandidate = {
  userId: string
  displayName: string
  mobile: string
  city: string
}

type AmbiguousItem = {
  orderName: string
  orderMobile: string
  orderDate: string
  orderNo: string
  note: string
  candidates: CustomerCandidate[]
}

type UnmatchedItem = {
  orderName: string
  orderMobile: string
  orderDate: string
  orderNo: string
  note: string
  reason: string
}

type MatchResponse = {
  summary: {
    orderCount: number
    customerCount: number
    matchedCount: number
    ambiguousCount: number
    unmatchedCount: number
  }
  ambiguous: AmbiguousItem[]
  unmatched: UnmatchedItem[]
  exportCsv: string
  error?: string
}

async function readFileAsText(file: File): Promise<string> {
  return file.text()
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [customersFile, setCustomersFile] = useState<File | null>(null)
  const [ordersFile, setOrdersFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MatchResponse | null>(null)

  async function runMatch() {
    setError(null)
    setResult(null)
    if (!customersFile || !ordersFile) {
      setError('請先分別上傳顧客名單與訂單 CSV')
      return
    }
    setLoading(true)
    try {
      const [customersCsv, ordersCsv] = await Promise.all([
        readFileAsText(customersFile),
        readFileAsText(ordersFile),
      ])
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customersCsv, ordersCsv }),
      })
      const data = (await res.json()) as MatchResponse & { error?: string }
      if (!res.ok) {
        setError(data.error || `比對失敗（${res.status}）`)
        return
      }
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <h1>顧客訂單對應工具</h1>
        <p>
          上傳 AgentONE 顧客名單與訂單 CSV，依姓名對到顧客 ID 後匯出範本格式。
          同名與對不到只顯示在畫面，不進下載檔。
        </p>
      </header>

      <div className="upload-grid">
        <section className="slot">
          <h2>顧客名單</h2>
          <p className="hint">
            AgentONE 匯出：需含「顯示名稱」「AgentONE 用戶 ID」；建議含電話、城市
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setCustomersFile(e.target.files?.[0] ?? null)
              setResult(null)
            }}
          />
          {customersFile ? (
            <div className="file-meta">已選：{customersFile.name}</div>
          ) : null}
        </section>

        <section className="slot">
          <h2>訂單</h2>
          <p className="hint">
            需含姓名；電話／日期／數量／價格／備註／訂單編號可依常見別名自動對應
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setOrdersFile(e.target.files?.[0] ?? null)
              setResult(null)
            }}
          />
          {ordersFile ? (
            <div className="file-meta">已選：{ordersFile.name}</div>
          ) : null}
        </section>
      </div>

      <div className="actions">
        <button
          className="btn"
          type="button"
          disabled={loading || !customersFile || !ordersFile}
          onClick={() => void runMatch()}
        >
          {loading ? '比對中…' : '執行比對'}
        </button>
        {result && result.summary.matchedCount > 0 ? (
          <button
            className="btn secondary"
            type="button"
            onClick={() =>
              downloadCsv(
                result.exportCsv,
                `orders-export-${new Date().toISOString().slice(0, 10)}.csv`,
              )
            }
          >
            下載匯出 CSV（僅唯一對中）
          </button>
        ) : null}
      </div>

      {error ? <div className="error">{error}</div> : null}

      {result ? (
        <>
          <div className="summary">
            <span className="chip">
              訂單 <strong>{result.summary.orderCount}</strong>
            </span>
            <span className="chip">
              顧客 <strong>{result.summary.customerCount}</strong>
            </span>
            <span className="chip">
              可匯出 <strong>{result.summary.matchedCount}</strong>
            </span>
            <span className="chip">
              同名待確認 <strong>{result.summary.ambiguousCount}</strong>
            </span>
            <span className="chip">
              對不到 <strong>{result.summary.unmatchedCount}</strong>
            </span>
          </div>

          <section className="section ambiguous">
            <h3>同名待確認（不進匯出）</h3>
            {result.ambiguous.length === 0 ? (
              <p className="empty">無</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>訂單姓名</th>
                      <th>訂單電話</th>
                      <th>訂單日期</th>
                      <th>訂單編號</th>
                      <th>候選顧客（ID／電話／城市）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.ambiguous.map((row, i) => (
                      <tr key={`a-${i}`}>
                        <td>{row.orderName}</td>
                        <td>{row.orderMobile}</td>
                        <td>{row.orderDate}</td>
                        <td>{row.orderNo}</td>
                        <td>
                          <ul className="candidates">
                            {row.candidates.map((c, j) => (
                              <li key={`c-${i}-${j}`}>
                                {c.displayName}｜{c.userId}｜{c.mobile}｜
                                {c.city || '—'}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="section unmatched">
            <h3>對不到（不進匯出）</h3>
            {result.unmatched.length === 0 ? (
              <p className="empty">無</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>訂單姓名</th>
                      <th>訂單電話</th>
                      <th>訂單日期</th>
                      <th>訂單編號</th>
                      <th>原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.unmatched.map((row, i) => (
                      <tr key={`u-${i}`}>
                        <td>{row.orderName}</td>
                        <td>{row.orderMobile}</td>
                        <td>{row.orderDate}</td>
                        <td>{row.orderNo}</td>
                        <td>{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
