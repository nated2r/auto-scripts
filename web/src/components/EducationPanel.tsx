import { useEffect, useState } from 'react'
import {
  CUSTOM_MAX_CHARS,
  defaultAccount,
  loadAccount,
  saveAccount,
  type AccountEducation,
} from '../lib/account'

type Props = {
  onSaved?: (account: AccountEducation) => void
}

export function EducationPanel({ onSaved }: Props) {
  const [account, setAccount] = useState<AccountEducation>(defaultAccount)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    setAccount(loadAccount())
  }, [])

  function update<K extends keyof AccountEducation>(key: K, value: AccountEducation[K]) {
    setAccount((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    const next = {
      ...account,
      customInstructions: account.customInstructions.slice(0, CUSTOM_MAX_CHARS),
    }
    saveAccount(next)
    setAccount(next)
    setSavedAt(new Date().toLocaleTimeString('zh-TW'))
    onSaved?.(next)
  }

  function fillExample() {
    setAccount({
      ...account,
      identity: '我是幫助台灣爸媽看懂小孩情緒與行為的內容帳號',
      tone: '直接、有溫度；像朋友提醒，不要說教腔',
      hashtagCta:
        '固定 tag：#教養 #親子溝通\nCTA：留言關鍵字領懶人包（勿每支都用「懶人包」當關鍵字）',
      doDont: '要：場景代入、具體行為\n不要：羞辱小孩、空泛雞湯、無關領域 hashtag',
      sampleCopy: '（把你覺得語感最對的一支口播貼這裡）',
      bannedTopics: '純說教無鉤子\n羞辱式標題',
    })
  }

  return (
    <section className="panel education-panel">
      <header className="panel-head">
        <div>
          <h2>自定義規則</h2>
        </div>
        <div className="row gap desktop-only">
          <button type="button" className="btn ghost" onClick={fillExample}>
            填入範例
          </button>
          <button type="button" className="btn primary" onClick={handleSave}>
            儲存設定
          </button>
        </div>
      </header>

      {savedAt && <p className="toast">已儲存（{savedAt}）— 只存在此瀏覽器</p>}

      <label className="field">
        <span>身份</span>
        <textarea
          rows={2}
          value={account.identity}
          onChange={(e) => update('identity', e.target.value)}
          placeholder="可留空。例：領域、一句定位、目標觀眾"
        />
      </label>

      <label className="field">
        <span>語氣</span>
        <textarea
          rows={2}
          value={account.tone}
          onChange={(e) => update('tone', e.target.value)}
          placeholder="可留空。例：口語程度、禁用詞"
        />
      </label>

      <label className="field">
        <span>必要有的 hashtag 跟 CTA</span>
        <textarea
          rows={4}
          value={account.hashtagCta}
          onChange={(e) => update('hashtagCta', e.target.value)}
          placeholder="可留空。若填固定 tag，請填你這個帳號真正會用的（會每支都帶）；其餘標籤仍依本次題材"
        />
      </label>

      <label className="field">
        <span>要／不要</span>
        <textarea
          rows={3}
          value={account.doDont}
          onChange={(e) => update('doDont', e.target.value)}
          placeholder="可留空。例：要留言領取／不要療效保証"
        />
      </label>

      <label className="field">
        <span>口播文案參考區</span>
        <textarea
          rows={6}
          value={account.sampleCopy}
          onChange={(e) => update('sampleCopy', e.target.value)}
          placeholder="貼上你自己的爆流短影音口播稿當範本"
        />
      </label>

      <label className="field">
        <span>禁止使用的題材</span>
        <textarea
          rows={3}
          value={account.bannedTopics}
          onChange={(e) => update('bannedTopics', e.target.value)}
          placeholder="可留空。命中詞一行一個或用逗號分隔"
        />
      </label>

      <div className="field custom-block">
        <div className="row between">
          <span>自訂指令（進階）</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={account.customEnabled}
              onChange={(e) => update('customEnabled', e.target.checked)}
            />
            啟用
          </label>
        </div>
        <textarea
          rows={5}
          disabled={!account.customEnabled}
          value={account.customInstructions}
          maxLength={CUSTOM_MAX_CHARS}
          onChange={(e) => update('customInstructions', e.target.value)}
          placeholder="可留空。自由補充偏好；輸出格式底線（六欄／一次一角）仍會保留"
        />
        <p className="hint">
          {account.customInstructions.length}/{CUSTOM_MAX_CHARS} 字
        </p>
      </div>

      <div className="mobile-action-bar">
        <button type="button" className="btn ghost" onClick={fillExample}>
          填入範例
        </button>
        <button type="button" className="btn primary btn-block" onClick={handleSave}>
          儲存設定
        </button>
      </div>
    </section>
  )
}
