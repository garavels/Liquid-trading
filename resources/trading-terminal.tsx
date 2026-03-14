import { useState } from "react";
import {
  McpUseProvider,
  useWidget,
  useCallTool,
  useWidgetTheme,
  type WidgetMetadata,
} from "mcp-use/react";
import { z } from "zod";

// ─── Theme ───────────────────────────────────────────────────

function useColors() {
  const theme = useWidgetTheme();
  const isDark = theme === "dark";
  return {
    bg: isDark ? "#111113" : "#ffffff",
    surface: isDark ? "#1a1a1f" : "#fafafa",
    elevated: isDark ? "#222228" : "#f5f5f5",
    text: isDark ? "#e4e4e7" : "#18181b",
    textSecondary: isDark ? "#a1a1aa" : "#71717a",
    textMuted: isDark ? "#6e6e76" : "#a1a1aa",
    border: isDark ? "#2e2e35" : "#e4e4e7",
    borderSubtle: isDark ? "#252529" : "#f0f0f2",
    accent: isDark ? "#6366f1" : "#4f46e5",
    accentBg: isDark ? "rgba(99,102,241,0.12)" : "rgba(79,70,229,0.08)",
    accentText: isDark ? "#a5b4fc" : "#4f46e5",
    green: isDark ? "#4ade80" : "#16a34a",
    greenBg: isDark ? "rgba(74,222,128,0.1)" : "rgba(22,163,74,0.06)",
    red: isDark ? "#f87171" : "#dc2626",
    redBg: isDark ? "rgba(248,113,113,0.1)" : "rgba(220,38,38,0.06)",
    warningBg: isDark ? "rgba(251,191,36,0.1)" : "#fffbeb",
    warningText: isDark ? "#fbbf24" : "#d97706",
    successBg: isDark ? "rgba(74,222,128,0.1)" : "#f0fdf4",
    successText: isDark ? "#4ade80" : "#16a34a",
  };
}

// ─── Schema ──────────────────────────────────────────────────

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
  description:
    "Unified trading terminal — browse markets, view prices, and place orders in one widget",
  props: propsSchema,
  exposeAsTool: false,
};

type Props = z.infer<typeof propsSchema>;
type Tab = "markets" | "ticker" | "order";

// ─── Sub-components ──────────────────────────────────────────

function TabBar({
  active,
  onSwitch,
  symbol,
  colors,
}: {
  active: Tab;
  onSwitch: (t: Tab) => void;
  symbol: string | null;
  colors: ReturnType<typeof useColors>;
}) {
  const tabs: { key: Tab; label: string; icon: string; disabled?: boolean }[] = [
    { key: "markets", label: "Markets", icon: "📊" },
    { key: "ticker", label: "Price", icon: "💰", disabled: !symbol },
    { key: "order", label: "Trade", icon: "📝", disabled: !symbol },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        padding: "4px",
        backgroundColor: colors.surface,
        borderRadius: 10,
        marginBottom: 16,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => !t.disabled && onSwitch(t.key)}
          disabled={t.disabled}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: active === t.key ? 600 : 500,
            border: "none",
            borderRadius: 8,
            cursor: t.disabled ? "default" : "pointer",
            transition: "all 0.2s",
            backgroundColor: active === t.key ? colors.accent : "transparent",
            color: t.disabled
              ? colors.textMuted
              : active === t.key
                ? "#fff"
                : colors.textSecondary,
            opacity: t.disabled ? 0.4 : 1,
          }}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

