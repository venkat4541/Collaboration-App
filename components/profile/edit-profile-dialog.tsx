'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile } from '@/lib/api/profile'
import { toast } from 'sonner'

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentProfile: {
    display_name: string
    avatar_url?: string | null
  }
  userId: string
  onSuccess: () => void
}

export function EditProfileDialog({ 
  open, 
  onOpenChange, 
  currentProfile, 
  userId,
  onSuccess 
}: EditProfileDialogProps) {
  const [displayName, setDisplayName] = useState(currentProfile.display_name)
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatar_url || '')
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
        avatar_url: avatarUrl.trim() || undefined,
      })
      toast.success('Profile updated successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your display name and avatar
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use initials
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
