'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, 
  Timer, 
  MessageCircle, 
  Zap, 
  Shield, 
  Globe,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const features = [
    {
      icon: Users,
      title: 'Team Dashboards',
      description: 'Create shared workspaces for up to 4 team members with invite codes.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Timer,
      title: 'Pomodoro Timers',
      description: 'Track focused work sessions with collaborative timers visible to all members.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: MessageCircle,
      title: 'Real-time Chat',
      description: 'Stay connected with instant messaging and unread notifications.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: Shield,
      title: 'Secure Access',
      description: 'Invite-only dashboards with one-time passwords for peace of mind.',
      gradient: 'from-green-500 to-emerald-500'
    }
  ]

  const stats = [
    { value: '4', label: 'Members per dashboard' },
    { value: '∞', label: 'Dashboards you can create' },
    { value: '24/7', label: 'Real-time sync' },
    { value: '100%', label: 'Free to use' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">WeCollab</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="gap-2 group">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <div 
            className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-bounce">
              <Zap className="h-4 w-4" />
              Built for small teams who ship fast
            </div>
          </div>
          
          <h1 
            className={`text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            Collaborate.{' '}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
              Focus.
            </span>{' '}
            Ship.
          </h1>
          
          <p 
            className={`text-xl text-muted-foreground max-w-2xl mx-auto mb-10 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            The simplest way for small teams to stay focused together. 
            Shared timers, real-time chat, and collaborative dashboards — all in one place.
          </p>
          
          <div 
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 gap-2 group shadow-lg hover:shadow-xl transition-all hover:scale-105">
                Start Collaborating Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover:scale-105 transition-all">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 container mx-auto px-4 pb-20">
        <div 
          className={`grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border hover:border-primary/50 transition-all hover:scale-105 hover:shadow-lg"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 
            className={`text-3xl sm:text-4xl font-bold mb-4 transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          >
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              stay productive
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Simple, focused tools designed for teams who value getting things done together.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className={`group overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${800 + index * 150}ms` }}
            >
              <CardContent className="p-8">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Get started in{' '}
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              3 simple steps
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: '1', title: 'Create a Dashboard', desc: 'Set up your workspace in seconds' },
            { step: '2', title: 'Invite Your Team', desc: 'Share the invite code with up to 3 teammates' },
            { step: '3', title: 'Start Collaborating', desc: 'Use timers, chat, and track progress together' }
          ].map((item, index) => (
            <div 
              key={item.step}
              className={`text-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${1200 + index * 200}ms` }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 hover:scale-110 transition-transform">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div 
          className={`max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border backdrop-blur-sm transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={{ transitionDelay: '1500ms' }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to collaborate better?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join teams who are shipping faster with WeCollab. It's free to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 gap-2 group shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <Sparkles className="h-5 w-5" />
                Create Your First Dashboard
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Free forever
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              No credit card
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Set up in 30 seconds
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t bg-background/80 backdrop-blur-md mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">WeCollab</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} WeCollab. Built for teams who ship.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
