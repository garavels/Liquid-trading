import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const actionTypes = [
  "get_markets",
  "get_ticker",
  "get_orderbook",
  "get_candles",
  "place_order",
  "cancel_order",
  "get_account_summary",
  "get_positions"
];

const symbols = ["BTC-PERP", "ETH-PERP", "SOL-PERP", "DOGE-PERP"];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomAction() {
  const rand = Math.random();
  if (rand < 0.6) return "place_order"; // 60% chance of placing order
  if (rand < 0.75) return "get_ticker";
  if (rand < 0.85) return "get_markets";
  if (rand < 0.9) return "get_candles";
  if (rand < 0.95) return "get_account_summary";
  return "get_positions";
}

function generatePayload(action: string) {
  const symbol = symbols[getRandomInt(0, symbols.length - 1)];
  switch (action) {
    case "get_ticker":
    case "get_orderbook":
      return { symbol };
    case "get_candles":
      return { symbol, interval: "1h", limit: getRandomInt(20, 100) };
    case "place_order":
      // mostly buy
      const side = Math.random() < 0.8 ? "buy" : "sell";
      return { 
        symbol, 
        side, 
        size: getRandomInt(1, 100), 
        price: side === "buy" ? getRandomInt(50000, 65000) : undefined 
      };
    case "cancel_order":
      return { order_id: `ord_${getRandomInt(1000, 9999)}` };
    default:
      return {};
  }
}

async function seedData() {
  console.log("Emptying existing transactions...");
  await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
  
  console.log("Seeding database with exactly 160 realistic mock transactions for TODAY...");
  const transactions = [];
  const now = Date.now();
  
  // Generate 160 mock transactions
  for (let i = 0; i < 160; i++) {
    const action = getRandomAction();
    const payload = generatePayload(action);
    
    // Spread evenly across today (last 24 hours)
    const timestampOffset = getRandomInt(0, 24 * 60 * 60 * 1000);
    const timestamp = new Date(now - timestampOffset).toISOString();
    
    transactions.push({
      action_type: action,
      prompt_payload: payload,
      timestamp: timestamp
    });
  }

  // insert in chunks
  const chunkSize = 160;
  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize);
    const { error } = await supabase.from('transactions').insert(chunk);
    if (error) {
      console.error("Error seeding chunk:", error);
    }
  }
  
  console.log(`Successfully seeded ${transactions.length} transactions for today!`);
}

seedData();
