import type { AccountEducation, GenerateMode } from './types'
import { CUSTOM_MAX_CHARS, LAZY_PACK_MAX_CHARS } from './types'
import { loadKnowledgeFile } from './knowledge'

const WEB_HARD_CONSTRAINTS = `
════════════════════════════════════════
網頁工具硬約束（輸出格式底線）
════════════════════════════════════════
1. 一律台灣繁體中文，禁止簡體字。
2. 禁用陸網用語（如：視頻、點讚、搞錢、挺好的、資訊量、賦能）。
3. 輸出必須為六欄 tab 分隔表格（封面文案、影片標題、口播稿、內文、hashtag、懶人包整理），欄間不可空行，整段包在程式碼區塊內。
4. ANGLE_MATRIX：本則回覆只能產出「一個角度」。
5. 口播稿以 150 字為基準（語感優先可略超）；目標約 30–45 秒。
6. 懶人包整理欄位完整可用，但總字數上限約 ${LAZY_PACK_MAX_CHARS} 字：含標題、精簡步驟、短 Q&A 即可，禁止長篇大論或灌水。
7. 「自定義規則」採增量覆寫：使用者有填的欄位才依其內容調整；空白欄位一律維持系統原始設定，不要自行腦補使用者沒寫的偏好。
8. 若使用者提供「口播文案參考區」範本，語感與結構必須對齊範例，但仍遵守輸出格式底線。
9. 封面／內文／懶人包若需換行：請輸出「真正的換行字元」，外層可用 ASCII 直引號 " 包住整段。嚴格禁止寫出字面 \\n、\\t、\\r 這類轉義字串（不要出現反斜線加 n）。
10. 【覆寫系統層 bash 條款】系統層若提到「用 bash 計算字數」：在本網頁一律改為自行心算／估算即可。絕對禁止輸出 echo、wc、bash、shell、管道符號指令或任何終端機指令。使用者要的是口播六欄表，不是指令。
11. 最終回覆型態唯一合法：一個 markdown 程式碼區塊，內含「直式」六欄 tab 表。每一欄独占一行，格式為：欄位名 + Tab + 內容。禁止輸出橫式表頭（不要把六個欄位名排在同一行）。
12. hashtag 必須跟「本次題材／稿件」高度相關，共 5 個：
   - 若自定義規則有填「固定 hashtag」：最多帶入其中 2 個固定 tag，其餘 3 個必須從本次題材選搜尋意圖明確的詞。
   - 若未填固定 hashtag：5 個全部依本次題材／口播內容產生，禁止亂帶無關領域（例如題材是教養就不要出現理財、存錢、健身等無關 tag）。
   - 禁止為了湊數複製舊範例或跨領域固定词。
13. 【去除 AI 味｜口播／內文／封面／標題一律適用】
   - 寫成真人在鏡頭前隨口講，短句、可斷句、可換氣；禁止「作文腔／簡報腔／客服腔」。
   - 禁用 AI 套句與過渡詞：首先、其次、再來、最後、總而言之、綜上所述、值得注意的是、不可否認、在這個快節奏／數位時代、讓我們一起、接下來我們來看看、不僅…而且…、與此同時、換句話說、換言之、本質上、賦能、底層邏輯（當空話用時）、深度剖析、全面解析。
   - 禁用空泛開場／收尾：今天來聊聊、相信很多人、你有沒有發現、希望對你有幫助、別忘了按讚追蹤（除非使用者自訂 CTA 明確要求）、以上就是…。
   - 少用排比堆疊與對稱句（「不是A是B、不是C是D、不是E是F」連發）；資訊用具體場景與後果講，不要像條列講義。
   - 不要解釋自己在產稿、不要寫「作為AI」、不要後設說明寫作手法。
   - 產出後自檢：若聽起來像 ChatGPT／小編文案，重寫到像台灣人私訊朋友那樣講。
正確範例：
封面文案	短標兩行用引號包
影片標題	標題文字
口播稿	口播全文
內文	"多行內文"
hashtag	#a #b #c #d #e
懶人包整理	"懶人包全文"
`.trim()

