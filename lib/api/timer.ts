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

  // First, pause any other running timers for this user
  const { data: runningTimers } = await supabase
    .from('timer_states')
    .select('widget_id, current_seconds, started_at')
    .eq('user_id', userId)
    .eq('status', 'running')
    .neq('widget_id', widgetId)

  // Pause each running timer with calculated elapsed time
  for (const timer of runningTimers || []) {
    const elapsed = timer.started_at 
      ? Math.floor((new Date().getTime() - new Date(timer.started_at).getTime()) / 1000)
      : 0
    
    await supabase
      .from('timer_states')
      .update({
        status: 'paused',
        current_seconds: (timer.current_seconds || 0) + elapsed,
        last_updated: new Date().toISOString(),
      })
      .eq('widget_id', timer.widget_id)
      .eq('user_id', userId)
  }

  // Now start the requested timer
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

// Get all timer states for a widget (all users)
export async function getAllTimerStates(widgetId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('timer_states')
    .select(`
      *,
      profiles (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('widget_id', widgetId)

  if (error) throw error
  return data || []
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

  // Get existing session to increment count
  const { data: existingSession } = await supabase
    .from('timer_sessions')
    .select('total_seconds, session_count')
    .eq('widget_id', widgetId)
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  // Save to timer_sessions
  const { error: sessionError } = await supabase
    .from('timer_sessions')
    .upsert({
      widget_id: widgetId,
      user_id: userId,
      date: today,
      total_seconds: existingSession ? existingSession.total_seconds + totalSeconds : totalSeconds,
      session_count: existingSession ? existingSession.session_count + 1 : 1,
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

// Get leaderboard data for a widget
export async function getLeaderboard(widgetId: string, period: 'day' | 'week' | 'month') {
  const supabase = createClient()
  
  const now = new Date()
  let startDate: string

  if (period === 'day') {
    startDate = now.toISOString().split('T')[0]
  } else if (period === 'week') {
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    startDate = weekAgo.toISOString().split('T')[0]
  } else {
    const monthAgo = new Date(now)
    monthAgo.setDate(monthAgo.getDate() - 30)
    startDate = monthAgo.toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('timer_sessions')
    .select(`
      user_id,
      total_seconds,
      date,
      profiles (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('widget_id', widgetId)
    .gte('date', startDate)

  if (error) throw error

  // Aggregate by user
  const userTotals: Record<string, { user_id: string, total_seconds: number, profile: any }> = {}
  
  for (const session of data || []) {
    if (!userTotals[session.user_id]) {
      userTotals[session.user_id] = {
        user_id: session.user_id,
        total_seconds: 0,
        profile: session.profiles
      }
    }
    userTotals[session.user_id].total_seconds += session.total_seconds
  }

  // Sort by total seconds descending
  return Object.values(userTotals).sort((a, b) => b.total_seconds - a.total_seconds)
}

// Update daily note for a timer session
export async function updateTimerNote(widgetId: string, userId: string, note: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('timer_sessions')
    .upsert({
      widget_id: widgetId,
      user_id: userId,
      date: today,
      note: note,
      total_seconds: 0,  // Will be updated when timer stops
      session_count: 0,
    }, {
      onConflict: 'widget_id,user_id,date'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Get all team notes for today for a widget
export async function getTeamNotes(widgetId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('timer_sessions')
    .select(`
      user_id,
      note,
      total_seconds,
      profiles (
        id,
        display_name
      )
    `)
    .eq('widget_id', widgetId)
    .eq('date', today)

  if (error) throw error
  
  // Filter out null and empty notes
  return (data || []).filter((item: any) => item.note && item.note.trim().length > 0)
}
