'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Users } from 'lucide-react'
import { getUserDashboards } from '@/lib/api/dashboard'
import { getDashboardWidgets } from '@/lib/api/timer'
import { TimerWidget } from '@/components/timer/timer-widget'
import { FloatingChat } from '@/components/chat/chat'
import { toast } from 'sonner'

export default function DashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<any>(null)
  const [widgets, setWidgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && params.id) {
      loadDashboard()
    }
  }, [user, params.id])

  const loadDashboard = async () => {
    if (!user || !params.id) return

    try {
      // Get user's dashboards to find this one
      const dashboards = await getUserDashboards(user.id)
      const currentDashboard = dashboards.find(
        (d: any) => d.dashboards.id === params.id
      )

      if (!currentDashboard) {
        toast.error('Dashboard not found')
        router.push('/dashboards')
        return
      }

      setDashboard(currentDashboard.dashboards)

      // Get widgets for this dashboard
      const widgetsData = await getDashboardWidgets(params.id as string)
      setWidgets(widgetsData)
    } catch (error: any) {
      toast.error('Failed to load dashboard')
      router.push('/dashboards')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!dashboard) {
    return null
  }

  const members = dashboard.dashboard_members || []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboards')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">{dashboard.name}</h1>
              <p className="text-xs text-muted-foreground">
                {members.length} / {dashboard.max_users} members
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {members.length} online
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          {widgets.map((widget) => (
            <TimerWidget
              key={widget.id}
              widget={widget}
              userId={user!.id}
              dashboardMembers={members}
            />
          ))}
        </div>

        {widgets.length === 0 && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>No widgets yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Widgets will appear here automatically
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Floating Chat Widget */}
      <FloatingChat
        dashboardId={params.id as string}
        userId={user!.id}
        userName={user!.email || 'User'}
      />
    </div>
  )
}