function clip(text: string, max: number): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}\n…（已截斷至 ${max} 字）`
}

export function buildSystemPrompt(): string {
  const core = loadKnowledgeFile('system')
  let bannedGuide = ''
  try {
    bannedGuide = loadKnowledgeFile('banned')
  } catch {
    bannedGuide = ''
  }
  return [
    core,
    WEB_HARD_CONSTRAINTS,
    bannedGuide
      ? `════════════════════════════════════════\n稀釋／禁止題材方法論（供判斷）\n════════════════════════════════════════\n${bannedGuide}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

/** 只組有填寫的自定義區塊；全空則回傳空字串 */
export function buildCustomizationBlock(account: AccountEducation): string {
  const parts: string[] = []

  const push = (label: string, value: string) => {
    const v = value.trim()
    if (!v) return
    parts.push(`■ ${label}\n${v}`)
  }

  push('身份', account.identity)
  push('語氣', account.tone)
  push('必要有的 hashtag 跟 CTA', account.hashtagCta)
  push('要／不要', account.doDont)
  push('口播文案參考區', account.sampleCopy)
  push('禁止使用的題材', account.bannedTopics)

  if (account.customEnabled) {
    const custom = clip(account.customInstructions || '', CUSTOM_MAX_CHARS)
    if (custom) {
      parts.push(`■ 自訂指令\n${custom}`)
    }
  }

  if (parts.length === 0) {
    return ''
  }

  return [
    '【自定義規則｜增量覆寫】',
    '規則：下列「有出現的欄位」才依使用者文字調整；沒列出的欄位＝維持系統原始設定，不要假設或補齊未填偏好。',
    '若有「必要有的 hashtag 跟 CTA」：其中的固定 hashtag 僅在與本次題材合理相關時使用；其餘 hashtag 必須精準對應本次題材，不可帶入無關領域。',
    parts.join('\n\n'),
  ].join('\n')
}

export function buildUserPrompt(opts: {
  mode: GenerateMode
  input: string
  angle: number
  account: AccountEducation
}): string {
  const { mode, input, angle, account } = opts

  const customization = buildCustomizationBlock(account)
  const customizationOrDefault =
    customization ||
    '【自定義規則】全部空白 → 完全依系統原始設定產稿，不要自行加入未提供的帳號偏好。'

  const task =
    mode === 'rewrite'
      ? `【本次任務｜ANGLE_MATRIX 改寫】
使用者貼上參考口播／新聞稿，請判定為 ANGLE_MATRIX：從稿件萃取題材，套用完整規則重寫成爆款 30 秒口播。
一次只產出角度 ${angle}（1=反直覺型）。不要逐句照抄。

【參考稿／新聞】
${input.trim()}

【輸出格式強制】
- 只輸出直式六欄 tab 表，包在 \`\`\` 程式碼區塊內
- 每一行：欄位名 + Tab + 內容（封面文案／影片標題／口播稿／內文／hashtag／懶人包整理 各一行）
- 禁止橫式表頭（六個欄位名排同一行再下一列塞內容）
- 禁止 echo／wc／bash／任何 shell 指令
- 禁止字面 \\n 轉義；換行請用真正換行
- hashtag 必須精準對應本次題材（本題若非理財／存錢，禁止出現 #理財 #存錢 等無關 tag）`
      : `【本次任務｜ANGLE_MATRIX 題材展開】
題材：${input.trim()}
請只產出角度 ${angle}/7 的完整六欄口播稿（1 反直覺／2 測驗／3 解讀／4 情境／5 對照／6 警訊／7 情感共鳴）。
結尾在程式碼區塊外標記進度即可。

【輸出格式強制】
- 只輸出直式六欄 tab 表，包在 \`\`\` 程式碼區塊內
- 每一行：欄位名 + Tab + 內容（封面文案／影片標題／口播稿／內文／hashtag／懶人包整理 各一行）
- 禁止橫式表頭（六個欄位名排同一行再下一列塞內容）
- 禁止 echo／wc／bash／任何 shell 指令
- 禁止字面 \\n 轉義；換行請用真正換行
- hashtag 必須精準對應本次題材（本題若非理財／存錢，禁止出現 #理財 #存錢 等無關 tag）`

  return [customizationOrDefault, task].join('\n\n')
}
