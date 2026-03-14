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
    red: theme === "dark" ? "#f87171" : "#dc2626",
    warningBg: theme === "dark" ? "#3a3a1a" : "#fffbeb",
    warningText: theme === "dark" ? "#fbbf24" : "#d97706",
    successBg: theme === "dark" ? "#1a3a1a" : "#f0fdf4",
    successText: theme === "dark" ? "#4ade80" : "#16a34a",
  };
}

const propsSchema = z.object({
  close: z.object({
    symbol: z.string(),
    size: z.union([z.string(), z.number()]),
    action: z.string().optional(),
    status: z.string().optional(),
    message: z.string().optional(),
  }),
  status: z.enum(["pending_confirmation", "executed"]),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display close position confirmation or result",
  props: propsSchema,
  exposeAsTool: false,
};

type Props = z.infer<typeof propsSchema>;

export default function ClosePositionConfirmation() {
  const { props, isPending, sendFollowUpMessage } = useWidget<Props>();
  const colors = useColors();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 32, textAlign: "center", color: colors.textSecondary }}>
          Preparing close...
        </div>
      </McpUseProvider>
    );
  }

  const { close, status } = props;
  const isExecuted = status === "executed";

  return (
    <McpUseProvider autoSize>
      <div style={{
        padding: 20, backgroundColor: colors.bg, color: colors.text,
        border: `1px solid ${colors.border}`, borderRadius: 12,
      }}>
        {!isExecuted ? (
          <div style={{
            padding: "10px 14px", marginBottom: 16, borderRadius: 8,
            backgroundColor: colors.warningBg, color: colors.warningText,
            fontSize: 13, fontWeight: 600, textAlign: "center",
          }}>
            Awaiting confirmation — say "confirm" to close this position
          </div>
        ) : (
          <div style={{
            padding: "10px 14px", marginBottom: 16, borderRadius: 8,
            backgroundColor: colors.successBg, color: colors.successText,
            fontSize: 13, fontWeight: 600, textAlign: "center",
          }}>
            Position closed successfully
          </div>
        )}

        <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 600 }}>
          Close Position: {close.symbol}
        </h2>

        <div style={{
          padding: 14, backgroundColor: colors.cardBg, borderRadius: 8,
          border: `1px solid ${colors.border}`, marginBottom: 16,
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8,
          }}>
            <span style={{ color: colors.textSecondary }}>Action</span>
            <span style={{ fontWeight: 600 }}>{close.action ?? (close.size === "full" ? "Full close" : `Partial close: ${close.size} units`)}</span>
          </div>
          {close.message && (
            <div style={{
              display: "flex", justifyContent: "space-between", fontSize: 13,
            }}>
              <span style={{ color: colors.textSecondary }}>Result</span>
              <span style={{ fontWeight: 600 }}>{close.message}</span>
            </div>
          )}
        </div>

        {!isExecuted && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => sendFollowUpMessage("Confirm, close the position")}
              style={{
                flex: 1, padding: "10px 16px", fontSize: 14, fontWeight: 600,
                border: "none", borderRadius: 8, cursor: "pointer",
                backgroundColor: colors.red, color: "#fff",
              }}
            >
              Confirm Close
            </button>
            <button
              onClick={() => sendFollowUpMessage("Cancel, do not close")}
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
