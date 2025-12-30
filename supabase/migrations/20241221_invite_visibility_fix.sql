-- Allow invited users to see the dashboard details so they can accept the invite
-- This is needed for the "Pending Invitations" list to show the dashboard name
CREATE POLICY "Invited users can view dashboard metadata" ON public.dashboards
  FOR SELECT
  USING (
    id IN (
      SELECT dashboard_id FROM public.dashboard_invites
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND status = 'pending'
    )
  );
