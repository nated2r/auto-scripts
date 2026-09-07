import { useMemo, useState } from 'react'
import {
  ANGLE_LABELS,
  extractTableBlock,
  type AccountEducation,
  type GenerateMode,
  type GenerateResponse,
} from '../lib/account'
import { FIELD_ORDER, normalizeTableForCopy, parseSixColumns } from '../lib/parseScript'

type Props = {
  account: AccountEducation
}

export function GeneratePanel({ account }: Props) {
  const [mode, setMode] = useState<GenerateMode>('rewrite')
  const [input, setInput] = useState('')
  const [angle, setAngle] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<{
    warning: string
    suggestion?: string
  } | null>(null)
  const [raw, setRaw] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const table = useMemo(() => (raw ? extractTableBlock(raw) : ''), [raw])
  const fields = useMemo(() => (table ? parseSixColumns(table) : {}), [table])
  const filledFields = FIELD_ORDER.filter((k) => Boolean(fields[k]))
  const hasFields = filledFields.length >= 2

  async function runGenerate(confirmContinue = false) {
    setLoading(true)
    setError(null)
    setWarning(null)
    setPendingConfirm(null)
    setCopied(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          input,
          angle,
          account,
          confirmContinue,
        }),
      })
      const data = (await res.json()) as GenerateResponse

      if ('needsConfirm' in data && data.needsConfirm) {
        setPendingConfirm({
          warning: data.warning,
          suggestion: data.suggestion,
        })
        return
      }

      if (!data.ok) {
        setError(data.error || '產稿失敗')
        return
      }

      setRaw(data.raw)
      if (data.warning) setWarning(data.warning)
      requestAnimationFrame(() => {
        if (window.matchMedia('(max-width: 899px)').matches) {
          document
            .getElementById('generate-result')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '網路錯誤')
    } finally {
      setLoading(false)
    }
  }

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <section className="panel generate-panel">
      <header className="panel-head">
        <div>
          <h2>產稿</h2>
          <p className="muted">貼新聞／參考口播改寫，或輸入題材展開單一角度。</p>
        </div>
      </header>

      <div className="generate-layout">
        <div className="generate-input">
          <div className="seg" role="tablist">
            <button
              type="button"
              className={mode === 'rewrite' ? 'seg-item on' : 'seg-item'}
              onClick={() => setMode('rewrite')}
            >
              貼稿改爆款
            </button>
            <button
              type="button"
              className={mode === 'topic' ? 'seg-item on' : 'seg-item'}
              onClick={() => setMode('topic')}
            >
              題材展開
            </button>
          </div>

          <label className="field">
            <span>{mode === 'rewrite' ? '新聞稿／參考口播' : '題材名稱'}</span>
            <textarea
              rows={mode === 'rewrite' ? 10 : 3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'rewrite'
                  ? '貼上要改寫的內容…'
                  : '例如：加班到很晚還刷手機'
              }
            />
          </label>

          <label className="field angle-field">
            <span>角度（一次只出一個）</span>
            <select value={angle} onChange={(e) => setAngle(Number(e.target.value))}>
              {ANGLE_LABELS.map((label, i) => (
                <option key={label} value={i + 1}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="row gap action-row desktop-only">
            <button
              type="button"
              className="btn primary"
              disabled={loading || !input.trim()}
              onClick={() => runGenerate(false)}
            >
              {loading ? '產稿中…' : '開始產稿'}
            </button>
          </div>

          {pendingConfirm && (
            <div className="banner warn">
              <p>{pendingConfirm.warning}</p>
              {pendingConfirm.suggestion && <p>{pendingConfirm.suggestion}</p>}
              <button
                type="button"
                className="btn"
                disabled={loading}
                onClick={() => runGenerate(true)}
              >
                仍要繼續產稿
              </button>
            </div>
          )}

          {error && <div className="banner err">{error}</div>}
          {warning && !pendingConfirm && <div className="banner warn">{warning}</div>}
        </div>

        <div className="generate-result" id="generate-result">
          {raw ? (
            <div className="output">
              <div className="row between output-head">
                <h3>產出</h3>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() =>
                    copyText('all', table ? normalizeTableForCopy(table) : raw)
                  }
                >
                  {copied === 'all' ? '已複製' : '複製六欄貼 Sheet'}
                </button>
              </div>

              {hasFields ? (
                <div className="field-cards">
                  {FIELD_ORDER.map((name) => {
                    const value = fields[name]
                    if (!value) return null
                    return (
                      <article key={name} className="field-card">
                        <div className="row between">
                          <h4>{name}</h4>
                          <button
                            type="button"
                            className="btn ghost tiny"
                            onClick={() => copyText(name, value)}
                          >
                            {copied === name ? '已複製' : '複製'}
                          </button>
                        </div>
                        <pre className="field-body">{value}</pre>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <pre className="code-out">{table || raw}</pre>
              )}

              <details className="raw-details">
                <summary>原始六欄／完整回覆</summary>
                <pre className="code-out dim">{raw}</pre>
              </details>
            </div>
          ) : (
            <div className="output-empty desktop-only">
              <p>產完會出現在這裡，方便對照貼稿與結果。</p>
            </div>
          )}
        </div>
      </div>

      <div className="mobile-action-bar">
        <button
          type="button"
          className="btn primary btn-block"
          disabled={loading || !input.trim()}
          onClick={() => void runGenerate(false)}
        >
          {loading ? '產稿中…' : '開始產稿'}
        </button>
      </div>
    </section>
  )
}
