
-- Add is_admin to ticket_messages
ALTER TABLE public.ticket_messages ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Add ticket_id to notifications
ALTER TABLE public.notifications ADD COLUMN ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE;
