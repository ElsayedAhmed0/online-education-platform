import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  envFile.split('\n').filter(line => line && !line.startsWith('#')).map(line => line.split('='))
);

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data: cols, error: err2 } = await supabase.from('reviews').select('*').limit(1);
  console.log("Columns from select:", cols && cols.length ? Object.keys(cols[0]) : "No rows, error:", err2, "cols:", cols);
}

checkSchema();
