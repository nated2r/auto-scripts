import { useEffect, useState } from 'react'
import { EducationPanel } from './components/EducationPanel'
import { GeneratePanel } from './components/GeneratePanel'
import { loadAccount, type AccountEducation } from './lib/account'
import './App.css'

type Tab = 'generate' | 'education'

export default function App() {
  const [tab, setTab] = useState<Tab>('generate')
  const [account, setAccount] = useState<AccountEducation>(loadAccount)

  useEffect(() => {
    setAccount(loadAccount())
  }, [])

  function goGenerate() {
    setAccount(loadAccount())
    setTab('generate')
  }

  function goEducation() {
    setTab('education')
  }

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden />
      <header className="top">
        <div className="brand">
          <p className="brand-mark">自動產稿機器人</p>
          <p className="brand-sub">新聞／口播 → IG・FB 約 30 秒高留言稿</p>
        </div>
        <div className="top-actions">
          <nav className="tabs desktop-tabs" aria-label="主選單">
            <button
              type="button"
              className={tab === 'generate' ? 'tab on' : 'tab'}
              onClick={goGenerate}
            >
              產稿
            </button>
            <button
              type="button"
              className={tab === 'education' ? 'tab on' : 'tab'}
              onClick={goEducation}
            >
              自定義規則
            </button>
          </nav>
          <a
            className="tg-back"
            href="https://t.me/chaddirbot"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              className="tg-back-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="currentColor"
                d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
              />
            </svg>
            回到轉錄機器人
          </a>
        </div>
      </header>

      <main className="main">
        {tab === 'generate' ? (
          <GeneratePanel account={account} />
        ) : (
          <EducationPanel
            onSaved={(next) => {
              setAccount(next)
            }}
          />
        )}
      </main>

      <footer className="foot">
        <span>DeepSeek・繁中台灣白話</span>
      </footer>

      <nav className="mobile-tabs" aria-label="手機主選單">
        <button
          type="button"
          className={tab === 'generate' ? 'mobile-tab on' : 'mobile-tab'}
          onClick={goGenerate}
        >
          產稿
        </button>
        <button
          type="button"
          className={tab === 'education' ? 'mobile-tab on' : 'mobile-tab'}
          onClick={goEducation}
        >
          規則
        </button>
      </nav>
    </div>
  )
}
