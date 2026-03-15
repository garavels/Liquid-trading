# Liquid Trading MCP Server

> Trade **Hyperliquid perpetual futures** via natural language using the [Liquid API](https://sdk.tryliquid.xyz). Connect from Claude Desktop, ChatGPT, Cursor, or any MCP-compatible client.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/runtime-Bun-black?logo=bun)](https://bun.sh)
[![mcp-use](https://img.shields.io/badge/MCP-mcp--use-purple)](https://mcp-use.com)

---

## What It Does

A fully featured trading session in natural language. Ask your AI assistant to:

- **Check your portfolio** — account equity, balances, open positions with real-time PnL
- **Read market data** — prices, order books, funding rates across all Hyperliquid perpetual markets
- **Explore price history** — OHLCV candlestick charts at multiple timeframes
- **Place and manage orders** — market/limit orders with leverage (1-200x), take-profit, stop-loss
- **Close positions** — full or partial close with confirmation before any execution
- **Track usage** — view your recent trading prompts and transaction history

All sizes are in **USD notional**. All markets are **perpetual futures** on Hyperliquid.

---

## MCP Tools

| Tool | Description | Inputs |
|------|-------------|--------|
| `get_markets` | List all tradeable perpetual markets | — |
| `get_ticker` | Price, volume, and funding rate for a symbol | `symbol` |
| `get_orderbook` | Bids and asks with configurable depth | `symbol`, `depth?` |
| `get_candles` | OHLCV chart data at any timeframe | `symbol`, `interval`, `limit?` |
| `trading_terminal` | Unified widget — browse markets, charts, and place orders | `symbol?` |
| `get_account` | Equity, available balance, margin used | — |
| `get_positions` | All open positions with entry/mark price, PnL, liquidation | — |
| `place_order` | Place a buy/sell order (confirmation required) | `symbol`, `side`, `size`, `type?`, `price?`, `leverage?`, `tp?`, `sl?` |
| `cancel_order` | Cancel an open order by ID | `order_id` |
| `close_position` | Close a position fully or partially (confirmation required) | `symbol`, `size?` |
| `get_usage_patterns` | View recent trading prompts and transaction history | — |

### Safety

`place_order` and `close_position` **require explicit confirmation before execution** — these are real financial transactions. A confirmation widget is shown first; the order is only submitted after the user confirms.

---

## Interactive Widgets

The server renders rich interactive widgets directly in your AI conversation:

| Widget | Description |
|--------|-------------|
| **Account Summary** | Equity, balance, and margin overview card |
| **Markets List** | Searchable table of all perpetual markets with leverage |
| **Ticker Card** | Real-time price, volume, and funding rate |
| **Order Book** | Color-coded bids/asks with configurable depth |
| **Price Chart** | OHLCV candlestick chart (Recharts) at 1m–1d intervals |
| **Positions Table** | Open positions with color-coded PnL |
| **Order Confirmation** | Preview and confirm before any order is placed |
| **Close Confirmation** | Preview and confirm before any position is closed |
| **Trading Terminal** | Unified multi-tab interface for browsing and trading |

Widgets render natively in **ChatGPT** via the Apps SDK and in **Claude Desktop** via mcp-use.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) runtime (v1.0+)
- A Liquid API key and secret — [get one here](https://sdk.tryliquid.xyz)
- _(Optional)_ A [Supabase](https://supabase.com) project for analytics tracking

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/liquid-trading.git
cd liquid-trading

# Install dependencies
bun install
```

### Environment Variables

Create a `.env` file at the project root:

```env
# Required — Liquid API credentials
LIQUID_API_KEY=lq_your_api_key
LIQUID_API_SECRET=sk_your_api_secret

# Server port (default: 3000)
PORT=3000

# Optional — Analytics via Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### Run

```bash
# Development (hot reload)
bun run dev

# Production
bun run build
bun run start
```

The server starts at `http://localhost:3000`. Open `/inspector` to test all tools interactively.

---

## Connecting to AI Clients

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "liquid-trading": {
      "command": "bun",
      "args": ["run", "start"],
      "cwd": "/path/to/liquid-trading",
      "env": {
        "LIQUID_API_KEY": "lq_...",
        "LIQUID_API_SECRET": "sk_..."
      }
    }
  }
}
```

### ChatGPT (HTTP/SSE)

Point ChatGPT to the HTTP URL of your running server:

```
http://localhost:3000
```

Interactive widgets render directly in the conversation for market data, positions, and order confirmations.

### Cursor / Other MCP Clients

Add the server URL or stdio command in your MCP client settings. Refer to your client's documentation for MCP server configuration.

---

## Analytics Dashboard

An optional **Next.js dashboard** is included under `/dashboard` for visualizing trading activity and usage patterns backed by Supabase.

```bash
cd dashboard
npm install
npm run dev
```

Configure `/dashboard/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_USER_KEY=your_supabase_anon_key
```

### Seed Data

Populate the database with mock transactions for local development:

```bash
bun src/scripts/seed.ts
```

---

## Project Structure

```
liquid-trading/
├── index.ts                     # MCP server entry point
├── src/
│   ├── tools/
│   │   ├── market.ts            # get_markets, get_ticker, get_orderbook, get_candles, trading_terminal
│   │   ├── account.ts           # get_account, get_positions
│   │   ├── trading.ts           # place_order, cancel_order, close_position
│   │   └── analytics.ts         # get_usage_patterns
│   ├── liquid/
│   │   └── client.ts            # Liquid API client (HMAC-SHA256 signing)
│   ├── tracker.ts               # Supabase transaction tracker
│   └── scripts/
│       └── seed.ts              # Mock data seeding
├── resources/                   # React widget components
│   ├── trading-terminal.tsx     # Unified multi-tab trading interface
│   ├── price-chart.tsx          # OHLCV candlestick chart
│   ├── order-confirmation.tsx   # Pre-trade confirmation widget
│   ├── positions-table.tsx      # Open positions display
│   └── ...                      # Other widgets
├── dashboard/                   # Next.js analytics dashboard
│   └── src/
├── prisma/
│   └── schema.prisma            # Transaction model schema
└── public/                      # Static assets
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Bun](https://bun.sh) |
| Language | TypeScript 5.9 (strict) |
| MCP Framework | [mcp-use](https://mcp-use.com) |
| Trading API | [Liquid API](https://sdk.tryliquid.xyz) (Hyperliquid) |
| Widgets | React 19 + TailwindCSS 4 |
| Charts | Recharts |
| Validation | Zod 4 |
| HTTP Server | Express 5 |
| Database | PostgreSQL via Prisma + Supabase |
| Dashboard | Next.js 16 |
| Build | Vite 7 |

---

## Example Prompts

Once connected to your AI client:

```
"What's the current price of ETH-PERP?"
"Show me my open positions."
"Buy 100 USD of BTC-PERP at market with 10x leverage."
"Show me a 1-hour price chart for SOL-PERP."
"What's the order book depth for ARB-PERP?"
"Close half of my ETH position."
"Cancel order 12345."
"Show me my recent trading history."
```

---

## License

MIT — see [LICENSE](LICENSE) for details.
