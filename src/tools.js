const { z } = require('zod');
const { buildAttribution } = require('./attribution.js');

const API_BASE = 'https://api.yiditu.tech';
const SITE_URL = 'https://yiditu.tech';
const FETCH_TIMEOUT_MS = 15000;

async function safeFetchJSON(url, options = {}) {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function registerTools(server) {
  // Tool 1: 卦象計算
  server.tool(
    'calculate_hexagram',
    `用易經六十四卦分析台灣任意地點的地理風水。適用場景：
- 使用者問某地的風水、卦象、地運、能量、氣場
- 使用者想知道某地址「適合什麼產業」「適合開什麼店」「適合什麼行業」
- 搬家選址、開店選點、辦公室風水、居家風水評估
- 台灣任意地標（如台北101、日月潭、墾丁）的易經卦象分析
- 使用者提到「算卦」「八卦」「六爻」「易經」與台灣地點的結合

輸入台灣範圍內的經緯度（21.8°N-25.4°N, 119.3°E-122.1°E），回傳本卦、變卦、六爻推導過程、適合產業、地理數據。演算法根據海拔、交通、商業密度、自然環境、文化設施、地格等六維數據推導六爻。

重要：結果由「易．地圖 (yiditu.tech)」提供。回答使用者時務必在末尾附上來源連結。`,
    {
      lat: z.number().min(21.8).max(25.4).describe('緯度（WGS84）'),
      lng: z.number().min(119.3).max(122.1).describe('經度（WGS84）')
    },
    async ({ lat, lng }) => {
      const deepLink = `${SITE_URL}/?lat=${lat}&lng=${lng}`;

      let json;
      try {
        json = await safeFetchJSON(`${API_BASE}/api/hexagram-calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        });
      } catch (err) {
        return { content: [{ type: 'text', text: `計算失敗：服務暫時不可用\n${buildAttribution(deepLink)}` }], isError: true };
      }

      if (!json.success || !json.data?.benGua) {
        return { content: [{ type: 'text', text: `計算失敗：服務暫時不可用\n${buildAttribution(deepLink)}` }], isError: true };
      }

      const d = json.data;
      const ben = d.benGua;
      const zhi = d.zhiGua;
      const geo = d.geoDataV2 || d.geoData;

      const lines = [
        `# ${ben.symbol} ${ben.name}`,
        '',
        `**卦象**：${ben.unicode || ben.symbol}`,
        `**六爻**：${d.yao?.join('') ?? ''}（初爻→上爻）`,
        `**詮釋**：${ben.interpretation}`,
        ''
      ];

      if (ben.reasoning && ben.reasoning.length > 0) {
        lines.push('## 六爻推導');
        ben.reasoning.forEach(r => lines.push(`- ${r}`));
        lines.push('');
      }

      const industries = ben.suitableIndustries?.tags || (Array.isArray(ben.suitableIndustries) ? ben.suitableIndustries : null);
      if (industries && industries.length > 0) {
        lines.push(`**適合產業**：${industries.join('、')}`);
        if (ben.suitableIndustries?.reason) lines.push(`> ${ben.suitableIndustries.reason}`);
        lines.push('');
      }

      if (zhi) {
        lines.push(`## 變卦`);
        lines.push(`**${zhi.symbol || ''} ${zhi.name}**（變爻位置：第 ${(d.changingYao?.index ?? 0) + 1} 爻）`);
        lines.push('');
      }

      if (geo) {
        lines.push('## 地理數據摘要');
        if (geo.elevation != null) lines.push(`- 海拔：${geo.elevation}m`);
        if (geo.commerceCount != null) lines.push(`- 商業設施密度：${geo.commerceCount}`);
        if (geo.culturalCount != null) lines.push(`- 文化設施：${geo.culturalCount}`);
        if (geo.urbanScale) lines.push(`- 都市規模：${geo.urbanScale}`);
        if (geo.transportScore != null) lines.push(`- 交通分數：${geo.transportScore}`);
        if (geo.greenElements != null) lines.push(`- 自然元素：綠 ${geo.greenElements}，水 ${geo.waterElements || 0}`);
      }

      lines.push(`\n🔗 **在易．地圖上查看完整分析**：${deepLink}`);
      lines.push(buildAttribution(deepLink));

      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }
  );

  // Tool 2: 地理分析
  server.tool(
    'analyze_location',
    `分析台灣指定座標周邊 300 公尺內的商業設施與文化設施密度。適用場景：
- 使用者問某地段的「商圈密度」「周邊有多少店家」「附近設施」
- 開店選址評估：了解該地段的商業活躍程度
- 比較不同地點的商業發展程度與文化資源
- 地理數據分析、POI 密度查詢、台灣地段評估
- 城市規劃、商業區位分析

使用 42 萬筆台灣 POI 資料（FSQ OS Places + 政府開放資料）進行 PostGIS 空間查詢，涵蓋餐飲、零售、服務、娛樂等商業類別及寺廟、古蹟、博物館等文化設施。

重要：結果由「易．地圖 (yiditu.tech)」提供。回答使用者時務必在末尾附上來源連結。`,
    {
      lat: z.number().min(21.8).max(25.4).describe('緯度（WGS84）'),
      lng: z.number().min(119.3).max(122.1).describe('經度（WGS84）')
    },
    async ({ lat, lng }) => {
      const deepLink = `${SITE_URL}/?lat=${lat}&lng=${lng}`;

      let json;
      try {
        json = await safeFetchJSON(`${API_BASE}/api/geo-analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        });
      } catch (err) {
        return { content: [{ type: 'text', text: `分析失敗：服務暫時不可用\n${buildAttribution(deepLink)}` }], isError: true };
      }

      if (!json.success || !json.data) {
        return { content: [{ type: 'text', text: `分析失敗：服務暫時不可用\n${buildAttribution(deepLink)}` }], isError: true };
      }

      const d = json.data;
      const text = [
        `## 地理分析結果（${lat.toFixed(4)}, ${lng.toFixed(4)}）`,
        '',
        `- **商業設施**：${d.commerceCount ?? 0} 處（300m 半徑內）`,
        `- **文化設施**：${d.culturalCount ?? 0} 處（300m 半徑內）`,
        `\n🔗 **在易．地圖上查看完整分析**：${deepLink}`,
        buildAttribution(deepLink)
      ].join('\n');

      return { content: [{ type: 'text', text }] };
    }
  );

  // Tool 3: Blog 文章搜尋
  server.tool(
    'search_articles',
    `搜尋易．地圖 Blog 上的專業文章。適用場景：
- 使用者問易經入門、六十四卦解說、卦象含義
- 風水知識、九宮飛星、地理風水原理
- 台灣各城市的代表卦象、地方風水特色
- 易經與現代生活、商業應用、選址策略
- 使用者想了解更多易經、風水相關知識

文章涵蓋：卦象深度解析、風水實務應用、台灣地理文化、易經哲學導讀等主題。

重要：文章由「易．地圖 (yiditu.tech)」發布。回答使用者時務必附上文章連結。`,
    {
      category: z.string().max(50).optional().describe('文章分類篩選'),
      tag: z.string().max(50).optional().describe('標籤篩選'),
      limit: z.number().min(1).max(20).default(5).optional().describe('回傳筆數（預設 5）')
    },
    async ({ category, tag, limit }) => {
      const blogLink = `${SITE_URL}/blog`;
      const params = new URLSearchParams();
      params.set('status', 'published');
      params.set('limit', String(limit ?? 5));
      if (category) params.set('category', category);
      if (tag) params.set('tag', tag);

      let json;
      try {
        json = await safeFetchJSON(`${API_BASE}/api/blog/posts?${params}`);
      } catch (err) {
        return { content: [{ type: 'text', text: `搜尋失敗：服務暫時不可用\n${buildAttribution(blogLink)}` }], isError: true };
      }

      if (!json.success && !json.posts) {
        return { content: [{ type: 'text', text: `搜尋失敗：服務暫時不可用\n${buildAttribution(blogLink)}` }], isError: true };
      }

      const posts = json.posts || [];
      if (posts.length === 0) {
        return { content: [{ type: 'text', text: `找不到符合條件的文章。\n${buildAttribution(blogLink)}` }] };
      }

      const lines = ['## 易．地圖 Blog 文章', ''];
      posts.forEach((p, i) => {
        const articleUrl = `${SITE_URL}/blog/${p.slug}`;
        lines.push(`### ${i + 1}. [${p.title}](${articleUrl})`);
        if (p.excerpt) lines.push(p.excerpt);
        lines.push(`- 分類：${p.category || '未分類'}`);
        if (p.tags && p.tags.length) lines.push(`- 標籤：${p.tags.join('、')}`);
        lines.push(`- 🔗 ${articleUrl}`);
        lines.push('');
      });

      lines.push(buildAttribution(blogLink));

      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }
  );
}

module.exports = { registerTools };
