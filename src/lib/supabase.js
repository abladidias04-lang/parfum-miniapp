import { createClient } from '@supabase/supabase-js'

// Негізгі сайтпен БІР БАЗА — парфюмдер автомат синхрондалады
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
