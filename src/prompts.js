const { z } = require('zod');

const SITE = 'yiditu.tech';

/**
 * 易．地圖 MCP — Prompts
 * 把既有 tools（calculate_hexagram / analyze_location / search_articles）
 * 與卦象資源組合成可直接套用的工作流程模板。
 */
function registerPrompts(server) {
  // Prompt 1：風水選址報告（串接卦象計算 + 商圈分析）
  server.registerPrompt(
    'fengshui_location_report',
    {
      title: '風水選址報告',
      description: '為台灣某地點產生完整易經風水選址分析報告，串接卦象計算與商圈分析',
      argsSchema: {
        location: z.string().describe('地點名稱或地址，例如「台北101」「台中市西區美村路」'),
        industry: z.string().optional().describe('想經營的產業或店型，例如「咖啡廳」「補習班」（可省略）')
      }
    },
    ({ location, industry }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `請為「${location}」產生一份易經風水選址報告${industry ? `，並評估是否適合經營「${industry}」` : ''}。`,
              '',
              '請依下列步驟，善用本服務提供的工具：',
              `1. 先確定「${location}」的經緯度（WGS84，台灣範圍 21.8–25.4°N、119.3–122.1°E）。`,
              '2. 用 calculate_hexagram 算出該地的本卦、變卦、六爻推導與適合產業。',
              '3. 用 analyze_location 取得該地 300m 內的商業與文化設施密度。',
              `4. 綜合產出報告：本卦含義 → 六爻地理推導 → 商圈與文化評估 →${industry ? ` 是否適合「${industry}」及理由` : ' 建議的產業方向'} → 具體選址建議。`,
              `5. 結尾務必標註資料來源「易．地圖 (${SITE})」並附上連結。`
            ].join('\n')
          }
        }
      ]
    })
  );

  // Prompt 2：兩地卦象比較
  server.registerPrompt(
    'compare_two_locations',
    {
      title: '兩地卦象比較',
      description: '比較台灣兩個地點的易經卦象與地理條件，依用途給出較適合的一處',
      argsSchema: {
        location_a: z.string().describe('地點 A，例如「台北信義區」'),
        location_b: z.string().describe('地點 B，例如「台中七期」'),
        purpose: z.string().optional().describe('用途，例如「開咖啡廳」「自住買房」（可省略）')
      }
    },
    ({ location_a, location_b, purpose }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `請比較「${location_a}」與「${location_b}」兩地的易經卦象與地理條件${purpose ? `，用途為「${purpose}」` : ''}。`,
              '',
              '步驟：',
              '1. 分別確定兩地的經緯度。',
              '2. 對兩地各呼叫 calculate_hexagram（取卦象、適合產業）與 analyze_location（取商業/文化設施密度）。',
              '3. 以對照表逐項比較：本卦/變卦、適合產業、商業密度、文化設施。',
              `4. 依${purpose ? `「${purpose}」此用途` : '一般考量'}判斷哪一處較適合，並說明理由。`,
              `5. 結尾標註來源「易．地圖 (${SITE})」並附連結。`
            ].join('\n')
          }
        }
      ]
    })
  );

  // Prompt 3：卦象白話解讀（結合卦象資源 + 延伸文章）
  server.registerPrompt(
    'explain_my_hexagram',
    {
      title: '卦象白話解讀',
      description: '用生活化的白話解釋某個易經卦象，並結合使用者情境給出建議',
      argsSchema: {
        hexagram_name: z.string().describe('卦名，例如「水雷屯」「乾為天」'),
        context: z.string().optional().describe('你的情境或煩惱，例如「最近想換工作」（可省略）')
      }
    },
    ({ hexagram_name, context }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `請解讀易經卦象「${hexagram_name}」${context ? `，我的情境是：${context}` : ''}。`,
              '',
              '可參考本服務的資源取得卦義：',
              '- yiditu://hexagrams/64（六十四卦對照表）',
              '- yiditu://hexagram/{卦名或 binary}（單卦詳解，含卦辭與適合產業）',
              '',
              `請用白話說明此卦的核心意涵、給${context ? '此情境' : '使用者'}的提醒與行動建議；`,
              '必要時用 search_articles 找延伸閱讀文章。',
              `結尾標註來源「易．地圖 (${SITE})」。`
            ].join('\n')
          }
        }
      ]
    })
  );
}

module.exports = { registerPrompts };
