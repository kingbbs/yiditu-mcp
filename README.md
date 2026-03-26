# 易．地圖 MCP Server

> **Yiditu MCP Server** — I Ching hexagram analysis and geographic feng shui for Taiwan locations. Works with Claude Desktop, Cursor, Windsurf, and any MCP-compatible AI assistant. Powered by [yiditu.tech](https://yiditu.tech).

---

## 關於易．地圖

[易．地圖](https://yiditu.tech) 是台灣首個結合地理資訊與易經哲學的互動式應用。根據地點的海拔、交通、商業密度、自然環境、文化設施、地格等六維地理數據，運用獨創演算法推導《易經》六十四卦，提供現代化詮釋與商業選址建議。

本 MCP Server 讓 AI 助手（如 Claude、Cursor、Windsurf）能直接呼叫易．地圖的分析服務，為使用者提供台灣任意地點的卦象分析、地理風水評估與相關知識文章。

## 使用方式

### 方式一：遠端 URL（零安裝）

直接在 MCP 客戶端設定中加入遠端伺服器 URL，無需安裝任何套件。

**Claude Desktop** (`claude_desktop_config.json`)：

```json
{
  "mcpServers": {
    "yiditu": {
      "type": "streamable-http",
      "url": "https://api.yiditu.tech/mcp"
    }
  }
}
```

### 方式二：本機安裝（npx）

透過 npm 安裝到本機，以 stdio 模式執行。

**Claude Desktop** (`claude_desktop_config.json`)：

```json
{
  "mcpServers": {
    "yiditu": {
      "command": "npx",
      "args": ["-y", "yiditu-mcp"]
    }
  }
}
```

**Cursor** (Settings → MCP Servers)：

```json
{
  "mcpServers": {
    "yiditu": {
      "command": "npx",
      "args": ["-y", "yiditu-mcp"]
    }
  }
}
```

**Claude Code**：

```bash
claude mcp add yiditu -- npx -y yiditu-mcp
```

## 提供的工具

### `calculate_hexagram`

用易經六十四卦分析台灣任意地點的地理風水。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `lat` | number | 是 | 緯度（21.8 ~ 25.4） |
| `lng` | number | 是 | 經度（119.3 ~ 122.1） |

**適用場景**：風水卦象查詢、開店選址評估、搬家風水分析、地標卦象解讀

**回傳內容**：本卦名稱與詮釋、六爻推導過程、適合產業建議、變卦資訊、地理數據摘要

### `analyze_location`

分析指定座標周邊 300 公尺內的商業設施與文化設施密度。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `lat` | number | 是 | 緯度（21.8 ~ 25.4） |
| `lng` | number | 是 | 經度（119.3 ~ 122.1） |

**適用場景**：商圈密度評估、開店選點分析、不同地段商業活躍度比較

**回傳內容**：商業設施數量、文化設施數量（基於 42 萬筆台灣 POI 資料）

### `search_articles`

搜尋易．地圖 Blog 上的易經與風水知識文章。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `category` | string | 否 | 文章分類篩選 |
| `tag` | string | 否 | 標籤篩選 |
| `limit` | number | 否 | 回傳筆數（1-20，預設 5） |

**適用場景**：易經入門學習、六十四卦解說、風水知識查詢、台灣城市卦象特色

**回傳內容**：文章標題、摘要、分類、標籤、閱讀連結

## 資料來源

- **商業/文化設施**：[Foursquare OS Places](https://docs.foursquare.com/data-products/docs/access-fsq-os-places)（42 萬筆台灣 POI）+ 政府開放資料
- **交通站點**：[TDX 運輸資料](https://tdx.transportdata.tw/)（三鐵 + 公車站）
- **自然特徵**：內政部國家公園、自然保留區、水庫多邊形 + 觀光署景點
- **海拔**：SRTM 數值地形模型

## 系統需求

- Node.js >= 18.0.0（本機安裝模式）
- 遠端 URL 模式無系統需求

## 授權

[MIT License](./LICENSE)

## 相關連結

- [易．地圖](https://yiditu.tech) — 主網站
- [易．地圖 Blog](https://yiditu.tech/blog) — 易經知識文章
- [GitHub Issues](https://github.com/kingbbs/yiditu-mcp/issues) — 問題回報
