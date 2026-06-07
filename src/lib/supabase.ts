/**
 * 即影 - Supabase 客户端配置
 * 支持未配置时的优雅降级（MVP阶段可先不连Supabase）
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const isConfigured = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')

export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as unknown as SupabaseClient

export const isSupabaseConfigured = isConfigured

// 服务端专用（使用service_role_key，跳过RLS）
export function createServerClient() {
  if (!isConfigured) return null
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
