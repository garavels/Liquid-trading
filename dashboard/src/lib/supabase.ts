import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_USER_KEY!; // We'll just use the same anon key

export const supabase = createClient(supabaseUrl, supabaseKey);
