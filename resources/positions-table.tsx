import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

function useColors() {
  const theme = useWidgetTheme();
  return {
    bg: theme === "dark" ? "#1e1e1e" : "#ffffff",
    cardBg: theme === "dark" ? "#262626" : "#fafafa",
    text: theme === "dark" ? "#e0e0e0" : "#1a1a1a",
    textSecondary: theme === "dark" ? "#a0a0a0" : "#666",
    border: theme === "dark" ? "#363636" : "#e5e5e5",
    headerBg: theme === "dark" ? "#2a2a2a" : "#f5f5f5",
    green: theme === "dark" ? "#4ade80" : "#16a34a",
    greenBg: theme === "dark" ? "#1a3a1a" : "#f0fdf4",
    red: theme === "dark" ? "#f87171" : "#dc2626",
    redBg: theme === "dark" ? "#3a1a1a" : "#fef2f2",
    accent: theme === "dark" ? "#4a9eff" : "#0066cc",
    accentBg: theme === "dark" ? "#1a2a4a" : "#e3f2fd",
  };
}

const propsSchema = z.object({
  positions: z.array(
    z.object({
      symbol: z.string(),
      side: z.string(),
      size: z.string(),
      entry_price: z.string(),
      mark_price: z.string(),
      leverage: z.string(),
      unrealized_pnl: z.string(),
      liquidation_price: z.string(),
      margin_used: z.string(),
    }),
  ),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display open positions with PnL color-coded green/red",
  props: propsSchema,
  exposeAsTool: false,
};

type Props = z.infer<typeof propsSchema>;

export default function PositionsTable() {
  const { props, isPending, sendFollowUpMessage } = useWidget<Props>();
  const colors = useColors();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 32, textAlign: "center", color: colors.textSecondary }}>
          Loading positions...
        </div>
      </McpUseProvider>
    );
  }

  const { positions } = props;

  if (positions.length === 0) {
    return (
      <McpUseProvider autoSize>
        <div style={{
          padding: 20, backgroundColor: colors.bg, color: colors.text,
          border: `1px solid ${colors.border}`, borderRadius: 12,
        }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 600 }}>Open Positions</h2>
          <div style={{ padding: 32, textAlign: "center", color: colors.textSecondary, fontSize: 14 }}>
            No open positions
          </div>
        </div>
      </McpUseProvider>
    );
  }

  const totalPnl = positions.reduce((sum, p) => sum + parseFloat(p.unrealized_pnl), 0);
  const totalPnlPositive = totalPnl >= 0;

  return (
    <McpUseProvider autoSize>
      <div style={{
        padding: 20, backgroundColor: colors.bg, color: colors.text,
        border: `1px solid ${colors.border}`, borderRadius: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Open Positions</h2>
          <div style={{
            padding: "4px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            backgroundColor: totalPnlPositive ? colors.greenBg : colors.redBg,
            color: totalPnlPositive ? colors.green : colors.red,
          }}>
            Total PnL: {totalPnlPositive ? "+" : ""}${totalPnl.toFixed(2)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {positions.map((pos) => {
            const pnl = parseFloat(pos.unrealized_pnl);
            const pnlPositive = pnl >= 0;
            const sideColor = pos.side === "long" || pos.side === "buy" ? colors.green : colors.red;

            return (
              <div
                key={pos.symbol}
                onClick={() => sendFollowUpMessage(`Show me the ticker for ${pos.symbol}`)}
                style={{
                  padding: 14, backgroundColor: colors.cardBg, borderRadius: 8,
                  border: `1px solid ${colors.border}`, cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{pos.symbol}</span>
                    <span style={{
                      padding: "2px 8px", fontSize: 11, fontWeight: 600, borderRadius: 6,
                      color: sideColor, backgroundColor: pos.side === "long" || pos.side === "buy" ? colors.greenBg : colors.redBg,
                      textTransform: "uppercase",
                    }}>
                      {pos.side}
                    </span>
                    <span style={{
                      padding: "2px 8px", fontSize: 11, fontWeight: 500, borderRadius: 6,
                      backgroundColor: colors.accentBg, color: colors.accent,
                    }}>
                      {pos.leverage}x
                    </span>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: pnlPositive ? colors.green : colors.red,
                  }}>
                    {pnlPositive ? "+" : ""}${pnl.toFixed(2)}
                  </div>
                </div>

                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8,
                  fontSize: 12,
                }}>
                  <div>
                    <div style={{ color: colors.textSecondary, marginBottom: 2 }}>Size</div>
                    <div style={{ fontWeight: 500 }}>{parseFloat(pos.size).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ color: colors.textSecondary, marginBottom: 2 }}>Entry</div>
                    <div style={{ fontWeight: 500 }}>${parseFloat(pos.entry_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div style={{ color: colors.textSecondary, marginBottom: 2 }}>Mark</div>
                    <div style={{ fontWeight: 500 }}>${parseFloat(pos.mark_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div style={{ color: colors.textSecondary, marginBottom: 2 }}>Liq. Price</div>
                    <div style={{ fontWeight: 500 }}>${parseFloat(pos.liquidation_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </McpUseProvider>
  );
}
