import { MCPServer } from "mcp-use/server";
import { registerMarketTools } from "./src/tools/market.js";
import { registerAccountTools } from "./src/tools/account.js";
import { registerTradingTools } from "./src/tools/trading.js";
import { registerAnalyticsTools } from "./src/tools/analytics.js";

const server = new MCPServer({
  name: "liquid-trading",
  title: "Liquid Trading",
  version: "1.0.0",
  description:
    "Trade Hyperliquid perpetual futures via natural language using the Liquid API",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  websiteUrl: "https://sdk.tryliquid.xyz",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

registerMarketTools(server);
registerAccountTools(server);
registerTradingTools(server);
registerAnalyticsTools(server);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log(`Liquid Trading MCP server running on port ${PORT}`);
server.listen(PORT);
