'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Trash2, Users, Send, X, Shield } from 'lucide-react'
import { updateDashboardName, deleteDashboard, removeMember } from '@/lib/api/dashboard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { sendEmailInvite, getPendingInvites, cancelInvite } from '@/lib/api/invites'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DashboardSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dashboard: {
    id: string
    name: string
    invite_code: string
    one_time_password: string
    owner_id: string
    dashboard_members?: any[]
  }
  userId: string
  onUpdate: () => void
  defaultTab?: string
}

export function DashboardSettingsDialog({ 
  open, 
  onOpenChange, 
  dashboard,
  userId,
  onUpdate,
  defaultTab = 'general'
}: DashboardSettingsDialogProps) {
  const router = useRouter()
  const [name, setName] = useState(dashboard?.name || '')
  const [loading, setLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const isOwner = dashboard?.owner_id === userId

  useEffect(() => {
    if (dashboard?.name) {
      setName(dashboard.name)
    }
  }, [dashboard?.id, dashboard?.name])

  useEffect(() => {
    if (open && dashboard?.id) {
      loadInvites()
    }
  }, [open, dashboard?.id])

  const loadInvites = async () => {
    try {
      const invites = await getPendingInvites(dashboard.id)
      setPendingInvites(invites)
    } catch (error) {
      console.error('Failed to load invites:', error)
    }
  }

  const handleRename = async () => {
    if (!name.trim()) {
      toast.error('Dashboard name is required')
      return
    }

    setLoading(true)
    try {
      await updateDashboardName(dashboard.id, name.trim(), userId)
      toast.success('Dashboard renamed successfully')
      onUpdate()
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Failed to rename dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    setSendingInvite(true)
    try {
      await sendEmailInvite(dashboard.id, inviteEmail, userId)
      toast.success(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
      loadInvites()
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invite')
    } finally {
      setSendingInvite(false)
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInvite(inviteId)
      toast.success('Invite cancelled')
      loadInvites()
    } catch (error) {
      toast.error('Failed to cancel invite')
    }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== dashboard.name) {
      toast.error('Please type the dashboard name to confirm')
      return
    }

    setLoading(true)
    try {
      await deleteDashboard(dashboard.id, userId)
      toast.success('Dashboard deleted successfully')
      onOpenChange(false)
      router.push('/dashboards')
    } catch (error: any) {
      toast.error('Failed to delete dashboard')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogDescription>
            Manage your dashboard settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full min-h-[400px]">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="invite">Invite</TabsTrigger>
            {isOwner && <TabsTrigger value="danger">Danger</TabsTrigger>}
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-2 pt-2">
              <Label htmlFor="dashboardName">Dashboard Name</Label>
              <Input
                id="dashboardName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dashboard name"
                disabled={!isOwner}
              />
              {!isOwner && (
                <p className="text-xs text-muted-foreground">
                  Only the owner can rename the dashboard
                </p>
              )}
            </div>
            {isOwner && (
              <Button onClick={handleRename} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <ScrollArea className="h-[300px] pr-4 pt-2">
              <div className="space-y-4">
                {dashboard?.dashboard_members?.map((member: any) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profiles?.avatar_url} />
                        <AvatarFallback>
                          {member.profiles?.display_name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {member.profiles?.display_name || 'Unknown User'}
                          {member.user_id === userId && ' (You)'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.role === 'owner' ? 'Owner' : 'Member'}
                        </p>
                      </div>
                    </div>

                    {member.role === 'owner' ? (
                      <Badge variant="secondary" className="gap-1 h-6">
                        <Shield className="h-3 w-3" />
                        Owner
                      </Badge>
                    ) : (
                      isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                          onClick={async () => {
                            if (confirm(`Remove ${member.profiles?.display_name || 'this user'}?`)) {
                              await removeMember(dashboard.id, member.user_id)
                              toast.success('Member removed')
                              onUpdate()
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="invite" className="space-y-6">
            <div className="space-y-4 pt-2">
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Invite via Email</Label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      onClick={handleSendInvite} 
                      disabled={sendingInvite || !inviteEmail.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                  </div>
                </div>

                {pendingInvites.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Pending Invites</Label>
                    <div className="border rounded-md divide-y overflow-hidden">
                      {pendingInvites.map((invite) => (
                        <div key={invite.id} className="flex items-center justify-between p-2 text-sm bg-muted/30">
                          <span className="truncate">{invite.email}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleCancelInvite(invite.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <Label>Manual Invite Codes</Label>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Invite Code</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={dashboard.invite_code}
                        readOnly
                        className="font-mono h-9"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => copyToClipboard(dashboard.invite_code, 'Invite code')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">One-Time Password</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={dashboard.one_time_password}
                        readOnly
                        className="font-mono h-9"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => copyToClipboard(dashboard.one_time_password, 'OTP')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg flex gap-3 items-start">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-medium">Direct Sharing</p>
                  <p className="text-muted-foreground mt-1">
                    You can also share the invite code and OTP directly with your team.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {isOwner && (
            <TabsContent value="danger" className="space-y-4">
              <div className="space-y-4 pt-2">
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                  <div className="flex gap-2 items-start">
                    <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-destructive">Delete Dashboard</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This action cannot be undone. All widgets, timers, and chat history will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deleteConfirm">
                    Type <span className="font-mono font-bold">{dashboard.name}</span> to confirm
                  </Label>
                  <Input
                    id="deleteConfirm"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="Dashboard name"
                  />
                </div>

                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading || deleteConfirm !== dashboard.name}
                  className="w-full"
                >
                  {loading ? 'Deleting...' : 'Delete Dashboard'}
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
