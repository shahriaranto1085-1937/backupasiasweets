
-- Support tickets table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'solved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can create tickets
CREATE POLICY "Users can create tickets"
ON public.support_tickets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users and admins can update ticket status
CREATE POLICY "Users can update own tickets"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all tickets"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Ticket messages table
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages on their own tickets
CREATE POLICY "Users can view own ticket messages"
ON public.ticket_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = ticket_id AND user_id = auth.uid()
  )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.ticket_messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert messages on their own tickets
CREATE POLICY "Users can send messages on own tickets"
ON public.ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = ticket_id AND user_id = auth.uid()
  )
);

-- Admins can insert messages on any ticket
CREATE POLICY "Admins can send messages"
ON public.ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  public.has_role(auth.uid(), 'admin')
);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow system inserts (any authenticated user can create notifications for others via triggers)
CREATE POLICY "Authenticated can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger to update support_tickets.updated_at
CREATE OR REPLACE FUNCTION public.update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_ticket_updated_at();

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
