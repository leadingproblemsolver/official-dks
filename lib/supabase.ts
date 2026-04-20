import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Check .env variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper for type-safe profiles
export interface Profile {
  id: string;
  email: string;
  usage_count: number;
  last_request_at?: string;
  created_at: string;
}

// Helper for decisions
export interface Decision {
  id: string;
  user_id: string;
  decision_text: string;
  input_type: string;
  verdict: 'Proceed' | 'Pause' | 'Kill';
  confidence: number;
  biggest_risk: string;
  what_breaks_this: string;
  relatable_perspective: string;
  reframe_precise: string;
  reframe_regular: string;
  secondary_nuances: any;
  latency_ms: number;
  created_at: string;
}
