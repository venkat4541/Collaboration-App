'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Play, Pause, Square } from 'lucide-react'
import { 
  getTimerState, 
  startTimer, 
  pauseTimer, 
  stopTimer,
  getTodaySession,
  subscribeToTimerStates 
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
  const [loading, setLoading] = useState(true)
  const [activeUsers, setActiveUsers] = useState<any[]>([])

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
      const [state, session] = await Promise.all([
        getTimerState(widget.id, userId),
        getTodaySession(widget.id, userId)
      ])

      setTimerState(state)
      setTodayTotal(session?.total_seconds || 0)
    } catch (error) {
      console.error('Failed to load timer data:', error)
    } finally {
      setLoading(false)
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
      const totalSeconds = todayTotal + displaySeconds
      await stopTimer(widget.id, userId, totalSeconds)
      await loadTimerData() // Reload immediately
      toast.success('Timer stopped and saved')
    } catch (error: any) {
      toast.error('Failed to stop timer')
    }
  }

  const isRunning = timerState?.status === 'running'
  const isPaused = timerState?.status === 'paused'

  return (
    <Card className="py-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{widget.title}</CardTitle>
          <div className="flex -space-x-2">
            {activeUsers.slice(0, 3).map((user) => (
              <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="text-xs">
                  {user.display_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold tabular-nums">
            {formatTime(displaySeconds)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Today's total: {formatTime(todayTotal + displaySeconds)}
          </p>
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

        {/* Status Indicator */}
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
      </CardContent>
    </Card>
  )
}
