import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Crown, ArrowLeft, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  id: string;
  username: string;
  battles_won: number;
  battles_lost: number;
  total_battles: number;
  trainer_level: number;
  avatar_url?: string;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .gt('total_battles', 0)
        .order('battles_won', { ascending: false })
        .order('total_battles', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWinRate = (won: number, total: number) => {
    return total > 0 ? ((won / total) * 100).toFixed(1) : '0.0';
  };

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (position === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (position === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return <Trophy className="h-5 w-5 text-muted-foreground" />;
  };

  const getRankBadge = (position: number) => {
    if (position === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
    if (position === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
    if (position === 3) return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
    return "bg-muted text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading leaderboard...</p>
        </div>
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
              <Button variant="ghost" onClick={() => navigate('/battle')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Battle
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center">
                  <Trophy className="h-8 w-8 mr-2 text-primary" />
                  Leaderboard
                </h1>
                <p className="text-muted-foreground">Top trainers in the arena</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate('/profile')}>
                My Profile
              </Button>
              <Button onClick={() => navigate('/battle')}>
                Join Battle
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {leaderboard.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No battles yet</h2>
            <p className="text-muted-foreground mb-6">
              Be the first trainer to battle and claim your spot on the leaderboard!
            </p>
            <Button onClick={() => navigate('/battle')}>
              Start Battling
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 */}
            {leaderboard.slice(0, 3).length > 0 && (
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {leaderboard.slice(0, 3).map((trainer, index) => (
                  <Card key={trainer.id} className={`relative overflow-hidden ${
                    index === 0 ? 'ring-2 ring-yellow-400 shadow-lg' : ''
                  }`}>
                    <CardHeader className="text-center pb-2">
                      <div className="flex justify-center mb-2">
                        {getRankIcon(index + 1)}
                      </div>
                      <Badge className={getRankBadge(index + 1)}>
                        #{index + 1}
                      </Badge>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Avatar className="w-16 h-16 mx-auto mb-3">
                        <AvatarImage src={trainer.avatar_url} />
                        <AvatarFallback>
                          {trainer.username?.charAt(0).toUpperCase() || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-lg mb-2">{trainer.username}</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Wins</p>
                          <p className="font-semibold text-green-600">{trainer.battles_won}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Win Rate</p>
                          <p className="font-semibold">{getWinRate(trainer.battles_won, trainer.total_battles)}%</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          Level {trainer.trainer_level} • {trainer.total_battles} battles
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Rest of leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>All Trainers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((trainer, index) => (
                    <div 
                      key={trainer.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
                        index < 3 ? 'bg-muted/30' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8">
                          {index < 3 ? (
                            getRankIcon(index + 1)
                          ) : (
                            <span className="text-sm font-semibold text-muted-foreground">
                              #{index + 1}
                            </span>
                          )}
                        </div>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={trainer.avatar_url} />
                          <AvatarFallback>
                            {trainer.username?.charAt(0).toUpperCase() || 'T'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{trainer.username}</p>
                          <p className="text-xs text-muted-foreground">
                            Level {trainer.trainer_level}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-green-600">{trainer.battles_won}</p>
                          <p className="text-xs text-muted-foreground">Wins</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-red-500">{trainer.battles_lost}</p>
                          <p className="text-xs text-muted-foreground">Losses</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{getWinRate(trainer.battles_won, trainer.total_battles)}%</p>
                          <p className="text-xs text-muted-foreground">Win Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{trainer.total_battles}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold">Total Trainers</h3>
                  <p className="text-2xl font-bold text-primary">{leaderboard.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Trophy className="h-8 w-8 text-secondary mx-auto mb-2" />
                  <h3 className="font-semibold">Total Battles</h3>
                  <p className="text-2xl font-bold text-secondary">
                    {leaderboard.reduce((sum, trainer) => sum + trainer.total_battles, 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Crown className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="font-semibold">Most Wins</h3>
                  <p className="text-2xl font-bold text-accent">
                    {leaderboard[0]?.battles_won || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;