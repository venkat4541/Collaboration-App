// @ts-nocheck
import { createClient } from '@/lib/supabase/client'

export async function getProfile(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateProfile(userId: string, updates: { display_name?: string; avatar_url?: string }) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTimerStats(userId: string) {
  const supabase = createClient()

  // Get all timer sessions for the user
  const { data: sessions, error } = await supabase
    .from('timer_sessions')
    .select(`
      total_seconds,
      date,
      widgets (
        title
      )
    `)
    .eq('user_id', userId)

  if (error) throw error

  // Calculate statistics
  const totalSeconds = sessions?.reduce((sum, s) => sum + s.total_seconds, 0) || 0
  const sessionCount = sessions?.length || 0
  const avgSeconds = sessionCount > 0 ? Math.floor(totalSeconds / sessionCount) : 0

  // Find most used widget
  const widgetCounts: Record<string, number> = {}
  sessions?.forEach(s => {
    const title = s.widgets?.title || 'Unknown'
    widgetCounts[title] = (widgetCounts[title] || 0) + 1
  })
  
  const mostUsedWidget = Object.entries(widgetCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None'

  return {
    totalSeconds,
    sessionCount,
    avgSeconds,
    mostUsedWidget,
    sessions: sessions || []
  }
}

export async function getRecentActivity(userId: string, limit = 10) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('timer_sessions')
    .select(`
      *,
      widgets (
        title,
        dashboards (
          name
        )
      )
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function updateThemePreferences(userId: string, themeMode: string, themeColor: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      theme_mode: themeMode,
      theme_color: themeColor,
    })
    .eq('id', userId)

  if (error) throw error
}
