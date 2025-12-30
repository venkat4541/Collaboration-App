'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Settings } from 'lucide-react'
import { getDashboard } from '@/lib/api/dashboard'
import { getDashboardWidgets } from '@/lib/api/timer'
import { getProfile } from '@/lib/api/profile'
import { TimerWidget } from '@/components/timer/timer-widget'
import { FloatingChat } from '@/components/chat/chat'
import { UserMenu } from '@/components/navigation/user-menu'
import { DashboardSettingsDialog } from '@/components/dashboard/dashboard-settings-dialog'
import { toast } from 'sonner'

export default function DashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [widgets, setWidgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    if (user && params.id) {
      loadDashboardData()
    }
  }, [user, params.id])

  const loadDashboardData = async () => {
    if (!user || !params.id) return

    try {
      // Get dashboard details and profile
      const [dashboardData, profileData] = await Promise.all([
        getDashboard(params.id as string),
        getProfile(user.id)
      ])

      // Check if user is a member
      const isMember = dashboardData.dashboard_members?.some(
        (m: any) => m.user_id === user.id
      ) || dashboardData.owner_id === user.id

      if (!isMember) {
        toast.error('You are not a member of this dashboard')
        router.push('/dashboards')
        return
      }

      setDashboard(dashboardData)
      setProfile(profileData)

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

  if (!dashboard || !user) {
    return null
  }

  const members = dashboard.dashboard_members || []

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">WeCollab</h1>
          <UserMenu user={user!} profile={profile} />
        </div>
      </header>

      {/* Dashboard Info Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboards')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboards</span>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div 
              className="p-1 rounded"
              title={members.map((m: any) => m.profiles?.display_name || 'Unknown').join(', ')}
            >
              <h2 className="text-lg font-semibold">{dashboard.name}</h2>
              <p className="text-xs text-muted-foreground">
                {members.length} / {dashboard.max_users} members
              </p>
            </div>
          </div>
          {dashboard.owner_id === user?.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveTab('general')
                setSettingsOpen(true)
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          )}
        </div>
      </div>

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

      {/* Dashboard Settings Dialog - Only for owners */}
      {dashboard.owner_id === user?.id && (
        <DashboardSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          dashboard={dashboard}
          userId={user!.id}
          onUpdate={loadDashboardData}
          defaultTab={activeTab}
        />
      )}
    </div>
  )
}
