const BASE_URL = "https://api-public.liquidmax.xyz/v1";

function getHeaders(): Record<string, string> {
  const key = process.env.LIQUID_API_KEY;
  const secret = process.env.LIQUID_API_SECRET;
  if (!key || !secret) {
    throw new Error(
      "Missing LIQUID_API_KEY or LIQUID_API_SECRET environment variables",
    );
  }
  return {
    "X-API-Key": key,
    "X-API-Secret": secret,
    "Content-Type": "application/json",
  };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message: string;
    try {
      const err = (await res.json()) as { message?: string; error?: string };
      message = err.message || err.error || res.statusText;
    } catch {
      message = res.statusText;
    }
    throw new Error(`Liquid API ${res.status}: ${message}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---- Types ----

export interface Market {
  symbol: string;
  ticker: string;
  exchange: string;
  max_leverage: number;
  sz_decimals: number;
}

export interface Ticker {
  symbol: string;
  mark_price: string;
  volume_24h: string;
  change_24h: string;
  funding_rate: string;
}

export interface OrderbookLevel {
  price: string;
  size: string;
  count: number;
}

export interface Orderbook {
  symbol: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  timestamp: string | null;
}

export interface Account {
  equity: string;
  margin_used: string;
  available_balance: string;
  account_value: string;
}

export interface Position {
  symbol: string;
  side: string;
  size: string;
  entry_price: string;
  mark_price: string;
  leverage: string;
  unrealized_pnl: string;
  liquidation_price: string;
  margin_used: string;
}

export interface Order {
  order_id: string;
  symbol: string;
  side: string;
  type: string;
  size: string;
  price: string | null;
  leverage: number;
  status: string;
  exchange: string;
  tp: string | null;
  sl: string | null;
  reduce_only: boolean;
  created_at: string;
}

export interface PlaceOrderParams {
  symbol: string;
  side: "buy" | "sell";
  size: number;
  type?: "market" | "limit";
  price?: number;
  leverage?: number;
  tp?: number;
  sl?: number;
}

export interface ClosePositionResponse {
  symbol: string;
  status: string;
  message: string;
}

// ---- Client methods ----

export async function getMarkets(): Promise<Market[]> {
  return request<Market[]>("GET", "/markets");
}

export async function getTicker(symbol: string): Promise<Ticker> {
  return request<Ticker>("GET", `/markets/${encodeURIComponent(symbol)}/ticker`);
}

export async function getOrderbook(
  symbol: string,
  depth?: number,
): Promise<Orderbook> {
  const qs = depth ? `?depth=${depth}` : "";
  return request<Orderbook>(
    "GET",
    `/markets/${encodeURIComponent(symbol)}/orderbook${qs}`,
  );
}

export async function getAccount(): Promise<Account> {
  return request<Account>("GET", "/account");
}

export async function getPositions(): Promise<Position[]> {
  return request<Position[]>("GET", "/account/positions");
}

export async function placeOrder(params: PlaceOrderParams): Promise<Order> {
  return request<Order>("POST", "/orders", {
    symbol: params.symbol,
    side: params.side,
    size: params.size,
    type: params.type ?? "market",
    ...(params.price != null && { price: params.price }),
    ...(params.leverage != null && { leverage: params.leverage }),
    ...(params.tp != null && { tp: params.tp }),
    ...(params.sl != null && { sl: params.sl }),
  });
}

export async function cancelOrder(orderId: string): Promise<void> {
  return request<void>("DELETE", `/orders/${encodeURIComponent(orderId)}`);
}

export async function closePosition(
  symbol: string,
  size?: number,
): Promise<ClosePositionResponse> {
  return request<ClosePositionResponse>(
    "POST",
    `/positions/${encodeURIComponent(symbol)}/close`,
    size != null ? { size } : {},
  );
}
