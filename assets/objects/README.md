# 校園互動物品像素素材：首批 10 張

依據 BRIEF.md v0.2，由小安素材工作範圍製作；2026-10-29，內建 image_gen 全新生成。參考使用者附圖的像素畫風，物件依校園場景選擇。

| 編號 | 物品／PNG | 場景 | 本張狀態／用途 | 原始尺寸 | 提示詞 |
| --- | --- | --- | --- | --- | --- |
| 1 | [黑板](campus-01-chalkboard-v1.png) | S01 | 空白黑板；查看劇情提示；黑板文字由遊戲介面顯示 | 1774×887 | [完整提示詞](campus-01-chalkboard-v1.prompt.txt) |
| 2 | [課桌椅](campus-02-student-desk-v1.png) | S01 | 桌椅組合；教室環境探索；不新增謎題條件 | 1254×1254 | [完整提示詞](campus-02-student-desk-v1.prompt.txt) |
| 3 | [講台稿架](campus-03-lectern-script-stand-v1.png) | S01 | 稿架未放稿；P04 放置 I05 完整告別稿 | 1254×1254 | [完整提示詞](campus-03-lectern-script-stand-v1.prompt.txt) |
| 4 | [物品抽屜](campus-04-return-drawer-v1.png) | S01 | 關閉；P01 抽屜機關及 I01／I02／I03 拾取位置 | 1254×1254 | [完整提示詞](campus-04-return-drawer-v1.prompt.txt) |
| 5 | [班級合照框](campus-05-class-photo-frame-v1.png) | S01 | 合照缺席；右下有空白插入位置；P04 使用 I02 個人照的目標 | 1254×1254 | [完整提示詞](campus-05-class-photo-frame-v1.prompt.txt) |
| 6 | [科展公布欄](campus-06-science-bulletin-board-v1.png) | S02 | 名單外觀；查看 E04 科展名單；內容由文字介面顯示 | 1536×1024 | [完整提示詞](campus-06-science-bulletin-board-v1.prompt.txt) |
| 7 | [紀念名冊](campus-07-memorial-register-v1.png) | S02 | 翻開；P02 補回姓名；內容與輸入由遊戲介面顯示 | 1254×1254 | [完整提示詞](campus-07-memorial-register-v1.prompt.txt) |
| 8 | [資料櫃](campus-08-archive-cabinet-v1.png) | S02 | 關閉；P02 解鎖後提供 I04 轉學交接單 | 1254×1254 | [完整提示詞](campus-08-archive-cabinet-v1.prompt.txt) |
| 9 | [錄音播放機](campus-09-cassette-player-v1.png) | S03 | 靜態播放設備；P03 進行錄音稿排序與播放 | 1254×1254 | [完整提示詞](campus-09-cassette-player-v1.prompt.txt) |
| 10 | [教室門](campus-10-classroom-door-v1.png) | S01／S02 | 關閉；使用 I03 解鎖走廊內門的候選外觀 | 1254×1254 | [完整提示詞](campus-10-classroom-door-v1.prompt.txt) |

## 檢查與接入

- 10 張均已逐張目視檢查、可讀取，且已檢測到真正的透明 alpha 像素；不是把棋盤格畫成背景。
- 保留生成原始尺寸與透明通道，未裁切、縮放或去背重製。生成器沒有固定輸出方形尺寸，因此不能將所有圖視為同一個 64×64 tile。
- [manifest.json](manifest.json) 記錄尺寸、SHA-256、透明像素數、半透明像素數與 alpha > 16 的物件範圍。該範圍只協助對齊，不是遊戲碰撞範圍；原圖仍保留微量半透明邊緣。
- 使用時以整張 PNG 疊在地圖上，按物件實際大小另設顯示比例；前端建議 image-rendering: pixelated，Canvas 關閉 imageSmoothingEnabled，以減少縮放模糊。
- 名稱、姓名遮罩、座號、線索與答案由文字資料／互動視窗顯示，圖中的裝飾筆畫不作解題依據。合照內人物為抽象示意，不用圖中人頭數代表 33／34 人線索。
- 每種只有上述一張靜態候選圖。抽屜、資料櫃、門尚無打開狀態，合照尚無復原狀態；本批不等於整份素材需求完成。
- 圖片不包含碰撞、互動熱區、拾取狀態或謎題程式；未宣稱已執行遊戲整合或試玩。

## 來源與提示詞

生成方式為 OpenAI 內建 image_gen，每件各別呼叫一次。唯一畫風參考為使用者提供的 codex-clipboard-03f45a05-9bbe-4b02-bbdc-43439c908fae.png，沒有沿用附圖物件或文字。每張完整提示詞均在上表連結。原參考圖作者與授權未確認；本批記錄不替專案指定開源授權。詳見 ../../CREDITS.md。
