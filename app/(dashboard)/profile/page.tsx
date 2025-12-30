'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Edit, Calendar, Mail } from 'lucide-react'
import { getProfile, getTimerStats, getRecentActivity } from '@/lib/api/profile'
import { getUserDashboards } from '@/lib/api/dashboard'
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog'
import { StatsCard } from '@/components/profile/stats-card'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { formatTime } from '@/lib/utils'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [dashboards, setDashboards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadProfileData()
    }
  }, [user])

  const loadProfileData = async () => {
    if (!user) return

    try {
      const [profileData, statsData, activityData, dashboardsData] = await Promise.all([
        getProfile(user.id),
        getTimerStats(user.id),
        getRecentActivity(user.id, 5),
        getUserDashboards(user.id)
      ])

      setProfile(profileData)
      setStats(statsData)
      setRecentActivity(activityData)
      setDashboards(dashboardsData)
    } catch (error: any) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">WeCollab</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboards')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboards</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-8 space-y-8">
        {/* Profile Header */}
        <Card className="py-6">
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">
                  {profile.display_name?.charAt(0) || profile.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        {stats && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Timer Statistics</h2>
            <StatsCard stats={stats} />
          </div>
        )}

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Recent Activity</h2>
          <Card className="py-6">
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No activity yet. Start a timer to see your progress!
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{activity.widgets?.title || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.widgets?.dashboards?.name || 'Unknown Dashboard'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatTime(activity.total_seconds)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Memberships */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Your Dashboards</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboards.map((item) => {
              const dashboard = item.dashboards
              const isOwner = dashboard.owner_id === user.id
              
              return (
                <Card
                  key={dashboard.id}
                  className="py-6 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => router.push(`/dashboard/${dashboard.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{dashboard.name}</CardTitle>
                    <CardDescription>
                      {isOwner ? 'Owner' : 'Member'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {dashboard.dashboard_members?.length || 0} / {dashboard.max_users} members
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>

      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentProfile={profile}
        userId={user.id}
        onSuccess={loadProfileData}
      />
    </div>
  )
}
