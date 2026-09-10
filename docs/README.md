# 自動產稿機器人｜產品簡報

風格參考你 ChatGPT「記住簡報風格」對話：16:9 資訊圖卡、LINE 綠＋深藍、大標題、圓角卡片、底部 slogan。

## 建議看這個（新｜圖卡版）

| 檔案 | 說明 |
|------|------|
| `自動產稿機器人_產品簡報_圖卡版.pptx` | **整頁圖卡**嵌入 PPT，最接近參考風格 |
| `自動產稿機器人_產品簡報_圖卡版.html` | 瀏覽器翻頁預覽（方向鍵） |
| `ppt-slides/*.png` | 單頁 PNG（可丟 Canva／再修圖） |

## 舊版（形狀排版，風格較不像）

| 檔案 | 說明 |
|------|------|
| `自動產稿機器人_產品簡報.pptx` | python-pptx 形狀版 |
| `自動產稿機器人_產品簡報.html` | HTML 卡片版 |

## 重產圖卡（正確繁中，勿再用 AI 畫字）

```bash
cd docs
npm install
npx playwright install chromium   # 首次
node render_slides.mjs            # HTML 真實文字 → PNG
python build_image_pptx.py        # PNG → 圖卡版.pptx
```

文案來源：`ppt-export.html`（改這裡再重跑上面兩步）。

目前圖卡版 6 頁：封面 → 痛點 → 產品 → 雙模式 → 自定義規則 → **上手一條龍（含轉錄）**。
