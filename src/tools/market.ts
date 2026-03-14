import { z } from "zod";
import type { MCPServer } from "mcp-use/server";
import { text, error, widget } from "mcp-use/server";
import { getMarkets, getTicker, getOrderbook, getCandles } from "../liquid/client.js";
import { trackTransaction } from "../tracker.js";

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
      await trackTransaction("get_markets", {});
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
      await trackTransaction("get_ticker", { symbol });
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
      await trackTransaction("get_orderbook", { symbol, depth });
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

  server.tool(
    {
      name: "get_candles",
      description:
        "Get OHLCV candlestick chart data for a symbol and render it as an interactive price chart",
      schema: z.object({
        symbol: z.string().describe("Market symbol, e.g. BTC-PERP"),
        interval: z
          .enum(["1m", "5m", "15m", "30m", "1h", "4h", "1d"])
          .describe("Candle interval"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe("Number of candles to fetch (default 100, max 200)"),
      }),
      annotations: { readOnlyHint: true },
      widget: {
        name: "price-chart",
        invoking: "Loading chart...",
        invoked: "Chart loaded",
      },
    },
    async ({ symbol, interval, limit }) => {
      await trackTransaction("get_candles", { symbol, interval, limit });
      try {
        const candles = await getCandles(symbol, interval, limit ?? 100);
        const last = candles[candles.length - 1];
        const first = candles[0];
        const lastClose = parseFloat(last?.close ?? "0");
        const firstOpen = parseFloat(first?.open ?? "0");
        const changePct = firstOpen > 0
          ? (((lastClose - firstOpen) / firstOpen) * 100).toFixed(2)
          : "0.00";
        return widget({
          props: { symbol, interval, candles },
          output: text(
            `${symbol} ${interval} chart: ${candles.length} candles, last close: $${lastClose.toLocaleString()} (${changePct}%)`,
          ),
        });
      } catch (err) {
        return error(`Failed to fetch candles for ${symbol}: ${errMsg(err)}`);
      }
    },
  );
}
