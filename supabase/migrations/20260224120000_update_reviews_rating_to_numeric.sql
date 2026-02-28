-- Allow half-star ratings (e.g., 3.5, 4.5) for reviews.rating

ALTER TABLE public.reviews
  ALTER COLUMN rating TYPE numeric(2,1)
  USING rating::numeric(2,1);

-- Replace old integer check constraint with a half-step constraint
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_rating_check;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_rating_check
  CHECK (
    rating >= 0.5
    AND rating <= 5
    AND (rating * 2) = floor(rating * 2)
  );
