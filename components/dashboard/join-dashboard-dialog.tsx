'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { joinDashboard } from '@/lib/api/dashboard'
import { useAuth } from '@/components/auth/auth-provider'

interface JoinDashboardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function JoinDashboardDialog({ open, onOpenChange, onSuccess }: JoinDashboardDialogProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleJoin = async () => {
    if (!user) return
    if (!inviteCode.trim() || !otp.trim()) {
      toast.error('Please enter both invite code and OTP')
      return
    }

    setLoading(true)

    try {
      const dashboard = await joinDashboard(inviteCode.toUpperCase(), otp, user.id)
      toast.success(`Joined ${dashboard.name}!`)
      onSuccess?.()
      handleClose()
      router.push(`/dashboard/${dashboard.id}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to join dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setInviteCode('')
    setOtp('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Dashboard</DialogTitle>
          <DialogDescription>
            Enter the invite code and one-time password shared with you
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              placeholder="e.g., ABC12345"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="otp">One-Time Password</Label>
            <Input
              id="otp"
              placeholder="e.g., 123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="font-mono"
              maxLength={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={loading}>
            {loading ? 'Joining...' : 'Join Dashboard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
