-- Create dashboard_invites table
CREATE TABLE IF NOT EXISTS public.dashboard_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(dashboard_id, email)
);

-- Enable RLS
ALTER TABLE public.dashboard_invites ENABLE ROW LEVEL SECURITY;

-- Policies
-- Owner of the dashboard can manage invites
CREATE POLICY "Dashboard owners can manage invites" ON public.dashboard_invites
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboards
      WHERE id = dashboard_invites.dashboard_id
      AND owner_id = auth.uid()
    )
  );

-- Users can see invites sent to their email
CREATE POLICY "Users can see their own invites" ON public.dashboard_invites
  FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
