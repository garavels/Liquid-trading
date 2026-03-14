import { z } from "zod";
import type { MCPServer } from "mcp-use/server";
import { text, error, widget, object } from "mcp-use/server";
import {
  placeOrder,
  cancelOrder,
  closePosition,
} from "../liquid/client.js";

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function registerTradingTools(server: MCPServer) {
  server.tool(
    {
      name: "place_order",
      description:
        "Place a buy or sell perpetual futures order. Size is USD notional. Returns a confirmation widget — the order is only executed after explicit user confirmation.",
      schema: z.object({
        symbol: z.string().describe("Market symbol, e.g. BTC-PERP"),
        side: z.enum(["buy", "sell"]).describe("Order side"),
        size: z.number().positive().describe("Order size in USD notional"),
        type: z
          .enum(["market", "limit"])
          .optional()
          .describe("Order type (default: market)"),
        price: z
          .number()
          .positive()
          .optional()
          .describe("Limit price (required if type=limit)"),
        leverage: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe("Leverage (default: 1)"),
        tp: z.number().positive().optional().describe("Take-profit price"),
        sl: z.number().positive().optional().describe("Stop-loss price"),
        confirmed: z
          .boolean()
          .optional()
          .describe(
            "Set to true to confirm and execute the order. Omit or false to preview.",
          ),
      }),
      widget: {
        name: "order-confirmation",
        invoking: "Preparing order...",
        invoked: "Order ready",
      },
    },
    async ({ symbol, side, size, type, price, leverage, tp, sl, confirmed }) => {
      const orderType = type ?? "market";

      if (orderType === "limit" && price == null) {
        return error("Limit orders require a price");
      }

      const orderPreview = {
        symbol,
        side,
        size,
        type: orderType,
        price: price ?? null,
        leverage: leverage ?? 1,
        tp: tp ?? null,
        sl: sl ?? null,
      };

      if (!confirmed) {
        return widget({
          props: { order: orderPreview, status: "pending_confirmation" },
          output: text(
            `Order preview: ${side.toUpperCase()} $${size} ${symbol} @ ${orderType}${price ? ` $${price}` : ""} (${leverage ?? 1}x). Please confirm to execute.`,
          ),
        });
      }

      try {
        const result = await placeOrder({
          symbol,
          side,
          size,
          type: orderType,
          price,
          leverage,
          tp,
          sl,
        });
        return widget({
          props: { order: result, status: "executed" },
          output: text(
            `Order placed: ${result.side.toUpperCase()} $${result.size} ${result.symbol} — ID: ${result.order_id} — Status: ${result.status}`,
          ),
        });
      } catch (err) {
        return error(`Failed to place order: ${errMsg(err)}`);
      }
    },
  );

  server.tool(
    {
      name: "cancel_order",
      description: "Cancel an open order by its order ID",
      schema: z.object({
        order_id: z.string().describe("The order ID to cancel"),
      }),
    },
    async ({ order_id }) => {
      try {
        await cancelOrder(order_id);
        return text(`Order ${order_id} cancelled successfully`);
      } catch (err) {
        return error(`Failed to cancel order ${order_id}: ${errMsg(err)}`);
      }
    },
  );

  server.tool(
    {
      name: "close_position",
      description:
        "Close an open position fully or partially. Size is in coin units for partial close; omit for full close. Returns a confirmation widget first.",
      schema: z.object({
        symbol: z.string().describe("Market symbol, e.g. BTC-PERP"),
        size: z
          .number()
          .positive()
          .optional()
          .describe("Partial close size in coin units (omit for full close)"),
        confirmed: z
          .boolean()
          .optional()
          .describe(
            "Set to true to confirm and execute. Omit or false to preview.",
          ),
      }),
      widget: {
        name: "close-position-confirmation",
        invoking: "Preparing to close position...",
        invoked: "Close position ready",
      },
    },
    async ({ symbol, size, confirmed }) => {
      const closePreview = {
        symbol,
        size: size ?? "full",
        action: size ? `Partial close ${size} units` : "Full close",
      };

      if (!confirmed) {
        return widget({
          props: { close: closePreview, status: "pending_confirmation" },
          output: text(
            `Close preview: ${closePreview.action} on ${symbol}. Please confirm to execute.`,
          ),
        });
      }

      try {
        const result = await closePosition(symbol, size);
        return widget({
          props: { close: result, status: "executed" },
          output: text(
            `Position closed: ${result.symbol} — ${result.status}: ${result.message}`,
          ),
        });
      } catch (err) {
        return error(`Failed to close position on ${symbol}: ${errMsg(err)}`);
      }
    },
  );
}
