# 顧客訂單對應工具

本機網頁小工具：上傳 **AgentONE 顧客名單** 與 **訂單 CSV**，用姓名對到顧客 ID，匯出符合訂單匯入範本的 CSV。同名／對不到只顯示在畫面，不進下載檔。

## 需求

- Node.js 18+（Windows／macOS／Linux）
- 瀏覽器（Chrome／Edge／Safari 皆可）

## 安裝與啟動

在專案目錄 `customer-order-tool/`：

```bash
npm ci
npm run dev
```

- 前端：http://localhost:5174  
- API：http://localhost:8788  

瀏覽器開啟前端網址即可操作。

### 正式建置（單一服務）

```bash
npm ci
npm run build
npm start
```

之後開啟 http://localhost:8788 （Express 會一併提供前端靜態檔）。

### Windows（PowerShell／cmd）

```bat
cd customer-order-tool
npm ci
npm run dev
```

### macOS（Terminal）

```bash
cd customer-order-tool
npm ci
npm run dev
```

## 使用方式

1. **顧客名單**：上傳 AgentONE 匯出 CSV（需含 `顯示名稱`、`AgentONE 用戶 ID`；建議含 `電話/手機`、`位置（現居城市）`）
2. **訂單**：上傳訂單 CSV（需含姓名；電話／日期／數量／價格／備註／訂單編號支援常見別名）
3. 按「執行比對」
4. 「下載匯出 CSV」僅含**唯一對中**列；表頭固定為：

   `customerId,mobile,orderDate,type,count,price,note,orderNo`

5. 「同名待確認」「對不到」僅畫面顯示，不會進匯出檔

## 比對規則

| 情況 | 行為 |
|------|------|
| 姓名正規化後剛好 1 位顧客 | 寫入匯出：`customerId`←用戶 ID；`mobile`←訂單電話（空則顧客電話）；`count` 空→`1`；`type` 空→`一般訂單` |
| 同名 ≥2 | 僅「同名待確認」表 |
| 0 筆 | 僅「對不到」表 |

姓名正規化：Unicode NFKC（全形→半形）並移除所有空白。

## 訂單欄位別名（節錄）

- 姓名：`收件姓名`／`收件人姓名`／`收件人`／`姓名`／`客戶姓名`／`name`…（**不含** `訂購人`；Luckycat 等檔請用收件人）
- 電話：`收件電話`／`電話`／`手機`／`mobile`…
- 日期：`訂單日期`／`訂購日期`／`下單日期`／`date`…（若值為 `YYYY-MM-DD/…` 匯出只取日期段）
- 數量：`數量`／`件數`／`qty`…
- 價格：`訂單金額`／`價格`／`金額`／`price`…
- 備註：`備註`／`note`…（不自動併入訂購商品）
- 訂單編號：`訂單編號`／`單號`／`orderNo`…

## 驗收／Smoke

```bash
npm run smoke
```

會用 `fixtures/customers-sample.csv` + `fixtures/orders-sample.csv`（及別名／Luckycat 風格訂單）驗證比對與匯出 BOM。

## 埠號

預設與主專案短影音工具錯開：前端 `5174`、API `8788`。可用環境變數 `PORT` 改 API 埠。
