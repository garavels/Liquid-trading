import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

function useColors() {
  const theme = useWidgetTheme();
  return {
    bg: theme === "dark" ? "#1e1e1e" : "#ffffff",
    text: theme === "dark" ? "#e0e0e0" : "#1a1a1a",
    textSecondary: theme === "dark" ? "#a0a0a0" : "#666",
    border: theme === "dark" ? "#363636" : "#e5e5e5",
    headerBg: theme === "dark" ? "#2a2a2a" : "#f5f5f5",
    green: theme === "dark" ? "#4ade80" : "#16a34a",
    greenBg: theme === "dark" ? "rgba(74, 222, 128, 0.08)" : "rgba(22, 163, 74, 0.06)",
    red: theme === "dark" ? "#f87171" : "#dc2626",
    redBg: theme === "dark" ? "rgba(248, 113, 113, 0.08)" : "rgba(220, 38, 38, 0.06)",
  };
}

const levelSchema = z.object({
  price: z.string(),
  size: z.string(),
  count: z.number(),
});

const propsSchema = z.object({
  orderbook: z.object({
    symbol: z.string(),
    bids: z.array(levelSchema),
    asks: z.array(levelSchema),
    timestamp: z.string().nullable(),
  }),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display an order book with color-coded bids and asks",
  props: propsSchema,
  exposeAsTool: false,
};

type Props = z.infer<typeof propsSchema>;

export default function OrderbookView() {
  const { props, isPending } = useWidget<Props>();
  const colors = useColors();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 32, textAlign: "center", color: colors.textSecondary }}>
          Loading order book...
        </div>
      </McpUseProvider>
    );
  }

  const { orderbook } = props;
  const displayAsks = [...orderbook.asks].slice(0, 15).reverse();
  const displayBids = orderbook.bids.slice(0, 15);

  const maxSize = Math.max(
    ...orderbook.bids.map((l) => parseFloat(l.size)),
    ...orderbook.asks.map((l) => parseFloat(l.size)),
    1,
  );

  return (
    <McpUseProvider autoSize>
      <div style={{
        padding: 20, backgroundColor: colors.bg, color: colors.text,
        border: `1px solid ${colors.border}`, borderRadius: 12,
      }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 600 }}>
          {orderbook.symbol} Order Book
        </h2>

        <div style={{
          border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            padding: "8px 14px", backgroundColor: colors.headerBg,
            fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5,
            color: colors.textSecondary,
          }}>
            <div>Price</div>
            <div style={{ textAlign: "right" }}>Size</div>
            <div style={{ textAlign: "right" }}>Count</div>
          </div>

          {/* Asks (reversed so lowest ask is near the spread) */}
          {displayAsks.map((level, i) => {
            const pct = (parseFloat(level.size) / maxSize) * 100;
            return (
              <div key={`ask-${i}`} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                padding: "5px 14px", fontSize: 13, position: "relative",
                borderTop: `1px solid ${colors.border}`,
              }}>
                <div style={{
                  position: "absolute", top: 0, right: 0, bottom: 0,
                  width: `${pct}%`, backgroundColor: colors.redBg,
                }} />
                <div style={{ color: colors.red, fontWeight: 500, position: "relative" }}>
                  {parseFloat(level.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div style={{ textAlign: "right", position: "relative" }}>{parseFloat(level.size).toLocaleString()}</div>
                <div style={{ textAlign: "right", color: colors.textSecondary, position: "relative" }}>{level.count}</div>
              </div>
            );
          })}

          {/* Spread indicator */}
          {displayAsks.length > 0 && displayBids.length > 0 && (
            <div style={{
              padding: "6px 14px", backgroundColor: colors.headerBg,
              fontSize: 11, color: colors.textSecondary, textAlign: "center", fontWeight: 600,
            }}>
              Spread: ${(parseFloat(orderbook.asks[0].price) - parseFloat(orderbook.bids[0].price)).toFixed(2)}
            </div>
          )}

          {/* Bids */}
          {displayBids.map((level, i) => {
            const pct = (parseFloat(level.size) / maxSize) * 100;
            return (
              <div key={`bid-${i}`} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                padding: "5px 14px", fontSize: 13, position: "relative",
                borderTop: `1px solid ${colors.border}`,
              }}>
                <div style={{
                  position: "absolute", top: 0, right: 0, bottom: 0,
                  width: `${pct}%`, backgroundColor: colors.greenBg,
                }} />
                <div style={{ color: colors.green, fontWeight: 500, position: "relative" }}>
                  {parseFloat(level.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div style={{ textAlign: "right", position: "relative" }}>{parseFloat(level.size).toLocaleString()}</div>
                <div style={{ textAlign: "right", color: colors.textSecondary, position: "relative" }}>{level.count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </McpUseProvider>
  );
}
