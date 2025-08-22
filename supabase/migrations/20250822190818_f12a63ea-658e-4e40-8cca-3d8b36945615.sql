-- Create battle rooms table for real-time PvP
CREATE TABLE public.battle_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  player1_id UUID NOT NULL,
  player2_id UUID,
  player1_pokemon_id INTEGER,
  player2_pokemon_id INTEGER,
  player1_pokemon_name TEXT,
  player2_pokemon_name TEXT,
  player1_hp INTEGER DEFAULT 100,
  player2_hp INTEGER DEFAULT 100,
  player1_max_hp INTEGER DEFAULT 100,
  player2_max_hp INTEGER DEFAULT 100,
  current_turn UUID,
  battle_log JSONB DEFAULT '[]',
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'selecting', 'battling', 'finished')),
  winner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.battle_rooms ENABLE ROW LEVEL SECURITY;

-- Create policies for battle rooms
CREATE POLICY "Users can view battle rooms they're part of" 
ON public.battle_rooms 
FOR SELECT 
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can create battle rooms" 
ON public.battle_rooms 
FOR INSERT 
WITH CHECK (auth.uid() = player1_id);

CREATE POLICY "Players can update their battle rooms" 
ON public.battle_rooms 
FOR UPDATE 
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Add trigger for updated_at
CREATE TRIGGER update_battle_rooms_updated_at
BEFORE UPDATE ON public.battle_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for battle rooms
ALTER TABLE public.battle_rooms REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_rooms;