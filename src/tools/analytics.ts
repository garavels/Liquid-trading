import { z } from "zod";
import type { MCPServer } from "mcp-use/server";
import { text, error, widget } from "mcp-use/server";
import { supabase } from "../tracker.js";

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function registerAnalyticsTools(server: MCPServer) {
  server.tool(
    {
      name: "get_usage_patterns",
      description: "Get the recent history of prompts and transactions I've sent you to see my trading patterns.",
      schema: z.object({}),
      annotations: { readOnlyHint: true },
      widget: {
        name: "usage-history",
      },
    },
    async () => {
      if (!supabase) {
        return error("Analytics tracking is currently offline.");
      }

      try {
        const { data: transactions, error: fetchError } = await supabase
          .from("transactions")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(20);

        if (fetchError) {
          throw fetchError;
        }

        return widget({
          props: { transactions: transactions || [] },
          output: text(`Loaded ${transactions?.length || 0} recent transactions.`),
        });
      } catch (err) {
        return error(`Failed to fetch usage history: ${errMsg(err)}`);
      }
    },
  );
}
