'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createDashboard } from '@/lib/api/dashboard'
import { useAuth } from '@/components/auth/auth-provider'
import { Copy, Check } from 'lucide-react'

interface CreateDashboardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateDashboardDialog({ open, onOpenChange, onSuccess }: CreateDashboardDialogProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteInfo, setInviteInfo] = useState<{ code: string; otp: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleCreate = async () => {
    if (!user) return
    if (!name.trim()) {
      toast.error('Please enter a dashboard name')
      return
    }

    setLoading(true)

    try {
      const { dashboard, inviteCode, otp } = await createDashboard(name, user.id)
      setInviteInfo({ code: inviteCode, otp })
      toast.success('Dashboard created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (inviteInfo) {
      // Only navigate if dashboard was created
      onSuccess?.()
    }
    setName('')
    setInviteInfo(null)
    setCopied(false)
    onOpenChange(false)
  }

  const copyInviteInfo = () => {
    if (!inviteInfo) return
    const text = `Join my WeCollab dashboard!\n\nInvite Code: ${inviteInfo.code}\nOne-Time Password: ${inviteInfo.otp}\n\nGo to ${window.location.origin}/dashboards and click "Join Dashboard"`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Invite info copied to clipboard!')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {!inviteInfo ? (
          <>
            <DialogHeader>
              <DialogTitle>Create Dashboard</DialogTitle>
              <DialogDescription>
                Create a new collaboration dashboard for interview prep
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Dashboard Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., FAANG Interview Prep"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? 'Creating...' : 'Create Dashboard'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Dashboard Created! 🎉</DialogTitle>
              <DialogDescription>
                Share this information with your team to let them join
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Invite Code</Label>
                  <p className="text-lg font-mono font-bold">{inviteInfo.code}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">One-Time Password</Label>
                  <p className="text-lg font-mono font-bold">{inviteInfo.otp}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={copyInviteInfo}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Invite Info
                  </>
                )}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
