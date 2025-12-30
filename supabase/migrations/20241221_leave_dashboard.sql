-- Allow users to delete their own dashboard membership (leave dashboards)
DROP POLICY IF EXISTS "Users can leave dashboards" ON public.dashboard_members;
CREATE POLICY "Users can leave dashboards" ON public.dashboard_members
  FOR DELETE
  USING (user_id = auth.uid());
