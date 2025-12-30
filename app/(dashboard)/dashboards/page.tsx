'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Users, Mail, Check, X, MessageCircle, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CreateDashboardDialog } from '@/components/dashboard/create-dashboard-dialog'
import { JoinDashboardDialog } from '@/components/dashboard/join-dashboard-dialog'
import { DashboardSettingsDialog } from '@/components/dashboard/dashboard-settings-dialog'
import { getUserDashboards, joinDashboard, leaveDashboard } from '@/lib/api/dashboard'
import { getProfile } from '@/lib/api/profile'
import { getInvitesForUser, cancelInvite } from '@/lib/api/invites'
import { UserMenu } from '@/components/navigation/user-menu'
import { SetupProfileDialog } from '@/components/profile/setup-profile-dialog'
import { getLatestMessageForDashboards } from '@/lib/api/chat'
import { toast } from 'sonner'

export default function DashboardsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [dashboards, setDashboards] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [setupDialogOpen, setSetupDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('general')
  const [selectedDashboard, setSelectedDashboard] = useState<any>(null)
  const [unreadDashboards, setUnreadDashboards] = useState<Set<string>>(new Set())

  // Handle redirect in effect, show loading while redirecting
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Wait for auth to complete before loading
    if (authLoading) return
    
    if (user) {
      // Only show loading spinner if we don't have dashboards yet
      loadDashboards(dashboards.length === 0)
      loadInvites()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading])

  const loadDashboards = async (showLoading = true) => {
    if (!user) return
    
    if (showLoading) setLoading(true)
    try {
      const [dashboardsData, profileData] = await Promise.all([
        getUserDashboards(user.id),
        getProfile(user.id)
      ])
      setDashboards(dashboardsData)
      setProfile(profileData)
      
      // Check for unread messages
      const dashboardIds = dashboardsData.map((d: any) => d.dashboards.id)
      if (dashboardIds.length > 0) {
        try {
          const latestMessages = await getLatestMessageForDashboards(dashboardIds)
          const lastVisited = JSON.parse(localStorage.getItem('dashboard_last_visited') || '{}')
          const unread = new Set<string>()
          
          for (const [dashboardId, lastMsgTime] of Object.entries(latestMessages)) {
            const lastVisitedTime = lastVisited[dashboardId]
            if (!lastVisitedTime || new Date(lastMsgTime as string) > new Date(lastVisitedTime)) {
              unread.add(dashboardId)
            }
          }
          setUnreadDashboards(unread)
        } catch (e) {
          console.error('Failed to check unread messages:', e)
        }
      }
      
      // Check if user needs to set up their profile
      if (!profileData.display_name || profileData.display_name === profileData.email) {
        setSetupDialogOpen(true)
      }
    } catch (error: any) {
      console.error('Failed to load dashboards:', error.message || error)
      toast.error('Failed to load dashboards')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const loadInvites = async () => {
    if (!user?.email) return
    try {
      const userInvites = await getInvitesForUser(user.email)
      setInvites(userInvites)
    } catch (error: any) {
      console.error('Failed to load invites:', error.message || error)
    }
  }

  const handleAcceptInvite = async (invite: any) => {
    if (!user) return
    try {
      setLoading(true)
      await joinDashboard(invite.dashboards.invite_code, invite.dashboards.one_time_password, user.id)
      await cancelInvite(invite.id) // Using delete as accept for now
      toast.success(`Joined ${invite.dashboards.name}!`)
      loadDashboards(false) // Background refresh
      loadInvites()
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept invite')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectInvite = async (inviteId: string) => {
    try {
      await cancelInvite(inviteId)
      toast.success('Invite rejected')
      loadInvites()
    } catch (error) {
      toast.error('Failed to reject invite')
    }
  }

  const handleDashboardCreated = () => {
    loadDashboards(false) // Background refresh
  }

  const handleDashboardJoined = () => {
    loadDashboards(false) // Background refresh
  }

  const handleLeaveDashboard = async (e: React.MouseEvent, dashboardId: string, dashboardName: string) => {
    e.stopPropagation()
    if (!user) return
    
    if (!confirm(`Are you sure you want to leave "${dashboardName}"? You will need to be re-invited to rejoin.`)) {
      return
    }
    
    try {
      await leaveDashboard(dashboardId, user.id)
      toast.success(`Left ${dashboardName}`)
      loadDashboards(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave dashboard')
    }
  }

  // Show loading while auth is loading or while redirecting
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  // If no user after auth completes, the useEffect will redirect
  // Return null while waiting for redirect
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Redirecting...</p>
      </div>
    )
  }

  // Show loading while fetching dashboards
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading dashboards...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">WeCollab</h1>
          <UserMenu user={user} profile={profile} />
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-8">
        {/* Pending Invites Section */}
        {invites.length > 0 && (
          <div className="mb-10 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Pending Invitations ({invites.length})
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {invites.map((invite) => (
                <Card key={invite.id} className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{invite.dashboards.name}</CardTitle>
                    <CardDescription>You've been invited to join this dashboard</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleAcceptInvite(invite)}
                        disabled={loading}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleRejectInvite(invite.id)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Your Dashboards</h2>
            <p className="text-muted-foreground">
              Create and manage your collaboration dashboards
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Join Dashboard
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Dashboard
            </Button>
          </div>
        </div>

        {dashboards.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>No dashboards yet</CardTitle>
              <CardDescription>
                Create your first dashboard to start collaborating
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button onClick={() => setCreateDialogOpen(true)} className="flex-1">
                <Plus className="mr-2 h-4 w-4" />
                Create Dashboard
              </Button>
              <Button variant="outline" onClick={() => setJoinDialogOpen(true)} className="flex-1">
                <Users className="mr-2 h-4 w-4" />
                Join Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dashboards.map((item) => {
              const dashboard = item.dashboards
              const memberCount = dashboard.dashboard_members?.length || 0
              const isOwner = dashboard.owner_id === user.id

              return (
                <Card
                  key={dashboard.id}
                  className="py-6 cursor-pointer hover:border-primary transition-colors relative"
                  onClick={() => {
                    // Update last visited time
                    const lastVisited = JSON.parse(localStorage.getItem('dashboard_last_visited') || '{}')
                    lastVisited[dashboard.id] = new Date().toISOString()
                    localStorage.setItem('dashboard_last_visited', JSON.stringify(lastVisited))
                    // Remove from unread set
                    setUnreadDashboards(prev => {
                      const next = new Set(prev)
                      next.delete(dashboard.id)
                      return next
                    })
                    router.push(`/dashboard/${dashboard.id}`)
                  }}
                >
                  {/* Unread message indicator */}
                  {unreadDashboards.has(dashboard.id) && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 text-primary animate-pulse">
                      <MessageCircle className="h-4 w-4 fill-primary" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle 
                          className="line-clamp-1"
                          title={dashboard.dashboard_members?.map((m: any) => m.profiles?.display_name || 'Unknown').join(', ')}
                        >
                          {dashboard.name}
                        </CardTitle>
                        <CardDescription>
                          {isOwner ? 'Owner' : 'Member'}
                        </CardDescription>
                      </div>
                      {isOwner && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Owner
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {memberCount} / {dashboard.max_users} members
                      </span>
                    </div>
                    <div className="flex -space-x-2">
                      {dashboard.dashboard_members?.slice(0, 4).map((member: any) => (
                        <Avatar 
                          key={member.user_id} 
                          className="border-2 border-background w-8 h-8"
                        >
                          <AvatarFallback className="text-[10px]">
                            {member.profiles?.display_name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {memberCount > 4 && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background text-[10px]">
                          +{memberCount - 4}
                        </div>
                      )}
                    </div>
                    {/* Leave button for non-owners */}
                    {!isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 w-full text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleLeaveDashboard(e, dashboard.id, dashboard.name)}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Dashboard
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <CreateDashboardDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleDashboardCreated}
      />
      <JoinDashboardDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
        onSuccess={handleDashboardJoined}
      />
      <SetupProfileDialog
        open={setupDialogOpen}
        userId={user!.id}
        email={user!.email!}
        onSuccess={() => setSetupDialogOpen(false)}
      />
      {selectedDashboard && (
        <DashboardSettingsDialog
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
          dashboard={selectedDashboard}
          userId={user!.id}
          onUpdate={() => loadDashboards(false)}
          defaultTab={settingsTab}
        />
      )}
    </div>
  )
}
