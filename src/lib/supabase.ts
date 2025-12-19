import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role key (full access)
// Using db_schema option to access catering schema
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'catering'
  }
});

export default supabase;
