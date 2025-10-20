import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface User {
  user_id: string;
  access_token: string;
  email: string | null;
  name: string | null;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestRun {
  run_id: string;
  user_id: string;
  kg_hash: string;
  metrics_hash: string;
  fgc_reward_tx?: string | null;
  created_at: string;
}

