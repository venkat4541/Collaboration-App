// @ts-nocheck - Temporary until we add proper types for timer operations
import { createClient } from '@/lib/supabase/client'

export async function getDashboardWidgets(dashboardId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('dashboard_id', dashboardId)
    .order('position')

  if (error) throw error
  return data
}

export async function getTimerState(widgetId: string, userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('timer_states')
    .select('*')
    .eq('widget_id', widgetId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
  return data
}

export async function startTimer(widgetId: string, userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('timer_states')
    .upsert({
      widget_id: widgetId,
      user_id: userId,
      status: 'running',
      started_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    }, {
      onConflict: 'widget_id,user_id'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function pauseTimer(widgetId: string, userId: string, currentSeconds: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('timer_states')
    .update({
      status: 'paused',
      current_seconds: currentSeconds,
      last_updated: new Date().toISOString(),
    })
    .eq('widget_id', widgetId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function stopTimer(widgetId: string, userId: string, totalSeconds: number, note?: string) {
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  // Save to timer_sessions
  const { error: sessionError } = await supabase
    .from('timer_sessions')
    .upsert({
      widget_id: widgetId,
      user_id: userId,
      date: today,
      total_seconds: totalSeconds,
      note: note || null,
    }, {
      onConflict: 'widget_id,user_id,date'
    })

  if (sessionError) throw sessionError

  // Reset timer state
  const { data, error } = await supabase
    .from('timer_states')
    .update({
      status: 'idle',
      current_seconds: 0,
      started_at: null,
      last_updated: new Date().toISOString(),
    })
    .eq('widget_id', widgetId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTodaySession(widgetId: string, userId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('widget_id', widgetId)
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function subscribeToTimerStates(widgetId: string, callback: (payload: any) => void) {
  const supabase = createClient()

  const channel = supabase
    .channel(`timer_states:${widgetId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'timer_states',
        filter: `widget_id=eq.${widgetId}`,
      },
      callback
    )
    .subscribe()

  return channel
}
