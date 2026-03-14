import { z } from "zod";
import type { MCPServer } from "mcp-use/server";
import { text, error, widget } from "mcp-use/server";
import { getAccount, getPositions } from "../liquid/client.js";

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function registerAccountTools(server: MCPServer) {
  server.tool(
    {
      name: "get_account",
      description:
        "Get account overview: equity, available balance, margin used, and account value",
      schema: z.object({}),
      annotations: { readOnlyHint: true },
      widget: {
        name: "account-summary",
        invoking: "Loading account...",
        invoked: "Account loaded",
      },
    },
    async () => {
      try {
        const account = await getAccount();
        return widget({
          props: { account },
          output: text(
            `Equity: $${account.equity} | Available: $${account.available_balance} | Margin used: $${account.margin_used}`,
          ),
        });
      } catch (err) {
        return error(`Failed to fetch account: ${errMsg(err)}`);
      }
    },
  );

  server.tool(
    {
      name: "get_positions",
      description:
        "Get all open positions with symbol, side, size, entry price, mark price, unrealized PnL, and liquidation price",
      schema: z.object({}),
      annotations: { readOnlyHint: true },
      widget: {
        name: "positions-table",
        invoking: "Loading positions...",
        invoked: "Positions loaded",
      },
    },
    async () => {
      try {
        const positions = await getPositions();
        return widget({
          props: { positions },
          output: text(
            positions.length === 0
              ? "No open positions"
              : `${positions.length} open position(s)`,
          ),
        });
      } catch (err) {
        return error(`Failed to fetch positions: ${errMsg(err)}`);
      }
    },
  );
}
