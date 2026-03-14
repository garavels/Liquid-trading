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
    accent: theme === "dark" ? "#4a9eff" : "#0066cc",
    accentBg: theme === "dark" ? "#1a2a4a" : "#e3f2fd",
    warningBg: theme === "dark" ? "#3a3a1a" : "#fffbeb",
    warningText: theme === "dark" ? "#fbbf24" : "#d97706",
    successBg: theme === "dark" ? "#1a3a1a" : "#f0fdf4",
    successText: theme === "dark" ? "#4ade80" : "#16a34a",
  };
}

const propsSchema = z.object({
  order: z.object({
    symbol: z.string().optional(),
    side: z.string().optional(),
    size: z.union([z.string(), z.number()]).optional(),
    type: z.string().optional(),
    price: z.union([z.string(), z.number()]).nullable().optional(),
    leverage: z.union([z.string(), z.number()]).optional(),
    tp: z.union([z.string(), z.number()]).nullable().optional(),
    sl: z.union([z.string(), z.number()]).nullable().optional(),
    order_id: z.string().optional(),
    status: z.string().optional(),
    created_at: z.string().optional(),
    reduce_only: z.boolean().optional(),
    exchange: z.string().optional(),
  }),
  status: z.enum(["pending_confirmation", "executed"]),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display order confirmation or execution result",
  props: propsSchema,
  exposeAsTool: false,
};

type Props = z.infer<typeof propsSchema>;

function Row({ label, value, colors }: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", padding: "8px 0",
      borderBottom: `1px solid ${colors.border}`, fontSize: 13,
    }}>
      <span style={{ color: colors.textSecondary }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default function OrderConfirmation() {
  const { props, isPending, sendFollowUpMessage } = useWidget<Props>();
  const colors = useColors();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 32, textAlign: "center", color: colors.textSecondary }}>
          Preparing order...
        </div>
      </McpUseProvider>
    );
  }

  const { order, status } = props;
  const isBuy = order.side === "buy";
  const sideColor = isBuy ? colors.green : colors.red;
  const sideBg = isBuy ? colors.greenBg : colors.redBg;
  const isExecuted = status === "executed";

  return (
    <McpUseProvider autoSize>
      <div style={{
        padding: 20, backgroundColor: colors.bg, color: colors.text,
        border: `1px solid ${colors.border}`, borderRadius: 12,
      }}>
        {/* Status banner */}
        {!isExecuted ? (
          <div style={{
            padding: "10px 14px", marginBottom: 16, borderRadius: 8,
            backgroundColor: colors.warningBg, color: colors.warningText,
            fontSize: 13, fontWeight: 600, textAlign: "center",
          }}>
            Awaiting confirmation — say "confirm" to execute this order
          </div>
        ) : (
          <div style={{
            padding: "10px 14px", marginBottom: 16, borderRadius: 8,
            backgroundColor: colors.successBg, color: colors.successText,
            fontSize: 13, fontWeight: 600, textAlign: "center",
          }}>
            Order executed successfully
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{
            padding: "4px 12px", fontSize: 13, fontWeight: 700, borderRadius: 8,
            backgroundColor: sideBg, color: sideColor, textTransform: "uppercase",
          }}>
            {order.side}
          </span>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{order.symbol}</span>
        </div>

        {/* Details */}
        <div style={{ marginBottom: 16 }}>
          <Row label="Size (USD)" value={`$${Number(order.size).toLocaleString()}`} colors={colors} />
          <Row label="Type" value={String(order.type ?? "market").toUpperCase()} colors={colors} />
          {order.price && <Row label="Price" value={`$${Number(order.price).toLocaleString()}`} colors={colors} />}
          <Row label="Leverage" value={`${order.leverage ?? 1}x`} colors={colors} />
          {order.tp && <Row label="Take Profit" value={`$${Number(order.tp).toLocaleString()}`} colors={colors} />}
          {order.sl && <Row label="Stop Loss" value={`$${Number(order.sl).toLocaleString()}`} colors={colors} />}
          {order.order_id && <Row label="Order ID" value={order.order_id} colors={colors} />}
          {order.status && <Row label="Status" value={order.status} colors={colors} />}
        </div>

        {!isExecuted && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => sendFollowUpMessage("Confirm the order")}
              style={{
                flex: 1, padding: "10px 16px", fontSize: 14, fontWeight: 600,
                border: "none", borderRadius: 8, cursor: "pointer",
                backgroundColor: isBuy ? colors.green : colors.red,
                color: "#fff",
              }}
            >
              Confirm {order.side?.toUpperCase()}
            </button>
            <button
              onClick={() => sendFollowUpMessage("Cancel, do not place this order")}
              style={{
                padding: "10px 16px", fontSize: 14, fontWeight: 500,
                border: `1px solid ${colors.border}`, borderRadius: 8, cursor: "pointer",
                backgroundColor: colors.cardBg, color: colors.text,
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </McpUseProvider>
  );
}
