-- Add total_score column to profiles table for the new scoring system
-- Win = 3 points, Draw = 1 point, Loss = 0 points
ALTER TABLE public.profiles 
ADD COLUMN total_score INTEGER DEFAULT 0;

-- Update existing profiles to calculate their total score based on current wins
-- For now, we'll calculate as wins * 3 (assuming no draws yet)
UPDATE public.profiles 
SET total_score = battles_won * 3
WHERE battles_won IS NOT NULL;

-- Add index for better performance when ordering by total_score
CREATE INDEX idx_profiles_total_score ON public.profiles(total_score DESC);