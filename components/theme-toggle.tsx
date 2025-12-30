'use client'

import * as React from 'react'
import { Moon, Sun, Palette } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/components/auth/auth-provider'
import { updateThemePreferences } from '@/lib/api/profile'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const themes = [
  { name: 'Zinc', value: 'theme-zinc', color: 'bg-zinc-500' },
  { name: 'Slate', value: 'theme-slate', color: 'bg-slate-500' },
  { name: 'Stone', value: 'theme-stone', color: 'bg-stone-500' },
  { name: 'Gray', value: 'theme-gray', color: 'bg-gray-500' },
  { name: 'Neutral', value: 'theme-neutral', color: 'bg-neutral-500' },
  { name: 'Red', value: 'theme-red', color: 'bg-red-500' },
  { name: 'Rose', value: 'theme-rose', color: 'bg-rose-500' },
  { name: 'Orange', value: 'theme-orange', color: 'bg-orange-500' },
  { name: 'Green', value: 'theme-green', color: 'bg-green-500' },
  { name: 'Blue', value: 'theme-blue', color: 'bg-blue-500' },
  { name: 'Yellow', value: 'theme-yellow', color: 'bg-yellow-500' },
  { name: 'Violet', value: 'theme-violet', color: 'bg-violet-500' },
]

interface ThemeToggleProps {
  profile?: {
    theme_mode?: string
    theme_color?: string
  }
}

export function ThemeToggle({ profile }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const [colorTheme, setColorTheme] = React.useState(profile?.theme_color || 'theme-zinc')

  React.useEffect(() => {
    // Apply saved theme from profile or localStorage
    const savedColor = profile?.theme_color || localStorage.getItem('color-theme') || 'theme-zinc'
    const savedMode = profile?.theme_mode || localStorage.getItem('theme-mode')
    
    applyColorTheme(savedColor, false)
    if (savedMode && savedMode !== theme) {
      setTheme(savedMode)
    }
  }, [profile])

  const applyColorTheme = async (themeValue: string, saveToDb = true) => {
    // Remove all theme classes
    themes.forEach(t => {
      document.documentElement.classList.remove(t.value)
    })
    // Add new theme class
    document.documentElement.classList.add(themeValue)
    setColorTheme(themeValue)
    localStorage.setItem('color-theme', themeValue)

    // Save to database if user is logged in
    if (saveToDb && user) {
      try {
        await updateThemePreferences(user.id, theme || 'system', themeValue)
      } catch (error) {
        console.error('Failed to save theme preference:', error)
      }
    }
  }

  const toggleThemeMode = async () => {
    const newMode = theme === 'dark' ? 'light' : 'dark'
    setTheme(newMode)
    localStorage.setItem('theme-mode', newMode)

    // Save to database if user is logged in
    if (user) {
      try {
        await updateThemePreferences(user.id, newMode, colorTheme)
      } catch (error) {
        console.error('Failed to save theme preference:', error)
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Customize theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Theme</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.preventDefault()
              toggleThemeMode()
            }}
          >
            <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="grid grid-cols-2 gap-1 p-1">
          {themes.map((t) => (
            <DropdownMenuItem
              key={t.value}
              onClick={() => applyColorTheme(t.value)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className={`h-4 w-4 rounded-full ${t.color}`} />
              <span className="text-sm">{t.name}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
