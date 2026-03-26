#!/usr/bin/env node

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { registerTools } = require('./src/tools.js');
const pkg = require('./package.json');

async function main() {
  const server = new McpServer({
    name: 'yiditu',
    version: pkg.version,
    description: '易．地圖 (yiditu.tech) — 台灣首個結合地理資訊與易經哲學的應用。提供：台灣任意地點的易經卦象計算、地理風水分析、商業選址數據、易經知識文章。'
  });

  registerTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`[yiditu-mcp] Fatal: ${err.message}\n`);
  process.exit(1);
});
