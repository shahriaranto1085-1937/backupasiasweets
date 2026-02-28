
-- Add phone_number to support_tickets
ALTER TABLE public.support_tickets ADD COLUMN phone_number text;

-- Add optional image_url to ticket_messages for photo attachments
ALTER TABLE public.ticket_messages ADD COLUMN image_url text;

-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments', 'ticket-attachments', true);

-- Storage policies: authenticated users can upload
CREATE POLICY "Authenticated users can upload ticket attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments');

-- Anyone can view ticket attachments (public bucket)
CREATE POLICY "Anyone can view ticket attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'ticket-attachments');
