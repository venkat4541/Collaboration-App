// @ts-nocheck
import { createClient } from '@/lib/supabase/client'

export async function getChatMessages(dashboardId: string, limit = 50) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      profiles (
        display_name,
        email,
        avatar_url
      )
    `)
    .eq('dashboard_id', dashboardId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data
}

export async function sendMessage(dashboardId: string, userId: string, message: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      dashboard_id: dashboardId,
      user_id: userId,
      message: message.trim(),
    })
    .select(`
      *,
      profiles (
        display_name,
        email,
        avatar_url
      )
    `)
    .single()

  if (error) throw error
  return data
}

export async function subscribeToChatMessages(dashboardId: string, callback: (payload: any) => void) {
  const supabase = createClient()

  const channel = supabase
    .channel(`chat:${dashboardId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `dashboard_id=eq.${dashboardId}`,
      },
      callback
    )
    .subscribe()

  return channel
}

export async function getLatestMessageForDashboards(dashboardIds: string[]) {
  if (!dashboardIds.length) return {}
  
  const supabase = createClient()
  
  // Get the latest message for each dashboard
  const { data, error } = await supabase
    .from('chat_messages')
    .select('dashboard_id, created_at')
    .in('dashboard_id', dashboardIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  
  // Group by dashboard_id and get the latest
  const latestByDashboard: Record<string, string> = {}
  for (const msg of data || []) {
    if (!latestByDashboard[msg.dashboard_id]) {
      latestByDashboard[msg.dashboard_id] = msg.created_at
    }
  }
  
  return latestByDashboard
}
