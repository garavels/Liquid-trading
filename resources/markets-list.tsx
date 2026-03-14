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
    accent: theme === "dark" ? "#2a4a6a" : "#e3f2fd",
    accentText: theme === "dark" ? "#4a9eff" : "#0066cc",
    headerBg: theme === "dark" ? "#2a2a2a" : "#f5f5f5",
  };
}

const propsSchema = z.object({
  markets: z.array(
    z.object({
      symbol: z.string(),
      ticker: z.string(),
      exchange: z.string(),
      max_leverage: z.number(),
      sz_decimals: z.number(),
    }),
  ),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display a table of all tradeable perpetual markets",
  props: propsSchema,
  exposeAsTool: false,
};

type Props = z.infer<typeof propsSchema>;

export default function MarketsList() {
  const { props, isPending, sendFollowUpMessage } = useWidget<Props>();
  const colors = useColors();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 32, textAlign: "center", color: colors.textSecondary }}>
          Loading markets...
        </div>
      </McpUseProvider>
    );
  }

  return (
    <McpUseProvider autoSize>
      <div style={{ padding: 20, backgroundColor: colors.bg, color: colors.text }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Perpetual Markets</h2>
          <span style={{
            padding: "4px 10px", fontSize: 12, fontWeight: 500, borderRadius: 12,
            backgroundColor: colors.accent, color: colors.accentText,
          }}>
            {props.markets.length} markets
          </span>
        </div>

        <div style={{
          border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
            padding: "10px 14px", backgroundColor: colors.headerBg,
            fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5,
            color: colors.textSecondary,
          }}>
            <div>Symbol</div>
            <div style={{ textAlign: "right" }}>Exchange</div>
            <div style={{ textAlign: "right" }}>Max Leverage</div>
            <div style={{ textAlign: "right" }}>Decimals</div>
          </div>

          {/* Rows */}
          {props.markets.map((market) => (
            <div
              key={market.symbol}
              onClick={() => sendFollowUpMessage(`Show me the ticker for ${market.symbol}`)}
              style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
                padding: "10px 14px", borderTop: `1px solid ${colors.border}`,
                cursor: "pointer", fontSize: 13,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.cardBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <div style={{ fontWeight: 600 }}>{market.symbol}</div>
              <div style={{ textAlign: "right", color: colors.textSecondary }}>{market.exchange}</div>
              <div style={{ textAlign: "right" }}>{market.max_leverage}x</div>
              <div style={{ textAlign: "right", color: colors.textSecondary }}>{market.sz_decimals}</div>
            </div>
          ))}
        </div>
      </div>
    </McpUseProvider>
  );
}
