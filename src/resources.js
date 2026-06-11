const { ResourceTemplate } = require('@modelcontextprotocol/sdk/server/mcp.js');
const hexagrams = require('./hexagrams.json');

/**
 * 易．地圖 MCP — Resources
 * 提供易經卦象的參考資料：六十四卦對照表、單卦詳解、六維演算法說明。
 * 卦象資料以 binary 字串（初爻→上爻）為鍵，與後端 hexagramV2Calculator 一致。
 */

// 卦名 / binary / 卦象符號 → binary 的反查表
const lookup = new Map();
for (const [binary, h] of Object.entries(hexagrams)) {
  lookup.set(binary, binary);
  if (h.name) lookup.set(h.name, binary);
  if (h.unicode) lookup.set(h.unicode, binary);
}

function resolveBinary(id) {
  if (id == null) return null;
  const raw = String(id).trim();
  // URI 路徑中的中文卦名/卦象符號會被 percent-encode，需先解碼
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch { /* 保留原值 */ }
  return lookup.get(decoded) || lookup.get(raw) || null;
}

function toSummary(binary) {
  const h = hexagrams[binary];
  return {
    binary,
    name: h.name,
    symbol: h.symbol,
    unicode: h.unicode,
    judgement: (h.interpretation || '').split('\n')[0],
    suitableIndustries: h.suitableIndustries?.tags || []
  };
}

const SIX_DIMENSIONS_MD = [
  '# 易．地圖 六爻演算法：六維地理數據說明',
  '',
  '易．地圖以地點的六維地理數據推導《易經》六爻（初爻在下、上爻在上）。',
  '六爻的陰陽組成 6 位二進位字串（初爻→上爻），對應六十四卦之一。',
  '',
  '| 爻位 | 維度 | 判定為「陽爻」的條件 |',
  '|------|------|----------------------|',
  '| 初爻 | 海拔地勢 | 海拔介於 20–1000 公尺 |',
  '| 二爻 | 多模式交通 | 交通計分 ≥ 動態閾值（三鐵各 3 分、輕軌 2 分、公車每站 1 分上限 5） |',
  '| 三爻 | 商業密度 | 周邊商業設施數 > 動態閾值 |',
  '| 四爻 | 自然環境 | 自然元素數 < 動態閾值（都市區自然稀少反主生機，故為陽） |',
  '| 五爻 | 文化設施 | 周邊文化設施數 ≥ 動態閾值 |',
  '| 上爻 | 地格（經緯網格） | (⌊緯度×20⌋ + ⌊經度×20⌋) 為奇數 |',
  '',
  '## 動態閾值（依都市化等級）',
  '都市化等級由交通與商業密度判定，分為 core / urban / suburban / rural 四級，各維度閾值隨之調整：',
  '',
  '| 維度 | core | urban | suburban | rural |',
  '|------|------|-------|----------|-------|',
  '| 交通 | 10 | 6 | 3 | 1 |',
  '| 商業 | 20 | 12 | 6 | 3 |',
  '| 文化 | 5 | 3 | 2 | 1 |',
  '| 自然 | 1 | 2 | 3 | 5 |',
  '',
  '## 變卦與方位',
  '- 六爻完成後依數據強度選定變爻，推導「變卦」表示趨勢走向。',
  '- 另以台灣地理中心指向該地點的方位輔助定卦。',
  '',
  '資料來源：易．地圖 https://yiditu.tech'
].join('\n');

function registerResources(server) {
  // Resource 1：六十四卦對照表
  server.registerResource(
    'hexagrams-64',
    'yiditu://hexagrams/64',
    {
      title: '六十四卦對照表',
      description: '易經 64 卦的卦名、卦象符號（Unicode）、二進位、卦辭與適合產業標籤',
      mimeType: 'application/json'
    },
    async (uri) => {
      const list = Object.keys(hexagrams).sort().map(toSummary);
      return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(list) }] };
    }
  );

  // Resource 2：六維演算法說明
  server.registerResource(
    'algorithm-six-dimensions',
    'yiditu://algorithm/six-dimensions',
    {
      title: '六爻演算法：六維數據說明',
      description: '說明易．地圖如何由海拔、交通、商業密度、自然環境、文化設施、地格六維推導六爻',
      mimeType: 'text/markdown'
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: 'text/markdown', text: SIX_DIMENSIONS_MD }]
    })
  );

  // Resource 3：單卦詳解（{id} 可為卦名、binary 或卦象符號）
  server.registerResource(
    'hexagram-detail',
    new ResourceTemplate('yiditu://hexagram/{id}', {
      list: async () => ({
        resources: Object.keys(hexagrams).sort().map((binary) => ({
          uri: `yiditu://hexagram/${binary}`,
          name: hexagrams[binary].name,
          description: `${hexagrams[binary].unicode} ${hexagrams[binary].name}`,
          mimeType: 'application/json'
        }))
      })
    }),
    {
      title: '單卦詳解',
      description: '依卦名、binary 或卦象符號取得單一卦象的卦辭、詮釋與適合產業',
      mimeType: 'application/json'
    },
    async (uri, { id }) => {
      const rawId = Array.isArray(id) ? id[0] : id;
      const binary = resolveBinary(rawId);
      if (!binary) {
        let display = String(rawId);
        try { display = decodeURIComponent(display); } catch { /* 保留原值 */ }
        return {
          contents: [{
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({ error: `找不到卦象「${display}」，可用卦名（如 水雷屯）、binary（如 100010）或卦象符號查詢` })
          }]
        };
      }
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ binary, ...hexagrams[binary] })
        }]
      };
    }
  );
}

module.exports = { registerResources };
