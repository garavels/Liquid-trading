import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

// Standard PostgreSQL connection URL
const DB_URL = "postgresql://postgres:bbhacks2026@db.bbexbwybvecmupnkoiso.supabase.co:5432/postgres?pgbouncer=true";

async function setupDatabase() {
  console.log("Connecting directly to PostgreSQL via pg client to create table... URL:", DB_URL.substring(0, 25) + '...');

  const client = new Client({
    connectionString: DB_URL,
  });

  try {
    await client.connect();

    const sql = `
      CREATE TABLE IF NOT EXISTS public.transactions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        action_type TEXT NOT NULL,
        prompt_payload JSONB,
        timestamp TIMESTAMPTZ DEFAULT now() NOT NULL
      );
      
      ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow all" ON public.transactions FOR ALL USING (true);
    `;

    await client.query(sql);
    console.log("✅ Table 'transactions' created successfully.");
  } catch (err) {
    console.error("❌ Failed to create table:", err);
  } finally {
    await client.end();
  }
}

setupDatabase();
