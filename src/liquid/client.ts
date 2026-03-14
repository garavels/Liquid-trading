import { createHmac, createHash, randomBytes } from "crypto";

const BASE_URL = "https://api-public.liquidmax.xyz/v1";

function getCredentials() {
  const key = process.env.LIQUID_API_KEY;
  const secret = process.env.LIQUID_API_SECRET;
  if (!key || !secret) {
    throw new Error(
      "Missing LIQUID_API_KEY or LIQUID_API_SECRET environment variables",
    );
  }
  return { key, secret };
}

function generateNonce(): string {
  return randomBytes(16).toString("hex");
}

function hashBody(body?: string): string {
  if (!body) return "";
  return createHash("sha256").update(body).digest("hex");
}

function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

function signRequest(
  method: string,
  path: string,
  query: string,
  body?: unknown,
): Record<string, string> {
  const { key, secret } = getCredentials();
  const timestamp = Date.now().toString();
  const nonce = generateNonce();

  const canonicalMethod = method.toUpperCase();
  const canonicalPath = decodeURIComponent(path).toLowerCase().replace(/\/+$/, "");

  // Sort query params by key
  let canonicalQuery = "";
  if (query) {
    const params = new URLSearchParams(query);
    const sorted = [...params.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    canonicalQuery = new URLSearchParams(sorted).toString();
  }

  // Hash body: sort keys, compact JSON; always SHA256 (empty string when no body)
  let bodyString: string | undefined;
  let bodyHash: string;
  if (body != null && Object.keys(body as Record<string, unknown>).length > 0) {
    bodyString = JSON.stringify(sortObjectKeys(body));
    bodyHash = createHash("sha256").update(bodyString).digest("hex");
  } else {
    bodyHash = createHash("sha256").update("").digest("hex");
  }

  const payload = [
    timestamp,
    nonce,
    canonicalMethod,
    canonicalPath,
    canonicalQuery,
    bodyHash,
  ].join("\n");

  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return {
    "X-Liquid-Key": key,
    "X-Liquid-Timestamp": timestamp,
    "X-Liquid-Nonce": nonce,
    "X-Liquid-Signature": signature,
    "Content-Type": "application/json",
    ...(bodyString != null && { _body: bodyString }),
  };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  // Split path and query
  const [pathname, queryString] = path.split("?");
  const fullPath = `/v1${pathname}`;
  const signed = signRequest(method, fullPath, queryString ?? "", body);

  // Extract the serialized body (with sorted keys) from the sign step
  const serializedBody = signed._body;
  delete signed._body;

  const url = `${BASE_URL}${pathname}${queryString ? `?${queryString}` : ""}`;
  const res = await fetch(url, {
    method,
    headers: signed,
    body: serializedBody ?? undefined,
  });

  const json = (await res.json()) as {
    success: boolean;
    data: T;
    error?: { code?: string; message?: string };
  };

  if (!res.ok || !json.success) {
    const message =
      json.error?.message || json.error?.code || res.statusText;
    throw new Error(`Liquid API ${res.status}: ${message}`);
  }

  return json.data;
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

export interface Candle {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// ---- Client methods ----

export async function getMarkets(): Promise<Market[]> {
  return request<Market[]>("GET", "/markets");
}

export async function getTicker(symbol: string): Promise<Ticker> {
  return request<Ticker>(
    "GET",
    `/markets/${encodeURIComponent(symbol)}/ticker`,
  );
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

export async function getCandles(
  symbol: string,
  interval: string,
  limit?: number,
  start?: number,
  end?: number,
): Promise<Candle[]> {
  const params = new URLSearchParams({ interval });
  if (limit != null) params.set("limit", limit.toString());
  if (start != null) params.set("start", start.toString());
  if (end != null) params.set("end", end.toString());
  return request<Candle[]>(
    "GET",
    `/markets/${encodeURIComponent(symbol)}/candles?${params.toString()}`,
  );
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
