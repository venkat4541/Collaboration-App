'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Users, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CreateDashboardDialog } from '@/components/dashboard/create-dashboard-dialog'
import { JoinDashboardDialog } from '@/components/dashboard/join-dashboard-dialog'
import { getUserDashboards } from '@/lib/api/dashboard'
import { toast } from 'sonner'

export default function DashboardsPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [dashboards, setDashboards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadDashboards()
    }
  }, [user, refreshKey])

  const loadDashboards = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const data = await getUserDashboards(user.id)
      setDashboards(data)
    } catch (error: any) {
      toast.error('Failed to load dashboards')
    } finally {
      setLoading(false)
    }
  }

  const handleDashboardChange = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">WeCollab</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </p>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-8">
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
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => router.push(`/dashboard/${dashboard.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-1">{dashboard.name}</CardTitle>
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
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {memberCount} / {dashboard.max_users} members
                      </span>
                    </div>
                    <div className="flex -space-x-2 mt-3">
                      {dashboard.dashboard_members?.slice(0, 4).map((member: any) => (
                        <Avatar key={member.user_id} className="border-2 border-background h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {member.profiles?.display_name?.charAt(0) || member.profiles?.email?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
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
        onSuccess={handleDashboardChange}
      />

      <JoinDashboardDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
        onSuccess={handleDashboardChange}
      />
    </div>
  )
}
