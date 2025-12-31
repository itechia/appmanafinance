
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL is missing. Using placeholder.')
}


if (!supabaseUrl || supabaseUrl === 'https://example.supabase.co') {
    console.error('CRITICAL: Supabase URL is missing or default. Check .env.local')
} else {
    console.log('Supabase Client Initialized with URL:', supabaseUrl)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
