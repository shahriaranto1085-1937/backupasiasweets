
-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own reviews
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete own reviews
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Admins can delete any review
CREATE POLICY "Admins can delete reviews" ON public.reviews FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
