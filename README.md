# Liquid Trading MCP Server

Trade **Hyperliquid perpetual futures** via natural language using the [Liquid API](https://sdk.tryliquid.xyz). Connect from Claude Desktop, ChatGPT, Cursor, or any MCP-compatible client.

---

## What it does

A fully featured trading session in natural language:

- **Check your portfolio** — account equity, balances, open positions
- **Read market data** — prices, order books, funding rates across all perpetual markets
- **Place and manage orders** — market/limit orders with leverage, TP/SL, and confirmation widgets
- **Close positions** — full or partial close with confirmation before execution

All sizes are in **USD notional**. All markets are **perpetual futures** on Hyperliquid.

---

## MCP Tools

| Tool | Description | Input |
|------|-------------|-------|
| `get_markets` | List all tradeable perpetual markets | — |
| `get_ticker` | Price, volume, funding rate for a symbol | `{ symbol }` |
| `get_orderbook` | Bids and asks for a symbol | `{ symbol, depth? }` |
| `get_account` | Equity, available balance, margin used | — |
| `get_positions` | All open positions with PnL | — |
| `place_order` | Place a buy/sell order (confirmation required) | `{ symbol, side, size, type?, price?, leverage?, tp?, sl? }` |
| `cancel_order` | Cancel an open order | `{ order_id }` |
| `close_position` | Close a position fully or partially (confirmation required) | `{ symbol, size? }` |

### Safety

`place_order` and `close_position` require explicit confirmation before execution — these are real financial transactions. A confirmation widget is shown first; the order is only submitted after the user confirms.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) runtime
- A Liquid API key and secret ([get one here](https://sdk.tryliquid.xyz))

### Setup

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your LIQUID_API_KEY and LIQUID_API_SECRET

# Run in dev mode
bun run dev
```

The server starts at `http://localhost:3000`. Open `/inspector` to test tools interactively.

---

## Connecting from Claude Desktop

Add to your Claude Desktop MCP config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

## Connecting from ChatGPT

Point ChatGPT to the HTTP URL:

```
http://localhost:3000
```

Interactive widgets are rendered directly in the conversation for market data, positions, and order confirmations.

---

## Tech Stack

- **[mcp-use](https://mcp-use.com)** — MCP server framework with widget support
- **[Liquid API](https://sdk.tryliquid.xyz)** — REST API wrapping Hyperliquid perpetual futures
- **React** — interactive ChatGPT widgets
- **Zod** — schema validation for all tool inputs
- **TypeScript** strict mode

---

## License

MIT
