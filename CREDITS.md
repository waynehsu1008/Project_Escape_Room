# CREDITS.md

## 校園 NPC 與可選物件（2026-10-31）

新增 assets/generated/campus/ 下三張虛構 NPC（周伯、許學長、小禾）與三張物件（籃球籃、保溫瓶、卡帶），均以 OpenAI 內建 image_gen 各別全新生成，保留原圖與透明通道，沒有下載第三方人物或遊戲物件。每張完整提示詞見同名 .prompt.txt，清單見該目錄 README.md。新增對話與觀察文字由本專案以 AI 協助原創撰寫，供團隊審閱；不是史料、真實人物證詞或新的必要通關條件。其他觀察點沿用既有素材，原授權紀錄不變。

## 第一版新增與採用素材（2026-10-30）

本次依使用者要求，以 OpenAI 內建 image_gen 生成缺少的圖檔，未使用 CLI/API fallback。下列檔案均已保存於專案，完整提示詞在同目錄的同名 .prompt.txt；生成原圖未覆蓋原有素材。

| 檔案 | 第一版用途 | 來源與方式 |
| --- | --- | --- |
| assets/generated/game-interface-concept-v1.png | 主畫面設計概念；不作執行時整張介面圖 | OpenAI 內建 image_gen，全新生成 |
| assets/generated/broadcast-room-v1.png | S03 廣播室背景 | OpenAI 內建 image_gen，全新生成 |
| assets/generated/player-four-directions-v1.png | 玩家前後左右四向角色圖 | OpenAI 內建 image_gen，全新生成，保留 alpha |
| assets/generated/brass-key-v1.png | I03 鑰匙道具 | OpenAI 內建 image_gen，全新生成，保留 alpha |
| assets/generated/student-portrait-v1.png | I02 虛構學生個人照 | OpenAI 內建 image_gen，全新生成，保留 alpha |

既有素材採用：教室與走廊背景取自 assets/maps/；黑板、課桌、抽屜、合照、稿架、科展欄、名冊、資料櫃、播放機與門，取自 assets/objects/，用於互動物件的展示與詳情視窗。借書卡／交接單沿用名冊外觀，告別稿沿用稿架外觀，必要內容由 HTML 可讀文字呈現。圖書館、屋頂圖與四格背景提案未增加為首版關卡。

合成鐘聲由 game/app.mjs 以 Web Audio 的正弦波現場產生，沒有匯入音樂或錄音；必要廣播採既有文字稿。字型使用裝置系統繁中字型，圖示為程式內的簡單 SVG 線條。生成素材與既有參考來源均不因此宣稱取得其他遊戲素材的授權，專案對外授權仍由團隊決定。

詳細尺寸、alpha 與設計紀錄見 assets/generated/README.md。以下保留前期素材與研究來源紀錄；過去「尚未生成」的敘述是當時狀態，不代表目前沒有遊戲素材。

版本：小安初稿 v0.1｜2026-10-29

## 故事與文字

《不存在的第八節課》的人物、學校、對話與謎題為本專案初稿，由小安角色使用 AI 協助撰寫，供團隊審閱。人物與事件均屬虛構。

本檔不替團隊決定整份專案的對外授權；是否採用特定授權須由團隊確認。

## 設計研究參考

下列連結是前期研究敘事方法的來源，不是已匯入遊戲的圖片、聲音或文字素材，也不代表取得其內容再利用的授權。

| 作品 | 參考方向 | 原始來源 | 本稿使用情況 |
| --- | --- | --- | --- |
| Samsara Room | 以固定空間與異常物件建立謎團 | https://www.rustylake.com/room-escape-games/samsara-room.html | 敘事方法參考；未匯入原作素材 |
| Underground Blossom | 讓解謎推進人物記憶與理解 | https://press.rustylake.com/sheet.php?p=Underground+Blossom | 敘事方法參考；未沿用原作人物或對話 |
| Another Shadow | 讓空間異常與解謎因果相互呼應 | https://play.google.com/store/apps/details?id=air.com.darkdome.another.shadow | 前期研究參考；本稿未採雙世界系統或匯入素材 |

## 實際素材清單

初始故事草稿沒有匯入外部圖像、音效、配樂或字型檔。後續已生成的地圖與物品候選圖分別記於下方，素材需求狀態見 assets/ASSET_PLAN.md；尚未製作的項目不能記為已完成或授權已確認。

新增素材後，每筆填寫：檔案、用途、作者、原始網址、授權名稱／條款網址、是否修改與確認日期。來源或授權尚不清楚時標記待確認，不記為已授權。

| 檔案 | 用途 | 作者／來源網址 | 授權依據 | 修改情況 | 確認日期 |
| --- | --- | --- | --- | --- | --- |
| 尚無外部素材檔 | — | — | — | — | — |

## AI 生成地圖素材（2026-10-29 新增）

此節記錄已保存的生成圖片；上方「尚無外部素材檔」指外部匯入素材，不代表本專案沒有 AI 生成背景。

