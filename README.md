# WeCollab - Collaborative Interview Prep & Upskilling

A real-time collaboration platform for interview preparation and skill development with shared dashboards, timer tracking, and integrated chat.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Database & Auth**: Supabase
- **State Management**: Tanstack Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Package Manager**: Bun
- **Deployment**: Vercel

## Getting Started

### 1. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Project Settings** → **API**
3. Copy your **Project URL** and **anon public** key
4. Go to **SQL Editor** and run the migration file:
   - Copy contents of `supabase/migrations/20241221_initial_schema.sql`
   - Paste and execute in SQL Editor
5. Go to **Authentication** → **Providers** and enable:
   - Email (with email confirmation)
   - Phone (optional, requires Twilio setup)
   - Google OAuth
   - GitHub OAuth
   - LinkedIn OAuth

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: Supabase now uses **Publishable Keys** (`sb_publishable_...`) instead of the legacy anon key. This is the recommended approach for all new projects.

> [!TIP]
> **Secret Key (Optional)**
> 
> You don't need the Secret Key (`sb_secret_...`) for basic app functionality. It's only required for:
> - Server-side admin operations that bypass RLS
> - Bulk data operations
> - Advanced cron jobs
> 
> If needed later, add: `SUPABASE_SECRET_KEY=sb_secret_your-key-here`

### 3. Install Dependencies

```bash
bun install
```

### 4. Run Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
wecollab/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (dashboard)/       # Dashboard routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── auth/              # Auth components
│   ├── dashboard/         # Dashboard components
│   ├── timer/             # Timer widgets
│   └── chat/              # Chat components
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── api/               # API functions
├── types/                 # TypeScript types
└── supabase/
    └── migrations/        # Database migrations
```

## Features

- ✅ Multi-provider authentication (Email, Phone, Google, GitHub, LinkedIn)
- ✅ Create and manage collaborative dashboards
- ✅ Share dashboards with unique invite links and OTP
- ✅ Real-time timer tracking (System Design, Leetcode, Behavioral, Job Applications)
- ✅ Multi-user timer synchronization
- ✅ Integrated chat for each dashboard
- ✅ Daily timer reset and history tracking
- ✅ Data visualization with charts
- ✅ Responsive design (mobile, tablet, desktop)

## Database Schema

See `supabase/migrations/20241221_initial_schema.sql` for the complete schema including:
- User profiles
- Dashboards and members
- Timer widgets and sessions
- Chat messages
- Row Level Security (RLS) policies

## Development

### Adding UI Components

```bash
bunx shadcn@latest add [component-name]
```

### Type Generation

After updating Supabase schema, regenerate types:

```bash
npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
```

## Deployment

### Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

```bash
NEXT_PUBLIC_SUPABASE_URL=your-production-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-production-publishable-key
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional: Only if you need server-side admin operations
# SUPABASE_SECRET_KEY=sb_secret_your-production-key
```

## License

MIT
