import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const candleSchema = z.object({
  timestamp: z.number(),
  open: z.string(),
  high: z.string(),
  low: z.string(),
  close: z.string(),
  volume: z.string(),
});

const propsSchema = z.object({
  symbol: z.string(),
  interval: z.string(),
  candles: z.array(candleSchema),
});

export const widgetMetadata: WidgetMetadata = {
  description: "OHLCV candlestick price chart for a trading symbol",
  props: propsSchema,
  exposeAsTool: false,
  metadata: {
    invoking: "Loading chart...",
    invoked: "Chart ready",
  },
};

type Props = z.infer<typeof propsSchema>;

function formatPrice(price: number): string {
  if (price >= 10000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

function formatTime(timestamp: number, interval: string): string {
  const d = new Date(timestamp);
  if (interval === "1d") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (interval === "4h" || interval === "1h") {
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", hour12: false });
  }
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toFixed(2);
}

export default function PriceChart() {
  const { props, isPending } = useWidget<Props>();
  const theme = useWidgetTheme();

  const bg = theme === "dark" ? "#141414" : "#ffffff";
  const textColor = theme === "dark" ? "#e0e0e0" : "#1a1a1a";
  const textMuted = theme === "dark" ? "#555" : "#aaa";
  const gridColor = theme === "dark" ? "#1f1f1f" : "#f3f3f3";
  const axisColor = theme === "dark" ? "#2a2a2a" : "#e8e8e8";
  const upColor = "#26a69a";
  const downColor = "#ef5350";

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 40, textAlign: "center", color: textMuted, backgroundColor: bg, fontFamily: "system-ui, sans-serif" }}>
          <div style={{
            width: 32, height: 32,
            border: `3px solid ${axisColor}`,
            borderTop: `3px solid ${theme === "dark" ? "#4a9eff" : "#0066cc"}`,
            borderRadius: "50%",
            margin: "0 auto 12px",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          Loading chart...
        </div>
      </McpUseProvider>
    );
  }

  const { symbol, interval, candles } = props;

  if (!candles || candles.length === 0) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 20, color: textMuted, backgroundColor: bg, fontFamily: "system-ui, sans-serif" }}>
          No candle data available.
        </div>
      </McpUseProvider>
    );
  }

  // Parse numeric values
  const parsed = candles.map(c => ({
    timestamp: c.timestamp,
    open: parseFloat(c.open),
    high: parseFloat(c.high),
    low: parseFloat(c.low),
    close: parseFloat(c.close),
    volume: parseFloat(c.volume),
  }));

  // Layout constants
  const svgW = 700;
  const pL = 8;
  const pR = 68;
  const pT = 12;
  const priceH = 260;
  const gap = 8;
  const volH = 50;
  const pB = 28;
  const chartW = svgW - pL - pR;
  const volTop = pT + priceH + gap;
  const svgH = pT + priceH + gap + volH + pB;

  // Price range
  const minPrice = Math.min(...parsed.map(c => c.low));
  const maxPrice = Math.max(...parsed.map(c => c.high));
  const priceRange = maxPrice - minPrice || 1;
  const pad = priceRange * 0.06;
  const eMin = minPrice - pad;
  const eMax = maxPrice + pad;
  const eRange = eMax - eMin;

  const maxVol = Math.max(...parsed.map(c => c.volume)) || 1;

  const n = parsed.length;
  const stepW = chartW / n;
  const bodyW = Math.max(1, stepW * 0.65);

  function pY(price: number): number {
    return pT + priceH - ((price - eMin) / eRange) * priceH;
  }

  function cX(i: number): number {
    return pL + (i + 0.5) * stepW;
  }

  // Y-axis grid levels
  const gridCount = 5;
  const gridPrices = Array.from({ length: gridCount }, (_, i) =>
    eMin + (i / (gridCount - 1)) * eRange
  );

  // X-axis time labels (~6 evenly spaced)
  const maxLabels = 6;
  const labelStep = Math.max(1, Math.floor(n / maxLabels));
  const timeLabels = parsed
    .map((c, i) => ({ i, ts: c.timestamp }))
    .filter((_, i) => i % labelStep === 0 || i === n - 1);

  const last = parsed[parsed.length - 1];
  const first = parsed[0];
  const priceChange = last.close - first.open;
  const pctChange = first.open > 0 ? (priceChange / first.open) * 100 : 0;
  const isUp = priceChange >= 0;

  return (
    <McpUseProvider autoSize>
      <div style={{
        backgroundColor: bg,
        color: textColor,
        fontFamily: "'SF Mono', 'Roboto Mono', ui-monospace, monospace",
        padding: "16px 16px 12px",
        borderRadius: "10px",
        minWidth: "720px",
        boxSizing: "border-box",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>{symbol}</span>
          <span style={{
            fontSize: "11px",
            padding: "2px 7px",
            borderRadius: "4px",
            backgroundColor: theme === "dark" ? "#252525" : "#f0f0f0",
            color: textMuted,
            fontWeight: 500,
          }}>{interval}</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span style={{ fontSize: "22px", fontWeight: 600 }}>
              ${formatPrice(last.close)}
            </span>
            <span style={{
              fontSize: "13px",
              fontWeight: 500,
              color: isUp ? upColor : downColor,
            }}>
              {isUp ? "+" : ""}{formatPrice(priceChange)} ({pctChange >= 0 ? "+" : ""}{pctChange.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: "block", overflow: "visible" }}>
          {/* Price grid lines + labels */}
          {gridPrices.map((price, i) => {
            const y = pY(price);
            return (
              <g key={i}>
                <line x1={pL} y1={y} x2={svgW - pR} y2={y} stroke={gridColor} strokeWidth={1} />
                <text x={svgW - pR + 5} y={y + 4} fontSize={10} fill={textMuted} textAnchor="start">
                  {formatPrice(price)}
                </text>
              </g>
            );
          })}

          {/* Volume area bg */}
          <rect x={pL} y={volTop} width={chartW} height={volH} fill={theme === "dark" ? "#0e0e0e" : "#fafafa"} />
          <line x1={pL} y1={volTop} x2={svgW - pR} y2={volTop} stroke={axisColor} strokeWidth={1} />

          {/* Bottom axis line */}
          <line x1={pL} y1={pT + priceH} x2={svgW - pR} y2={pT + priceH} stroke={axisColor} strokeWidth={1} />

          {/* Candles */}
          {parsed.map((c, i) => {
            const x = cX(i);
            const isUpCandle = c.close >= c.open;
            const color = isUpCandle ? upColor : downColor;
            const bodyTop = pY(Math.max(c.open, c.close));
            const bodyBot = pY(Math.min(c.open, c.close));
            const bH = Math.max(1, bodyBot - bodyTop);
            const vh = (c.volume / maxVol) * volH;

            return (
              <g key={i}>
                {/* High-low wick */}
                <line x1={x} y1={pY(c.high)} x2={x} y2={pY(c.low)} stroke={color} strokeWidth={1} />
                {/* Body */}
                <rect
                  x={x - bodyW / 2} y={bodyTop}
                  width={bodyW} height={bH}
                  fill={isUpCandle ? upColor : downColor}
                  opacity={0.9}
                />
                {/* Volume bar */}
                <rect
                  x={x - bodyW / 2}
                  y={volTop + volH - vh}
                  width={bodyW}
                  height={vh}
                  fill={color}
                  opacity={0.35}
                />
              </g>
            );
          })}

          {/* Last price dashed line */}
          <line
            x1={pL} y1={pY(last.close)}
            x2={svgW - pR} y2={pY(last.close)}
            stroke={isUp ? upColor : downColor}
            strokeWidth={1}
            strokeDasharray="3,3"
            opacity={0.55}
          />

          {/* Last price badge */}
          <rect
            x={svgW - pR + 2} y={pY(last.close) - 9}
            width={pR - 4} height={18}
            fill={isUp ? upColor : downColor}
            rx={3}
          />
          <text
            x={svgW - pR + (pR - 4) / 2 + 2}
            y={pY(last.close) + 4}
            fontSize={10}
            fill="#ffffff"
            textAnchor="middle"
            fontWeight="bold"
          >
            {formatPrice(last.close)}
          </text>

          {/* Time labels */}
          {timeLabels.map(({ i, ts }) => (
            <text
              key={i}
              x={cX(i)}
              y={volTop + volH + 16}
              fontSize={10}
              fill={textMuted}
              textAnchor="middle"
            >
              {formatTime(ts, interval)}
            </text>
          ))}
        </svg>

        {/* OHLCV footer */}
        <div style={{
          display: "flex",
          gap: "18px",
          marginTop: "10px",
          paddingTop: "8px",
          borderTop: `1px solid ${gridColor}`,
          fontSize: "11px",
          color: textMuted,
        }}>
          <span>O <span style={{ color: textColor }}>{formatPrice(last.open)}</span></span>
          <span>H <span style={{ color: upColor }}>{formatPrice(last.high)}</span></span>
          <span>L <span style={{ color: downColor }}>{formatPrice(last.low)}</span></span>
          <span>C <span style={{ color: textColor }}>{formatPrice(last.close)}</span></span>
          <span>Vol <span style={{ color: textColor }}>{formatVolume(last.volume)}</span></span>
          <span style={{ marginLeft: "auto" }}>{n} candles</span>
        </div>
      </div>
    </McpUseProvider>
  );
}
