# Screen Veil（螢幕遮罩工具）

一個 Chrome 擴充功能，用來在瀏覽器畫面上加上全螢幕遮罩，提升隱私保護或專注力。

## 現版本功能

- 可透過 popup 開關遮罩
- 支援 ESC 快速關閉遮罩
- 狀態會自動記憶（refresh 不會消失）
- popup 與 content script 即時同步

---

## 使用方式

1. 點擊 Chrome 擴充功能圖示
2. 使用滑動開關控制遮罩
3. 按 ESC 可快速關閉遮罩

---

## 技術架構

- JavaScript（核心邏輯）
- HTML / CSS（UI）
- Chrome Extension Manifest V3
- chrome.runtime message 通訊
- chrome.storage 狀態儲存

---

## 專案結構


Screen Veil
│
├── popup/ # popup UI
├── content/ # 遮罩與頁面控制
├── manifest.json # 擴充功能設定
└── icons/ # 圖示


---

## 狀態流程

popup → 發送 toggle 指令  
content → 更新遮罩狀態  
storage → 記錄目前開關狀態  

---

## 作者備註(ChatGPT撰寫)

此專案為學習 Chrome Extension 開發過程中的練習作品，主要用於理解：

- DOM 操作
- 前後端訊息溝通
- 狀態管理
- 基礎 UI 互動