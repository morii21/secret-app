import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase public keys!");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client
let supabaseServiceClient;
if (typeof window === "undefined") {
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceRoleKey) {
        console.error("Missing Supabase service role key!");
    } else {
        supabaseServiceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
}

export { supabase, supabaseServiceClient };