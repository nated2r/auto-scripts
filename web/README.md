# 自動產稿機器人｜網頁版（本機）

貼新聞稿或參考口播 → IG／FB 約 30 秒口播稿（六欄可貼 Google Sheet）。

## 本機測試

**建議雙擊專案根目錄** `start-local.bat`（已實機驗證）

會自動進 `web/`、清掉佔用埠、開啟瀏覽器並執行 `npm run dev`。

### 手動

1. 確認 `web/.env` 有：

```
DEEPSEEK_API_KEY=sk-你的金鑰
```

2. 在 `web/`：

```powershell
npm install
npm run dev
```

瀏覽器：**http://localhost:5173**  
API：**http://localhost:8787**

## 自定義規則

欄位：身份、語氣、必要有的 hashtag 跟 CTA、要／不要、標準文案範例、禁止使用的題材、自訂指令（上限 3000 字）。  
**開箱用系統預設；有填才客製那一塊。** 設定存在此瀏覽器 localStorage。

## Prompt 優先序

系統硬規則 → 自定義規則（僅非空欄位）→ 本次貼文
