export const widgetMetadata = {
  description: "Displays the user's recent Liquid trading prompts and activity",
  exposeAsTool: false,
};

type Props = {
  transactions: { id: string; action_type: string; timestamp: string }[];
};

export default function UsageHistory({ transactions }: Props) {
  // Wait for React to be available globally in context
  const React = (globalThis as any).React;
  if (!React) return null;

  return React.createElement(
    "div",
    {
      style: {
        fontFamily: "system-ui, sans-serif",
        padding: "16px",
        borderRadius: "12px",
        backgroundColor: "var(--bg-surface)",
        color: "var(--text-primary)",
      },
    },
    React.createElement(
      "h3",
      { style: { margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" } },
      "Your Recent History",
    ),
    transactions.length === 0
      ? React.createElement(
          "div",
          {
            style: {
              padding: "16px",
              textAlign: "center",
              backgroundColor: "var(--bg-elevated)",
              borderRadius: "8px",
              fontSize: "14px",
              color: "var(--text-secondary)",
            },
          },
          "No history found. Start trading to see your patterns!",
        )
      : React.createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: "8px" } },
          transactions.map((tx) =>
            React.createElement(
              "div",
              {
                key: tx.id,
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  backgroundColor: "var(--bg-elevated)",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                },
              },
              React.createElement(
                "span",
                {
                  style: {
                    fontSize: "13px",
                    fontWeight: "500",
                    fontFamily: "monospace",
                    padding: "4px 8px",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    color: "rgb(96, 165, 250)",
                    borderRadius: "4px",
                  },
                },
                tx.action_type,
              ),
              React.createElement(
                "span",
                { style: { fontSize: "12px", color: "var(--text-muted)" } },
                new Date(tx.timestamp).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }),
              ),
            ),
          ),
        ),
  );
}
