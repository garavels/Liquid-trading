import { z } from "zod";
import type { MCPServer } from "mcp-use/server";
import { text, error, widget } from "mcp-use/server";
import { getMarkets, getTicker, getOrderbook } from "../liquid/client.js";

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function registerMarketTools(server: MCPServer) {
  server.tool(
    {
      name: "get_markets",
      description:
        "List all tradeable perpetual markets with symbol, max leverage, and ticker info",
      schema: z.object({}),
      annotations: { readOnlyHint: true },
      widget: {
        name: "markets-list",
        invoking: "Loading markets...",
        invoked: "Markets loaded",
      },
    },
    async () => {
      try {
        const markets = await getMarkets();
        return widget({
          props: { markets },
          output: text(`Found ${markets.length} tradeable market(s)`),
        });
      } catch (err) {
        return error(`Failed to fetch markets: ${errMsg(err)}`);
      }
    },
  );

  server.tool(
    {
      name: "get_ticker",
      description:
        "Get current price, mark price, 24h volume, 24h change, and funding rate for a symbol",
      schema: z.object({
        symbol: z.string().describe("Market symbol, e.g. BTC-PERP"),
      }),
      annotations: { readOnlyHint: true },
      widget: {
        name: "ticker-card",
        invoking: "Loading ticker...",
        invoked: "Ticker loaded",
      },
    },
    async ({ symbol }) => {
      try {
        const ticker = await getTicker(symbol);
        return widget({
          props: { ticker },
          output: text(
            `${ticker.symbol}: $${ticker.mark_price} | 24h vol: $${ticker.volume_24h} | funding: ${ticker.funding_rate}`,
          ),
        });
      } catch (err) {
        return error(`Failed to fetch ticker for ${symbol}: ${errMsg(err)}`);
      }
    },
  );

  server.tool(
    {
      name: "get_orderbook",
      description: "Get the order book (bids and asks) for a symbol",
      schema: z.object({
        symbol: z.string().describe("Market symbol, e.g. BTC-PERP"),
        depth: z
          .number()
          .int()
          .min(1)
          .max(500)
          .optional()
          .describe("Number of price levels (default 20)"),
      }),
      annotations: { readOnlyHint: true },
      widget: {
        name: "orderbook-view",
        invoking: "Loading order book...",
        invoked: "Order book loaded",
      },
    },
    async ({ symbol, depth }) => {
      try {
        const orderbook = await getOrderbook(symbol, depth);
        return widget({
          props: { orderbook },
          output: text(
            `${orderbook.symbol} order book: ${orderbook.bids.length} bids, ${orderbook.asks.length} asks`,
          ),
        });
      } catch (err) {
        return error(
          `Failed to fetch order book for ${symbol}: ${errMsg(err)}`,
        );
      }
    },
  );
}
