import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zvvylehmgfrggpghrskd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7XDCbfzYmyRIJfUQhIVWnw_EH7LfMqn';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
