# 第一版遊戲新增圖檔與設計紀錄

2026-10-30｜方式：OpenAI 內建 image_gen。原始生成檔已複製至專案，保留原始尺寸與 alpha，沒有依賴預設生成資料夾的檔案。沒有使用 CLI/API fallback。

| 檔案 | 用途 | 尺寸／alpha | 完整提示詞 |
| --- | --- | --- | --- |
| game-interface-concept-v1.png | 遊戲主畫面的設計概念，非執行時背景 | 1536×1024 | game-interface-concept-v1.prompt.txt |
| broadcast-room-v1.png | S03 廣播室俯視地圖 | 1536×1024；不透明 | broadcast-room-v1.prompt.txt |
| player-four-directions-v1.png | 角色前／後／左／右四向圖，2×2 配置 | 1254×1254；有 alpha | player-four-directions-v1.prompt.txt |
| brass-key-v1.png | I03 鑰匙道具圖 | 1254×1254；有 alpha | brass-key-v1.prompt.txt |
| student-portrait-v1.png | I02 虛構學生的個人照 | 1024×1536；有 alpha | student-portrait-v1.prompt.txt |

已讀取檔案尺寸與透明通道、目視檢查圖像，並由遊戲相對路徑接入。圖中沒有用作必要解答的小字；姓名、座號、線索與提示由 HTML／故事資料顯示。個人照是虛構角色圖像。

## 主畫面設計約定

- 依概念圖採紙色背景 #f3efe5、深綠文字 #22352f、細邊線、少量黃銅色 #b4873e。
- 上方為作品名與設定，下方場景名與八聲進度；主區為地圖＋右側目標／路線／背包，底部放操作說明。
- 標題與文件用襯線字，操作用系統繁中字體；不依賴網路字型載入。
- 保留使用者既有教室／走廊圖檔，沒有用概念圖取代已提供的背景；遊戲互動、碰撞、鐘聲、背包與文字都是實際程式。
- 桌面保留完整雙欄；小螢幕將目標與背包移到地圖下方，加上方向按鈕。操作仍以真實角色移動為前置。
- 物件視窗沿用同一紙色、邊線與按鈕系統，搭配既有透明物件素材。

上述記錄不是第三方授權聲明，亦不替整份專案指定開源授權。完整素材來源見 ../../CREDITS.md。
