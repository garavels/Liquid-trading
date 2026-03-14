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
    green: theme === "dark" ? "#4ade80" : "#16a34a",
    greenBg: theme === "dark" ? "#1a3a1a" : "#f0fdf4",
    red: theme === "dark" ? "#f87171" : "#dc2626",
    redBg: theme === "dark" ? "#3a1a1a" : "#fef2f2",
  };
}

const propsSchema = z.object({
  ticker: z.object({
    symbol: z.string(),
    mark_price: z.string(),
    volume_24h: z.string(),
    change_24h: z.string(),
    funding_rate: z.string(),
  }),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display a price card for a single market ticker",
  props: propsSchema,
  exposeAsTool: false,
};

type Props = z.infer<typeof propsSchema>;

export default function TickerCard() {
  const { props, isPending } = useWidget<Props>();
  const colors = useColors();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 32, textAlign: "center", color: colors.textSecondary }}>
          Loading ticker...
        </div>
      </McpUseProvider>
    );
  }

  const { ticker } = props;
  const change = parseFloat(ticker.change_24h);
  const isPositive = change >= 0;
  const changeColor = isPositive ? colors.green : colors.red;
  const changeBg = isPositive ? colors.greenBg : colors.redBg;

  return (
    <McpUseProvider autoSize>
      <div style={{
        padding: 20, backgroundColor: colors.bg, color: colors.text,
        border: `1px solid ${colors.border}`, borderRadius: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{ticker.symbol}</h2>
          <span style={{
            padding: "4px 12px", fontSize: 13, fontWeight: 600, borderRadius: 8,
            backgroundColor: changeBg, color: changeColor,
          }}>
            {isPositive ? "+" : ""}{change.toFixed(2)}%
          </span>
        </div>

        <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 20 }}>
          ${parseFloat(ticker.mark_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        }}>
          <div style={{
            padding: 12, backgroundColor: colors.cardBg, borderRadius: 8,
            border: `1px solid ${colors.border}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: colors.textSecondary, marginBottom: 4 }}>
              24h Volume
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              ${parseFloat(ticker.volume_24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div style={{
            padding: 12, backgroundColor: colors.cardBg, borderRadius: 8,
            border: `1px solid ${colors.border}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: colors.textSecondary, marginBottom: 4 }}>
              Funding Rate
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {(parseFloat(ticker.funding_rate) * 100).toFixed(4)}%
            </div>
          </div>
        </div>
      </div>
    </McpUseProvider>
  );
}
