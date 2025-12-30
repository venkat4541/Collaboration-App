'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme-toggle'

interface UserMenuProps {
  user: {
    id: string
    email?: string
  }
  profile?: {
    display_name: string
    avatar_url?: string | null
    theme_mode?: string
    theme_color?: string
  }
}

export const UserMenu = React.memo(function UserMenu({ user, profile }: UserMenuProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const signOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle profile={profile} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-auto py-2">
            <span className="hidden sm:inline text-sm font-medium">
              {displayName}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} disabled={loading}>
            <LogOut className="mr-2 h-4 w-4" />
            {loading ? 'Signing out...' : 'Sign out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

UserMenu.displayName = 'UserMenu'
