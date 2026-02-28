
-- Make notification insert more restrictive: only allow if user is ticket owner or admin
DROP POLICY "Authenticated can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert notifications for ticket participants"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = ticket_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);
