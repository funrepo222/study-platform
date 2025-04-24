// lib/supabaseClient.ts
'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient

export function getSupabase() {
  if (!supabase) {
    supabase = createClientComponentClient()
  }
  return supabase
}
