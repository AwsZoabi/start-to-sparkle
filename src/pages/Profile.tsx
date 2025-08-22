import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Trophy, Heart, Sword, ArrowLeft, LogOut, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  trainer_level: number;
  battles_won: number;
  battles_lost: number;
  total_battles: number;
  created_at: string;
}

interface BattleRecord {
  id: string;
  player1_pokemon: string;
  player2_pokemon: string;
  winner_id: string;
  created_at: string;
  battle_data: any;
}

interface Favorite {
  id: string;
  pokemon_name: string;
  created_at: string;
}

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [battles, setBattles] = useState<BattleRecord[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUser(user);
    await Promise.all([
      fetchProfile(user.id),
      fetchBattles(user.id),
      fetchFavorites(user.id)
    ]);
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      setNewUsername(data.username);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchBattles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('battle_records')
        .select('*')
        .eq('player1_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBattles(data || []);
    } catch (error) {
      console.error('Error fetching battles:', error);
    }
  };

  const fetchFavorites = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id, pokemon_name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const updateProfile = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile({ ...profile, username: newUsername });
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getWinRate = () => {
    if (!profile || profile.total_battles === 0) return "0.0";
    return ((profile.battles_won / profile.total_battles) * 100).toFixed(1);
  };

  const getRank = () => {
    const winRate = parseFloat(getWinRate());
    const totalBattles = profile?.total_battles || 0;
    
    if (winRate >= 80 && totalBattles >= 20) return "Champion";
    if (winRate >= 70 && totalBattles >= 15) return "Elite";
    if (winRate >= 60 && totalBattles >= 10) return "Veteran";
    if (winRate >= 50 && totalBattles >= 5) return "Trainer";
    return "Rookie";
  };

  const getRankColor = () => {
    const rank = getRank();
    switch (rank) {
      case "Champion": return "bg-gradient-to-r from-yellow-400 to-yellow-600";
      case "Elite": return "bg-gradient-to-r from-purple-400 to-purple-600";
      case "Veteran": return "bg-gradient-to-r from-blue-400 to-blue-600";
      case "Trainer": return "bg-gradient-to-r from-green-400 to-green-600";
      default: return "bg-gradient-to-r from-gray-400 to-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-lg text-muted-foreground mb-4">Profile not found</p>
            <Button onClick={() => navigate('/pokemon')}>Back to Pokemon</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/pokemon')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pokédex
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center">
                  <User className="h-8 w-8 mr-2 text-primary" />
                  Trainer Profile
                </h1>
                <p className="text-muted-foreground">Your Pokemon journey stats</p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {profile.username?.charAt(0).toUpperCase() || 'T'}
                  </AvatarFallback>
                </Avatar>
                {editing ? (
                  <div className="space-y-2">
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Username"
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={updateProfile}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center space-x-2">
                      <h2 className="text-2xl font-bold">{profile.username}</h2>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Badge className={`${getRankColor()} text-white mt-2`}>
                      {getRank()}
                    </Badge>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Trainer since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trainer Level</span>
                    <span className="font-semibold">{profile.trainer_level}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{profile.battles_won}</p>
                      <p className="text-sm text-muted-foreground">Wins</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-500">{profile.battles_lost}</p>
                      <p className="text-sm text-muted-foreground">Losses</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{getWinRate()}%</p>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{profile.total_battles}</p>
                    <p className="text-sm text-muted-foreground">Total Battles</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="battles" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="battles">Recent Battles</TabsTrigger>
                <TabsTrigger value="favorites">Favorite Pokémon</TabsTrigger>
              </TabsList>

              <TabsContent value="battles">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Sword className="h-5 w-5 mr-2" />
                      Battle History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {battles.length === 0 ? (
                      <div className="text-center py-8">
                        <Sword className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No battles yet</p>
                        <Button className="mt-4" onClick={() => navigate('/battle')}>
                          Start Your First Battle
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {battles.map((battle) => (
                          <div key={battle.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                battle.winner_id === user?.id ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <div>
                                <p className="font-medium">
                                  {battle.player1_pokemon} vs {battle.player2_pokemon}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(battle.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant={battle.winner_id === user?.id ? "default" : "destructive"}>
                              {battle.winner_id === user?.id ? "Won" : "Lost"}
                            </Badge>
                          </div>
                        ))}
                        <div className="text-center mt-4">
                          <Button variant="outline" onClick={() => navigate('/leaderboard')}>
                            View Full Leaderboard
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="favorites">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="h-5 w-5 mr-2" />
                      Favorite Pokémon
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {favorites.length === 0 ? (
                      <div className="text-center py-8">
                        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No favorites yet</p>
                        <Button className="mt-4" onClick={() => navigate('/pokemon')}>
                          Explore Pokémon
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {favorites.map((favorite) => (
                          <div key={favorite.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium capitalize">{favorite.pokemon_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Added {new Date(favorite.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Heart className="h-5 w-5 text-red-500 fill-current" />
                          </div>
                        ))}
                        <div className="text-center mt-4">
                          <Button variant="outline" onClick={() => navigate('/favorites')}>
                            View All Favorites
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <Button onClick={() => navigate('/battle')} className="h-20 flex-col">
                <Sword className="h-6 w-6 mb-2" />
                Battle Arena
              </Button>
              <Button onClick={() => navigate('/pokemon')} variant="outline" className="h-20 flex-col">
                <User className="h-6 w-6 mb-2" />
                Explore Pokémon
              </Button>
              <Button onClick={() => navigate('/leaderboard')} variant="outline" className="h-20 flex-col">
                <Trophy className="h-6 w-6 mb-2" />
                Leaderboard
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;