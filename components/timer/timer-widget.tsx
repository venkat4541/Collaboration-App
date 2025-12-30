'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Play, Pause, Square, Trophy, FileText } from 'lucide-react'
import { 
  getTimerState, 
  startTimer, 
  pauseTimer, 
  stopTimer,
  getTodaySession,
  subscribeToTimerStates,
  getAllTimerStates,
  getLeaderboard,
  updateTimerNote,
  getTeamNotes
} from '@/lib/api/timer'
import { formatTime } from '@/lib/utils'
import { toast } from 'sonner'

interface TimerWidgetProps {
  widget: any
  userId: string
  dashboardMembers: any[]
}

export function TimerWidget({ widget, userId, dashboardMembers }: TimerWidgetProps) {
  const [timerState, setTimerState] = useState<any>(null)
  const [displaySeconds, setDisplaySeconds] = useState(0)
  const [todayTotal, setTodayTotal] = useState(0)
  const [todaySession, setTodaySession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [allUserStates, setAllUserStates] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [myNote, setMyNote] = useState('')
  const [teamNotes, setTeamNotes] = useState<any[]>([])
  const [showNotes, setShowNotes] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    loadTimerData()
    
    // Subscribe to real-time updates
    let channel: any
    
    const setupSubscription = async () => {
      channel = await subscribeToTimerStates(widget.id, (payload) => {
        console.log('Timer state changed:', payload)
        loadTimerData()
      })
    }
    
    setupSubscription()

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [widget.id, userId])

  // Update display seconds when timer is running
  useEffect(() => {
    if (timerState?.status === 'running' && timerState.started_at) {
      const interval = setInterval(() => {
        const elapsed = Math.floor(
          (new Date().getTime() - new Date(timerState.started_at).getTime()) / 1000
        )
        setDisplaySeconds(timerState.current_seconds + elapsed)
      }, 1000)

      return () => clearInterval(interval)
    } else if (timerState?.status === 'paused') {
      setDisplaySeconds(timerState.current_seconds)
    } else {
      setDisplaySeconds(0)
    }
  }, [timerState])

  const loadTimerData = async () => {
    try {
      const [state, session, allStates] = await Promise.all([
        getTimerState(widget.id, userId),
        getTodaySession(widget.id, userId),
        getAllTimerStates(widget.id)
      ])

      setTimerState(state)
      setTodaySession(session)
      setTodayTotal(session?.total_seconds || 0)
      setAllUserStates(allStates.filter((s: any) => s.user_id !== userId))
      
      // Load note from today's session
      if (session?.note) {
        setMyNote(session.note)
      }

      if (state?.status === 'running' && state.started_at) {
        const elapsed = Math.floor(
          (new Date().getTime() - new Date(state.started_at).getTime()) / 1000
        )
        setDisplaySeconds(state.current_seconds + elapsed)
      } else if (state?.status === 'paused') {
        setDisplaySeconds(state.current_seconds)
      } else {
        setDisplaySeconds(0)
      }
    } catch (error) {
      console.error('Failed to load timer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLeaderboard = async (period: 'day' | 'week' | 'month') => {
    try {
      const data = await getLeaderboard(widget.id, period)
      setLeaderboard(data)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    }
  }

  const loadTeamNotesData = async () => {
    try {
      const notes = await getTeamNotes(widget.id)
      console.log('All notes from API:', notes)
      const filteredNotes = notes.filter((n: any) => n.user_id !== userId)
      console.log('Filtered team notes:', filteredNotes)
      setTeamNotes(filteredNotes)
    } catch (error) {
      console.error('Failed to load team notes:', error)
    }
  }

  // Load leaderboard when period changes or when showing
  useEffect(() => {
    if (showLeaderboard) {
      loadLeaderboard(leaderboardPeriod)
    }
  }, [showLeaderboard, leaderboardPeriod])

  // Load team notes when showing notes section
  useEffect(() => {
    if (showNotes) {
      loadTeamNotesData()
    }
  }, [showNotes])

  const handleSaveNote = async () => {
    try {
      setSavingNote(true)
      await updateTimerNote(widget.id, userId, myNote)
      toast.success('Note saved')
      loadTeamNotesData() // Refresh team notes
    } catch (error) {
      toast.error('Failed to save note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleStart = async () => {
    try {
      await startTimer(widget.id, userId)
      await loadTimerData() // Reload immediately
      toast.success('Timer started')
    } catch (error: any) {
      toast.error('Failed to start timer')
    }
  }

  const handlePause = async () => {
    try {
      await pauseTimer(widget.id, userId, displaySeconds)
      await loadTimerData() // Reload immediately
      toast.success('Timer paused')
    } catch (error: any) {
      toast.error('Failed to pause timer')
    }
  }

  const handleStop = async () => {
    try {
      // Pass only the current session's seconds, not the total
      await stopTimer(widget.id, userId, displaySeconds)
      await loadTimerData() // Reload immediately
      toast.success('Timer stopped and saved')
    } catch (error: any) {
      toast.error('Failed to stop timer')
    }
  }

  // Helper to calculate elapsed time for other users
  const getElapsedSeconds = (state: any) => {
    if (state.status === 'running' && state.started_at) {
      const elapsed = Math.floor(
        (new Date().getTime() - new Date(state.started_at).getTime()) / 1000
      )
      return (state.current_seconds || 0) + elapsed
    }
    return state.current_seconds || 0
  }

  const isRunning = timerState?.status === 'running'
  const isPaused = timerState?.status === 'paused'
  // Show all teammates with any recorded time (running, paused, or with time > 0)
  const activeOtherUsers = allUserStates.filter(s => 
    s.status === 'running' || s.status === 'paused' || (s.current_seconds || 0) > 0
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{widget.title}</CardTitle>
          <div className="flex items-center gap-2">
            {/* Active users avatars */}
            {activeOtherUsers.length > 0 && (
              <div className="flex -space-x-2 mr-2">
                {activeOtherUsers.slice(0, 3).map((state) => (
                  <Avatar 
                    key={state.user_id} 
                    className={`h-6 w-6 border-2 ${
                      state.status === 'running' ? 'border-green-500' : 'border-yellow-500'
                    }`}
                    title={`${state.profiles?.display_name || 'User'}: ${formatTime(getElapsedSeconds(state))}`}
                  >
                    <AvatarFallback className="text-xs">
                      {state.profiles?.display_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {activeOtherUsers.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                    +{activeOtherUsers.length - 3}
                  </div>
                )}
              </div>
            )}
            {/* Toggle buttons */}
            <Button
              variant={showLeaderboard ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setShowLeaderboard(!showLeaderboard)
                if (showNotes) setShowNotes(false)
              }}
              title="Leaderboard"
            >
              <Trophy className="h-4 w-4" />
            </Button>
            <Button
              variant={showNotes ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setShowNotes(!showNotes)
                if (showLeaderboard) setShowLeaderboard(false)
              }}
              title="Daily Notes"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold tabular-nums">
            {formatTime(displaySeconds)}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>Today: {formatTime(todayTotal + displaySeconds)}</span>
            <span>•</span>
            <span>{todaySession?.session_count || 0} sessions</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 justify-center">
          {!isRunning && !isPaused && (
            <Button onClick={handleStart} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}
          
          {isRunning && (
            <>
              <Button onClick={handlePause} variant="outline" className="flex-1">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button onClick={handleStop} variant="destructive" className="flex-1">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button onClick={handleStart} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
              <Button onClick={handleStop} variant="destructive" className="flex-1">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>

        {/* Your Status Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className={`h-2 w-2 rounded-full ${
            isRunning ? 'bg-green-500 animate-pulse' : 
            isPaused ? 'bg-yellow-500' : 
            'bg-gray-300'
          }`} />
          <span className="text-xs text-muted-foreground">
            {isRunning ? 'Running' : isPaused ? 'Paused' : 'Idle'}
          </span>
        </div>

        {/* Other Users' Timers */}
        {activeOtherUsers.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <p className="text-xs text-muted-foreground mb-2">Team Activity</p>
            <div className="space-y-2">
              {activeOtherUsers.map((state) => (
                <OtherUserTimer key={state.user_id} state={state} />
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Section - shows when toggled from header */}
        {showLeaderboard && (
          <div className="border-t pt-3 mt-3">
            <Tabs value={leaderboardPeriod} onValueChange={(v) => setLeaderboardPeriod(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="day">Today</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
              <TabsContent value={leaderboardPeriod} className="mt-3">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No data yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <div key={entry.user_id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${
                            index === 0 ? 'text-yellow-500' : 
                            index === 1 ? 'text-gray-400' : 
                            index === 2 ? 'text-amber-600' : ''
                          }`}>
                            #{index + 1}
                          </span>
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px]">
                              {entry.profile?.display_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className={entry.user_id === userId ? 'font-semibold' : ''}>
                            {entry.profile?.display_name || 'User'}
                            {entry.user_id === userId && ' (You)'}
                          </span>
                        </div>
                        <span className="font-mono text-muted-foreground">
                          {formatTime(entry.total_seconds)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Notes Section - shows when toggled from header */}
        {showNotes && (
          <div className="border-t pt-3 mt-3 space-y-3">
            {/* My note input */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">What did you work on today?</label>
              <Textarea
                placeholder="e.g., Finished the dashboard UI, worked on authentication...."
                value={myNote}
                onChange={(e) => setMyNote(e.target.value)}
                onBlur={handleSaveNote}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSaveNote()
                  }
                }}
                className="text-sm min-h-[60px] resize-none"
                disabled={savingNote}
              />
            </div>
            
            {/* Team notes */}
            {teamNotes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Team Notes</p>
                {teamNotes.map((note: any) => (
                  <div key={note.user_id} className="text-sm bg-muted/50 rounded p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[8px]">
                          {note.profiles?.display_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-xs">{note.profiles?.display_name || 'User'}</span>
                      <span className="text-xs text-muted-foreground">({formatTime(note.total_seconds)})</span>
                    </div>
                    <p className="text-muted-foreground">{note.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Sub-component for other users' timers (no live updates - just shows recorded state)
function OtherUserTimer({ state }: { state: any }) {
  // Calculate elapsed time once (will refresh when parent reloads data)
  const elapsed = state.status === 'running' && state.started_at
    ? (state.current_seconds || 0) + Math.floor(
        (new Date().getTime() - new Date(state.started_at).getTime()) / 1000
      )
    : state.current_seconds || 0

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${
          state.status === 'running' ? 'bg-green-500 animate-pulse' : 
          state.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-300'
        }`} />
        <span>{state.profiles?.display_name || 'User'}</span>
      </div>
      <span className="font-mono text-muted-foreground">{formatTime(elapsed)}</span>
    </div>
  )
}
