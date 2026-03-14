/**
 * Seed script: adds the user_prompt column (if missing) and inserts
 * sample transactions with realistic prompts so the dashboard has data.
 *
 * Run: npx tsx scripts/seed-prompts.ts
 */
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const SEED_DATA = [
  {
    action_type: "get_ticker",
    prompt_payload: { symbol: "BTC-PERP" },
    user_prompt: "What's the current BTC price?",
  },
  {
    action_type: "get_ticker",
    prompt_payload: { symbol: "ETH-PERP" },
    user_prompt: "Show me the ETH price and funding rate",
  },
  {
    action_type: "get_markets",
    prompt_payload: {},
    user_prompt: "What markets can I trade on Hyperliquid?",
  },
  {
    action_type: "get_candles",
    prompt_payload: { symbol: "BTC-PERP", interval: "1h", limit: 100 },
    user_prompt: "Show me the 1h BTC chart for the last 100 candles",
  },
  {
    action_type: "get_orderbook",
    prompt_payload: { symbol: "SOL-PERP", depth: 20 },
    user_prompt: "Let me see the SOL order book",
  },
  {
    action_type: "get_account",
    prompt_payload: {},
    user_prompt: "How much equity do I have in my account?",
  },
  {
    action_type: "get_positions",
    prompt_payload: {},
    user_prompt: "Show me my open positions",
  },
  {
    action_type: "place_order",
    prompt_payload: { symbol: "ETH-PERP", side: "buy", size: 500, type: "market", leverage: 5, confirmed: false },
    user_prompt: "Buy $500 of ETH with 5x leverage",
  },
  {
    action_type: "get_ticker",
    prompt_payload: { symbol: "SOL-PERP" },
    user_prompt: "What is SOL trading at right now?",
  },
  {
    action_type: "get_candles",
    prompt_payload: { symbol: "ETH-PERP", interval: "4h", limit: 50 },
    user_prompt: "Show me a 4 hour ETH chart",
  },
  {
    action_type: "trading_terminal",
    prompt_payload: {},
    user_prompt: "Open the trading terminal so I can browse markets",
  },
  {
    action_type: "get_ticker",
    prompt_payload: { symbol: "BTC-PERP" },
    user_prompt: "Quick check on Bitcoin",
  },
];

async function main() {
  console.log("🌱 Seeding Supabase with sample prompt data...\n");

  // Step 1: Try to add the user_prompt column via a raw RPC call.
  // If the Supabase project has the `exec_sql` function we use it;
  // otherwise we attempt the insert directly (the column must already exist).
  try {
    const { error: rpcError } = await supabase.rpc("exec_sql", {
      query: "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_prompt TEXT;",
    });
    if (rpcError) {
      console.log("⚠️  Could not auto-add column via RPC (this is expected if exec_sql isn't set up).");
      console.log("   Make sure the column exists:  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_prompt TEXT;\n");
    } else {
      console.log("✅ user_prompt column ensured via RPC.\n");
    }
  } catch {
    console.log("⚠️  RPC not available — assuming column already exists.\n");
  }

  // Step 2: Insert seed rows
  const { data, error } = await supabase
    .from("transactions")
    .insert(SEED_DATA)
    .select();

  if (error) {
    console.error("❌ Insert failed:", error.message);
    if (error.message.includes("user_prompt")) {
      console.log("\n💡 The user_prompt column doesn't exist yet. Run this in your Supabase SQL editor:");
      console.log("   ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_prompt TEXT;");
    }
    process.exit(1);
  }

  console.log(`✅ Inserted ${data.length} sample transactions with prompts!`);
  console.log("\n📊 Refresh your dashboard at http://localhost:3001 to see them.");
}

main();