function MarketsView({
  markets,
  onSelect,
  colors,
}: {
  markets: Props["markets"];
  onSelect: (symbol: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [search, setSearch] = useState("");
  const filtered = search
    ? markets.filter((m) =>
        m.symbol.toLowerCase().includes(search.toLowerCase()),
      )
    : markets;

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search markets..."
        style={{
          width: "100%",
          padding: "10px 14px",
          marginBottom: 12,
          fontSize: 13,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          backgroundColor: colors.surface,
          color: colors.text,
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {/* Count badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 12, color: colors.textMuted }}>
          {filtered.length} market{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          padding: "8px 12px",
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: colors.textMuted,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div>Symbol</div>
        <div style={{ textAlign: "right" }}>Exchange</div>
        <div style={{ textAlign: "right" }}>Max Lev.</div>
      </div>

      {/* Rows */}
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {filtered.map((market) => (
          <div
            key={market.symbol}
            onClick={() => onSelect(market.symbol)}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              padding: "10px 12px",
              fontSize: 13,
              borderBottom: `1px solid ${colors.borderSubtle}`,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.elevated;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <div style={{ fontWeight: 600 }}>{market.symbol}</div>
            <div style={{ textAlign: "right", color: colors.textSecondary }}>
              {market.exchange}
            </div>
            <div style={{ textAlign: "right" }}>{market.max_leverage}x</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TickerView({
  symbol,
  onTrade,
  onBack,
  colors,
}: {
  symbol: string;
  onTrade: () => void;
  onBack: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const {
    callTool,
    data,
    isPending: loading,
    isError,
    error,
  } = useCallTool("get_ticker") as any;

  // Fetch on mount
  const [fetched, setFetched] = useState(false);
  if (!fetched) {
    setFetched(true);
    (callTool as any)({ symbol });
  }

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: colors.textSecondary,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: `2px solid ${colors.border}`,
            borderTopColor: colors.accent,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        Loading {symbol}...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: 20 }}>
        <div
          style={{
            padding: 14,
            backgroundColor: colors.redBg,
            color: colors.red,
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {error instanceof Error ? error.message : "Failed to load ticker"}
        </div>
        <button
          onClick={onBack}
          style={{
            padding: "8px 16px",
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            backgroundColor: colors.surface,
            color: colors.text,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          ← Back to Markets
        </button>
      </div>
    );
  }

  // Parse the ticker from the structuredContent
  const ticker = (data as any)?.structuredContent?.ticker ??
    (data as any)?.content?.[0]?.resource?.ticker ?? null;

  if (!ticker) {
    // Fallback: parse from text content
    const textContent = (data as any)?.content?.[0]?.text ?? "";
    const priceMatch = textContent.match(/\$([0-9,.]+)/);
    return (
      <div style={{ padding: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <button
              onClick={onBack}
              style={{
                background: "none",
                border: "none",
                color: colors.textSecondary,
                cursor: "pointer",
                fontSize: 13,
                padding: 0,
                marginBottom: 4,
              }}
            >
              ← Markets
            </button>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
              {symbol}
            </h2>
          </div>
        </div>
        <div style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16 }}>
          {textContent || "Ticker data loaded"}
        </div>
        <button
          onClick={onTrade}
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            backgroundColor: colors.accent,
            color: "#fff",
          }}
        >
          Trade {symbol}
        </button>
      </div>
    );
  }

  const change = parseFloat(ticker.change_24h || "0");
  const isPositive = change >= 0;

  return (
    <div style={{ padding: 4 }}>
      {/* Back + Header */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: colors.textSecondary,
            cursor: "pointer",
            fontSize: 13,
            padding: 0,
            marginBottom: 8,
          }}
        >
          ← Markets
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            {ticker.symbol || symbol}
          </h2>
          <span
            style={{
              padding: "4px 12px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              backgroundColor: isPositive ? colors.greenBg : colors.redBg,
              color: isPositive ? colors.green : colors.red,
            }}
          >
            {isPositive ? "+" : ""}
            {change.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Price */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          marginBottom: 20,
          letterSpacing: -0.5,
        }}
      >
        $
        {parseFloat(ticker.mark_price).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: 14,
            backgroundColor: colors.surface,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: colors.textMuted,
              marginBottom: 4,
            }}
          >
            24h Volume
          </div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            $
            {parseFloat(ticker.volume_24h).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
        <div
          style={{
            padding: 14,
            backgroundColor: colors.surface,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: colors.textMuted,
              marginBottom: 4,
            }}
          >
            Funding Rate
          </div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {(parseFloat(ticker.funding_rate) * 100).toFixed(4)}%
          </div>
        </div>
      </div>

      {/* Trade button */}
      <button
        onClick={onTrade}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: 14,
          fontWeight: 600,
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          backgroundColor: colors.accent,
          color: "#fff",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
      >
        Trade {ticker.symbol || symbol}
      </button>
    </div>
  );
}

function OrderView({
  symbol,
  maxLeverage,
  onBack,
  colors,
}: {
  symbol: string;
  maxLeverage: number;
  onBack: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [size, setSize] = useState("");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [price, setPrice] = useState("");
  const [leverage, setLeverage] = useState("1");
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");

  const {
    callTool: callPlaceOrder,
    data: orderData,
    isPending: orderPending,
    isError: orderError,
    error: orderErr,
  } = useCallTool("place_order");

  const [orderStage, setOrderStage] = useState<
    "form" | "preview" | "executed"
  >("form");

  const handlePreview = () => {
    if (!size || parseFloat(size) <= 0) return;
    const params: Record<string, unknown> = {
      symbol,
      side,
      size: parseFloat(size),
      type: orderType,
      leverage: parseInt(leverage) || 1,
      confirmed: false,
    };
    if (orderType === "limit" && price) params.price = parseFloat(price);
    if (tp) params.tp = parseFloat(tp);
    if (sl) params.sl = parseFloat(sl);

    callPlaceOrder(params as any, {
      onSuccess: () => setOrderStage("preview"),
    });
  };

  const handleConfirm = () => {
    const params: Record<string, unknown> = {
      symbol,
      side,
      size: parseFloat(size),
      type: orderType,
      leverage: parseInt(leverage) || 1,
      confirmed: true,
    };
    if (orderType === "limit" && price) params.price = parseFloat(price);
    if (tp) params.tp = parseFloat(tp);
    if (sl) params.sl = parseFloat(sl);

    callPlaceOrder(params as any, {
      onSuccess: () => setOrderStage("executed"),
    });
  };

  const resetForm = () => {
    setOrderStage("form");
    setSize("");
    setPrice("");
    setTp("");
    setSl("");
  };

  const isBuy = side === "buy";
  const sideColor = isBuy ? colors.green : colors.red;
  const sideBg = isBuy ? colors.greenBg : colors.redBg;

  // ── Executed banner ──
  if (orderStage === "executed" && !orderPending) {
    const resultText = (orderData as any)?.content?.[0]?.text ?? "Order submitted";
    return (
      <div style={{ padding: 4 }}>
        <div
          style={{
            padding: 16,
            backgroundColor: colors.successBg,
            color: colors.successText,
            borderRadius: 8,
            textAlign: "center",
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          ✓ Order Executed
        </div>
        <div
          style={{
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          {resultText}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={resetForm}
            style={{
              flex: 1,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              backgroundColor: colors.accent,
              color: "#fff",
            }}
          >
            New Order
          </button>
          <button
            onClick={onBack}
            style={{
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 500,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              cursor: "pointer",
              backgroundColor: colors.surface,
              color: colors.text,
            }}
          >
            ← Markets
          </button>
        </div>
      </div>
    );
  }

  // ── Preview banner ──
  if (orderStage === "preview" && !orderPending) {
    return (
      <div style={{ padding: 4 }}>
        <div
          style={{
            padding: 12,
            backgroundColor: colors.warningBg,
            color: colors.warningText,
            borderRadius: 8,
            textAlign: "center",
            fontWeight: 600,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          ⚠ Review your order before confirming
        </div>

        {/* Order summary */}
        <div
          style={{
            padding: 16,
            backgroundColor: colors.surface,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                padding: "3px 10px",
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 6,
                backgroundColor: sideBg,
                color: sideColor,
                textTransform: "uppercase",
              }}
            >
              {side}
            </span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{symbol}</span>
          </div>
          {[
            ["Size", `$${parseFloat(size).toLocaleString()}`],
            ["Type", orderType.toUpperCase()],
            ...(orderType === "limit" && price
              ? [["Price", `$${parseFloat(price).toLocaleString()}`]]
              : []),
            ["Leverage", `${leverage}x`],
            ...(tp ? [["Take Profit", `$${parseFloat(tp).toLocaleString()}`]] : []),
            ...(sl ? [["Stop Loss", `$${parseFloat(sl).toLocaleString()}`]] : []),
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: `1px solid ${colors.borderSubtle}`,
                fontSize: 13,
              }}
            >
              <span style={{ color: colors.textSecondary }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleConfirm}
            disabled={orderPending}
            style={{
              flex: 1,
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              borderRadius: 8,
              cursor: orderPending ? "wait" : "pointer",
              backgroundColor: sideColor,
              color: "#fff",
            }}
          >
            {orderPending ? "Submitting..." : `Confirm ${side.toUpperCase()}`}
          </button>
          <button
            onClick={resetForm}
            style={{
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 500,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              cursor: "pointer",
              backgroundColor: colors.surface,
              color: colors.text,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Order Form ──
  return (
    <div style={{ padding: 4 }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: colors.textSecondary,
          cursor: "pointer",
          fontSize: 13,
          padding: 0,
          marginBottom: 12,
        }}
      >
        ← Back to Price
      </button>

      <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>
        Trade {symbol}
      </h3>

      {orderError && (
        <div
          style={{
            padding: 12,
            backgroundColor: colors.redBg,
            color: colors.red,
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {orderErr instanceof Error ? orderErr.message : "Order failed"}
        </div>
      )}

      {/* Side toggle */}
      <div
        style={{
          display: "flex",
          gap: 2,
          padding: 3,
          backgroundColor: colors.surface,
          borderRadius: 8,
          marginBottom: 14,
        }}
      >
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            style={{
              flex: 1,
              padding: "8px 0",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              textTransform: "uppercase",
              transition: "all 0.15s",
              backgroundColor:
                side === s
                  ? s === "buy"
                    ? colors.green
                    : colors.red
                  : "transparent",
              color:
                side === s
                  ? "#fff"
                  : s === "buy"
                    ? colors.green
                    : colors.red,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Order type */}
      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: colors.textSecondary,
            marginBottom: 4,
          }}
        >
          Order Type
        </label>
        <div style={{ display: "flex", gap: 2, padding: 2, backgroundColor: colors.surface, borderRadius: 6 }}>
          {(["market", "limit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              style={{
                flex: 1,
                padding: "6px 0",
                fontSize: 12,
                fontWeight: 500,
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
                textTransform: "capitalize",
                backgroundColor: orderType === t ? colors.elevated : "transparent",
                color: orderType === t ? colors.text : colors.textMuted,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Limit price */}
      {orderType === "limit" && (
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: colors.textSecondary,
              marginBottom: 4,
            }}
          >
            Limit Price ($)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 14,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              backgroundColor: colors.surface,
              color: colors.text,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* Size */}
      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: colors.textSecondary,
            marginBottom: 4,
          }}
        >
          Size (USD)
        </label>
        <input
          type="number"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="100"
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 14,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            backgroundColor: colors.surface,
            color: colors.text,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Leverage */}
      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: colors.textSecondary,
            marginBottom: 4,
          }}
        >
          Leverage (1–{maxLeverage})
        </label>
        <input
          type="number"
          value={leverage}
          onChange={(e) => setLeverage(e.target.value)}
          min={1}
          max={maxLeverage}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 14,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            backgroundColor: colors.surface,
            color: colors.text,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* TP / SL */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: colors.textSecondary,
              marginBottom: 4,
            }}
          >
            Take Profit ($)
          </label>
          <input
            type="number"
            value={tp}
            onChange={(e) => setTp(e.target.value)}
            placeholder="Optional"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 13,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              backgroundColor: colors.surface,
              color: colors.text,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: colors.textSecondary,
              marginBottom: 4,
            }}
          >
            Stop Loss ($)
          </label>
          <input
            type="number"
            value={sl}
            onChange={(e) => setSl(e.target.value)}
            placeholder="Optional"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 13,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              backgroundColor: colors.surface,
              color: colors.text,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handlePreview}
        disabled={!size || parseFloat(size) <= 0 || orderPending}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: 14,
          fontWeight: 600,
          border: "none",
          borderRadius: 8,
          cursor:
            !size || parseFloat(size) <= 0 || orderPending
              ? "not-allowed"
              : "pointer",
          backgroundColor: sideColor,
          color: "#fff",
          opacity: !size || parseFloat(size) <= 0 ? 0.5 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {orderPending
          ? "Processing..."
          : `Preview ${side.toUpperCase()} Order`}
      </button>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────

export default function TradingTerminal() {
  const { props, isPending } = useWidget<Props>();
  const colors = useColors();

  const [activeTab, setActiveTab] = useState<Tab>("markets");
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: colors.textSecondary,
          }}
        >
          Opening trading terminal...
        </div>
      </McpUseProvider>
    );
  }

  const selectedMarket = selectedSymbol
    ? props.markets.find((m) => m.symbol === selectedSymbol)
    : null;

  const handleSelectMarket = (symbol: string) => {
    setSelectedSymbol(symbol);
    setActiveTab("ticker");
  };

  return (
    <McpUseProvider autoSize>
      <div
        style={{
          padding: 16,
          backgroundColor: colors.bg,
          color: colors.text,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          minWidth: 340,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 18 }}>⚡</span>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
            Liquid Terminal
          </h2>
          {selectedSymbol && (
            <span
              style={{
                marginLeft: "auto",
                padding: "3px 10px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                backgroundColor: colors.accentBg,
                color: colors.accentText,
              }}
            >
              {selectedSymbol}
            </span>
          )}
        </div>

        {/* Tabs */}
        <TabBar
          active={activeTab}
          onSwitch={setActiveTab}
          symbol={selectedSymbol}
          colors={colors}
        />

        {/* Content */}
        {activeTab === "markets" && (
          <MarketsView
            markets={props.markets}
            onSelect={handleSelectMarket}
            colors={colors}
          />
        )}

        {activeTab === "ticker" && selectedSymbol && (
          <TickerView
            key={selectedSymbol}
            symbol={selectedSymbol}
            onTrade={() => setActiveTab("order")}
            onBack={() => setActiveTab("markets")}
            colors={colors}
          />
        )}

        {activeTab === "order" && selectedSymbol && (
          <OrderView
            symbol={selectedSymbol}
            maxLeverage={selectedMarket?.max_leverage ?? 100}
            onBack={() => setActiveTab("ticker")}
            colors={colors}
          />
        )}
      </div>
    </McpUseProvider>
  );
}
