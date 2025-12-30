'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile } from '@/lib/api/profile'
import { toast } from 'sonner'

interface SetupProfileDialogProps {
  open: boolean
  userId: string
  email: string
  onSuccess: () => void
}

export function SetupProfileDialog({ 
  open, 
  userId,
  email,
  onSuccess 
}: SetupProfileDialogProps) {
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!displayName.trim()) {
      toast.error('Display name is required')
      return
    }

    setLoading(true)
    try {
      await updateProfile(userId, {
        display_name: displayName.trim(),
      })
      toast.success('Profile setup complete!')
      onSuccess()
    } catch (error: any) {
      toast.error('Failed to setup profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to WeCollab! 👋</DialogTitle>
          <DialogDescription>
            Let's set up your profile. What should we call you?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground">
              This is how other users will see you
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Setting up...' : 'Continue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