| 檔案 | 用途 | 來源與方式 | 生成日期 |
| --- | --- | --- | --- |
| assets/maps/campus-01-classroom-v1.png | 俯視教室探索地圖 | OpenAI 內建 image_gen，全新生成 | 2026-10-29 |
| assets/maps/campus-02-corridor-v1.png | 俯視走廊資料區地圖 | OpenAI 內建 image_gen，全新生成 | 2026-10-29 |
| assets/maps/campus-03-library-v1.png | 俯視圖書館探索地圖 | OpenAI 內建 image_gen，全新生成 | 2026-10-29 |
| assets/maps/campus-04-rooftop-v1.png | 俯視夕陽屋頂地圖 | OpenAI 內建 image_gen，全新生成 | 2026-10-29 |

- 四張皆為 1536×1024；完整提示詞位於 assets/maps/ 下各圖同名的 .prompt.txt。
- 參考來源：使用者於本聊天提供的兩張遊戲截圖，檔名為 codex-clipboard-456713e9-735b-4977-8bba-6c65c75ea287.png 與 codex-clipboard-49f69bd4-68b0-448c-b39a-553e6bb9bb74.png；僅作俯視視角及像素風格參考，未直接匯入截圖作遊戲背景。
- 參考圖作者與原始授權未確認；此記錄不宣稱已取得參考遊戲素材授權，也不替生成圖片指定開源授權或宣告專屬著作權。
- 已完成圖像目視檢查與檔案尺寸讀取；尚未整合角色移動、碰撞、地圖切換或執行試玩。使用說明在 assets/maps/README.md。

## AI 生成互動物品素材：首批 10 張

依據 BRIEF.md v0.2 製作，小安素材工作範圍；這些為候選美術，不代表互動功能已實作。

| 檔案 | 物品／場景 | 來源與方式 | 生成日期 |
| --- | --- | --- | --- |
| assets/objects/campus-01-chalkboard-v1.png | 黑板；S01 | 內建 image_gen 全新生成 | 2026-10-29 |
| assets/objects/campus-02-student-desk-v1.png | 課桌椅；S01 | 內建 image_gen 全新生成 | 2026-10-29 |
| assets/objects/campus-03-lectern-script-stand-v1.png | 講台稿架；S01 | 內建 image_gen 全新生成 | 2026-10-29 |
| assets/objects/campus-04-return-drawer-v1.png | 物品抽屜；S01 | 內建 image_gen 全新生成 | 2026-10-29 |
| assets/objects/campus-05-class-photo-frame-v1.png | 班級合照框；S01 | 內建 image_gen 全新生成 | 2026-10-29 |
| assets/objects/campus-06-science-bulletin-board-v1.png | 科展公布欄；S02 | 內建 image_gen 全新生成 | 2026-10-29 |
| assets/objects/campus-07-memorial-register-v1.png | 紀念名冊；S02 | 內建 image_gen 全新生成 | 2026-10-29 |
| assets/objects/campus-08-archive-cabinet-v1.png | 資料櫃；S02 | 內建 image_gen 全新生成 | 2026-10-29 |
| assets/objects/campus-09-cassette-player-v1.png | 錄音播放機；S03 | 內建 image_gen 全新生成 | 2026-10-29 |
| assets/objects/campus-10-classroom-door-v1.png | 教室門；S01／S02 | 內建 image_gen 全新生成 | 2026-10-29 |

- 參考：使用者提供 codex-clipboard-03f45a05-9bbe-4b02-bbdc-43439c908fae.png，只參考粗像素畫風，未沿用附圖物件或文字，未直接匯入截圖作素材。
- 作者／授權：由使用者指示以 OpenAI 內建 image_gen 生成；原參考圖作者與授權未確認，此處不宣稱取得原遊戲素材授權，也不替生成物指定開源授權。
- 修改情況：直接複製生成 PNG，保留原始尺寸與 alpha；未裁切、縮放、重新去背或覆蓋原始生成檔。
- 檢查：10 張均已目視檢查及讀取尺寸，alpha 掃描確認每張具有透明像素與物件內容。尚未整合遊戲或試玩。
- 尺寸、SHA-256 與 alpha 計數：assets/objects/manifest.json；用途及完整生成提示詞連結：assets/objects/README.md。

## 原創背景音樂 After Class（2026-10-30）

互動音效（2026-10-31）：game/effects.mjs 以振盪器、包絡與程式產生的噪音合成按鍵、翻頁、拾取、放置、解鎖、開門、成功、錯誤與通關九類音效。沒有外部音檔或取樣；此音效程式及產生的聲音採 CC0-1.0，不改變其他素材授權。音效遵循遊戲音效開關，背景分頁不播放；重複點擊有限流，已完成的機關不重播成功音。
以 Web Audio 原創合成的 72 BPM chill 背景音樂，使用柔和電鋼琴音色、低音與延伸和弦，無外部錄音、取樣或下載素材。實作：game/music.mjs。此音樂程式及其生成的原創樂曲採 CC0-1.0 公眾領域貢獻；不影響專案其他素材的授權。

試聽檔：assets/audio/after-class-preview.wav（約 30 秒，原創樂曲離線合成預覽）；重建指令：node scripts/render-music-preview.mjs。WAV 與渲染器同採 CC0-1.0。


## NPC v2 與圖書館

三位 NPC v2 以內建 imagegen 生成，以既有 player-four-directions-v1.png 作畫風與比例參考，原 NPC v1 作角色身分參考。檔案與逐張完整提示存於 assets/generated/campus/npc-*-v2.png 與同名 .prompt.txt；保留 v1。圖書館沿用 assets/maps/campus-03-library-v1.png，來源與授權沿用原素材紀錄。便箋支線文字為本專案新增。
