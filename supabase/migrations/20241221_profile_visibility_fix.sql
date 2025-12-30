-- Allow users to view profiles of people they share a dashboard with
CREATE POLICY "Users can view profiles of dashboard teammates" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboard_members dm1
      JOIN public.dashboard_members dm2 ON dm1.dashboard_id = dm2.dashboard_id
      WHERE dm1.user_id = auth.uid()
      AND dm2.user_id = profiles.id
    )
    OR
    EXISTS (
      SELECT 1 FROM public.dashboards d
      JOIN public.dashboard_members dm ON d.id = dm.dashboard_id
      WHERE (d.owner_id = auth.uid() AND dm.user_id = profiles.id)
      OR (dm.user_id = auth.uid() AND d.owner_id = profiles.id)
    )
  );
