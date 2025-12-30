'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, TrendingUp, Target, Award } from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface StatsCardProps {
  stats: {
    totalSeconds: number
    sessionCount: number
    avgSeconds: number
    mostUsedWidget: string
  }
}

export function StatsCard({ stats }: StatsCardProps) {
  const statItems = [
    {
      icon: Clock,
      label: 'Total Time',
      value: formatTime(stats.totalSeconds),
      color: 'text-blue-500'
    },
    {
      icon: TrendingUp,
      label: 'Sessions',
      value: stats.sessionCount.toString(),
      color: 'text-green-500'
    },
    {
      icon: Target,
      label: 'Avg Session',
      value: formatTime(stats.avgSeconds),
      color: 'text-purple-500'
    },
    {
      icon: Award,
      label: 'Most Used',
      value: stats.mostUsedWidget,
      color: 'text-orange-500'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label} className="py-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
