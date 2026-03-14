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
    accent: theme === "dark" ? "#4a9eff" : "#0066cc",
    accentBg: theme === "dark" ? "#1a2a4a" : "#e3f2fd",
  };
}

const propsSchema = z.object({
  account: z.object({
    equity: z.string(),
    margin_used: z.string(),
    available_balance: z.string(),
    account_value: z.string(),
  }),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display an account summary card with equity, balance, and margin",
  props: propsSchema,
  exposeAsTool: false,
};

type Props = z.infer<typeof propsSchema>;

function StatCard({ label, value, colors }: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <div style={{
      padding: 14, backgroundColor: colors.cardBg, borderRadius: 8,
      border: `1px solid ${colors.border}`,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, textTransform: "uppercase",
        letterSpacing: 0.5, color: colors.textSecondary, marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default function AccountSummary() {
  const { props, isPending } = useWidget<Props>();
  const colors = useColors();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 32, textAlign: "center", color: colors.textSecondary }}>
          Loading account...
        </div>
      </McpUseProvider>
    );
  }

  const { account } = props;
  const fmt = (v: string) =>
    `$${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <McpUseProvider autoSize>
      <div style={{
        padding: 20, backgroundColor: colors.bg, color: colors.text,
        border: `1px solid ${colors.border}`, borderRadius: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Account Overview</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <StatCard label="Equity" value={fmt(account.equity)} colors={colors} />
          <StatCard label="Account Value" value={fmt(account.account_value)} colors={colors} />
          <StatCard label="Available Balance" value={fmt(account.available_balance)} colors={colors} />
          <StatCard label="Margin Used" value={fmt(account.margin_used)} colors={colors} />
        </div>
      </div>
    </McpUseProvider>
  );
}
