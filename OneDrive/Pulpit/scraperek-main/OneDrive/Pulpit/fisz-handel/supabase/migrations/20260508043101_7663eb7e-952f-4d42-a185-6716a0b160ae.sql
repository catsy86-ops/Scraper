CREATE POLICY "Viewers can read own history"
ON public.listing_views
FOR SELECT
TO authenticated
USING (viewer_id = auth.uid());

CREATE POLICY "Viewers can delete own history"
ON public.listing_views
FOR DELETE
TO authenticated
USING (viewer_id = auth.uid());