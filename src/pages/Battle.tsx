import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sword, Shield, Zap, Heart, Trophy, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

interface Pokemon {
  id: number;
  name: string;
  types: { type: { name: string } }[];
  sprites: { front_default: string };
  stats: { base_stat: number; stat: { name: string } }[];
}

interface BattleState {
  playerPokemon: Pokemon | null;
  opponentPokemon: Pokemon | null;
  playerHP: number;
  opponentHP: number;
  playerMaxHP: number;
  opponentMaxHP: number;
  battleLog: string[];
  gameOver: boolean;
  winner: 'player' | 'opponent' | null;
  turn: 'player' | 'opponent';
}

const Battle = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [availablePokemon, setAvailablePokemon] = useState<Pokemon[]>([]);
  const [userFavorites, setUserFavorites] = useState<Pokemon[]>([]);
  const [selectedPokemonId, setSelectedPokemonId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [battleState, setBattleState] = useState<BattleState>({
    playerPokemon: null,
    opponentPokemon: null,
    playerHP: 100,
    opponentHP: 100,
    playerMaxHP: 100,
    opponentMaxHP: 100,
    battleLog: [],
    gameOver: false,
    winner: null,
    turn: 'player'
  });

  useEffect(() => {
    checkAuth();
    fetchPokemon();
    fetchUserFavorites();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUser(user);
  };

  const fetchPokemon = async () => {
    try {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=50');
      const data = await response.json();
      
      const pokemonDetails = await Promise.all(
        data.results.slice(0, 20).map(async (p: any) => {
          const detailResponse = await fetch(p.url);
          return await detailResponse.json();
        })
      );
      
      setAvailablePokemon(pokemonDetails);
    } catch (error) {
      console.error('Error fetching Pokemon:', error);
    }
  };

  const fetchUserFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('pokemon_id, pokemon_name')
        .eq('user_id', user.id);

      if (favoritesData && favoritesData.length > 0) {
        const favoritesPokemon = await Promise.all(
          favoritesData.map(async (fav) => {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${fav.pokemon_id}`);
            return await response.json();
          })
        );
        setUserFavorites(favoritesPokemon);
      }
    } catch (error) {
      console.error('Error fetching user favorites:', error);
    }
  };

  const startBattle = async () => {
    if (!selectedPokemonId) {
      toast.error('Please select a Pokémon first!');
      return;
    }

    setLoading(true);
    
    // Show countdown
    setShowCountdown(true);
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setShowCountdown(false);
          executeBattle();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executeBattle = () => {
    const pokemonList = userFavorites.length > 0 ? userFavorites : availablePokemon;
    const playerPokemon = pokemonList.find(p => p.id.toString() === selectedPokemonId);
    const randomOpponent = availablePokemon[Math.floor(Math.random() * availablePokemon.length)];

    if (!playerPokemon) return;

    const playerMaxHP = playerPokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 100;
    const opponentMaxHP = randomOpponent.stats.find(s => s.stat.name === 'hp')?.base_stat || 100;

    setBattleState({
      playerPokemon,
      opponentPokemon: randomOpponent,
      playerHP: playerMaxHP,
      opponentHP: opponentMaxHP,
      playerMaxHP,
      opponentMaxHP,
      battleLog: [`${playerPokemon.name} vs ${randomOpponent.name} - Battle begins!`],
      gameOver: false,
      winner: null,
      turn: 'player'
    });
    setLoading(false);
  };

  const calculateDamage = (attacker: Pokemon, defender: Pokemon): number => {
    const attack = attacker.stats.find(s => s.stat.name === 'attack')?.base_stat || 50;
    const defense = defender.stats.find(s => s.stat.name === 'defense')?.base_stat || 50;
    const baseDamage = Math.floor((attack / defense) * 20);
    const randomFactor = Math.random() * 0.4 + 0.8; // 80% to 120%
    return Math.max(Math.floor(baseDamage * randomFactor), 5);
  };

  const performAttack = () => {
    if (battleState.gameOver || battleState.turn !== 'player') return;

    const damage = calculateDamage(battleState.playerPokemon!, battleState.opponentPokemon!);
    const newOpponentHP = Math.max(0, battleState.opponentHP - damage);
    
    const newLog = [
      ...battleState.battleLog,
      `${battleState.playerPokemon!.name} attacks for ${damage} damage!`
    ];

    if (newOpponentHP === 0) {
      setBattleState(prev => ({
        ...prev,
        opponentHP: newOpponentHP,
        battleLog: [...newLog, `${prev.opponentPokemon!.name} fainted! You win!`],
        gameOver: true,
        winner: 'player'
      }));
      saveBattleResult(true);
    } else {
      setBattleState(prev => ({
        ...prev,
        opponentHP: newOpponentHP,
        battleLog: newLog,
        turn: 'opponent'
      }));
      
      // Opponent attacks after a delay
      setTimeout(opponentAttack, 1500);
    }
  };

  const opponentAttack = () => {
    if (battleState.gameOver) return;

    const damage = calculateDamage(battleState.opponentPokemon!, battleState.playerPokemon!);
    const newPlayerHP = Math.max(0, battleState.playerHP - damage);
    
    const newLog = [
      ...battleState.battleLog,
      `${battleState.opponentPokemon!.name} attacks for ${damage} damage!`
    ];

    if (newPlayerHP === 0) {
      setBattleState(prev => ({
        ...prev,
        playerHP: newPlayerHP,
        battleLog: [...newLog, `${prev.playerPokemon!.name} fainted! You lose!`],
        gameOver: true,
        winner: 'opponent'
      }));
      saveBattleResult(false);
    } else {
      setBattleState(prev => ({
        ...prev,
        playerHP: newPlayerHP,
        battleLog: newLog,
        turn: 'player'
      }));
    }
  };

  const saveBattleResult = async (won: boolean) => {
    if (!user || !battleState.playerPokemon || !battleState.opponentPokemon) return;

    try {
      await supabase.from('battle_records').insert({
        player1_id: user.id,
        player2_id: user.id, // For now, battles are against AI
        winner_id: won ? user.id : null,
        player1_pokemon: battleState.playerPokemon.name,
        player2_pokemon: battleState.opponentPokemon.name,
        battle_data: {
          playerHP: battleState.playerHP,
          opponentHP: battleState.opponentHP,
          winner: won ? 'player' : 'opponent'
        }
      });

      // Update profile stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('battles_won, battles_lost, total_battles')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            battles_won: profile.battles_won + (won ? 1 : 0),
            battles_lost: profile.battles_lost + (won ? 0 : 1),
            total_battles: profile.total_battles + 1
          })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error saving battle result:', error);
    }
  };

  const resetBattle = () => {
    setBattleState({
      playerPokemon: null,
      opponentPokemon: null,
      playerHP: 100,
      opponentHP: 100,
      playerMaxHP: 100,
      opponentMaxHP: 100,
      battleLog: [],
      gameOver: false,
      winner: null,
      turn: 'player'
    });
    setSelectedPokemonId("");
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      normal: "bg-gray-400",
      fire: "bg-red-500",
      water: "bg-blue-500", 
      electric: "bg-yellow-400",
      grass: "bg-green-500",
      ice: "bg-blue-200",
      fighting: "bg-red-700",
      poison: "bg-purple-500",
      ground: "bg-yellow-600",
      flying: "bg-indigo-400",
      psychic: "bg-pink-500",
      bug: "bg-green-400",
      rock: "bg-yellow-800",
      ghost: "bg-purple-700",
      dragon: "bg-indigo-700",
      dark: "bg-gray-800",
      steel: "bg-gray-500",
      fairy: "bg-pink-300"
    };
    return colors[type] || "bg-gray-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Action Buttons Section */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center pb-2">
              <Sword className="h-8 w-8 mx-auto text-primary group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Battle vs Bot</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-3">Fight against AI opponent</p>
              <Button 
                className="w-full" 
                onClick={() => {/* Current battle logic */}}
                disabled={!!battleState.playerPokemon}
              >
                Start Bot Battle
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center pb-2">
              <Zap className="h-8 w-8 mx-auto text-secondary group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Random PvP</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-3">Fight random player</p>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => toast.info("PvP battles coming soon!")}
              >
                Find Player
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center pb-2">
              <Shield className="h-8 w-8 mx-auto text-accent group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Battle History</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-3">View past battles</p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/profile')}
              >
                View History
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center pb-2">
              <Trophy className="h-8 w-8 mx-auto text-warning group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-3">Player rankings</p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/leaderboard')}
              >
                View Rankings
              </Button>
            </CardContent>
          </Card>
        </div>
        {!battleState.playerPokemon ? (
          // Pokemon Selection
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Choose Your Fighter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {userFavorites.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-center">Choose from Your Favorites</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {userFavorites.map((pokemon) => (
                        <div
                          key={pokemon.id}
                          className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg ${
                            selectedPokemonId === pokemon.id.toString()
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedPokemonId(pokemon.id.toString())}
                        >
                          <img 
                            src={pokemon.sprites.front_default}
                            alt={pokemon.name}
                            className="w-16 h-16 mx-auto mb-2"
                          />
                          <p className="text-sm font-medium capitalize text-center">{pokemon.name}</p>
                          <div className="flex justify-center gap-1 mt-2">
                            {pokemon.types.map((t) => (
                              <Badge 
                                key={t.type.name} 
                                className={`${getTypeColor(t.type.name)} text-white text-xs`}
                              >
                                {t.type.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-center text-muted-foreground mb-4">
                      No favorites found. Choose from available Pokémon:
                    </p>
                    <Select value={selectedPokemonId} onValueChange={setSelectedPokemonId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Pokémon" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePokemon.map((pokemon) => (
                          <SelectItem key={pokemon.id} value={pokemon.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <img 
                                src={pokemon.sprites.front_default} 
                                alt={pokemon.name}
                                className="w-8 h-8"
                              />
                              <span className="capitalize">{pokemon.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedPokemonId && (
                  <div className="text-center">
                    {(() => {
                      const pokemonList = userFavorites.length > 0 ? userFavorites : availablePokemon;
                      const selectedPokemon = pokemonList.find(p => p.id.toString() === selectedPokemonId);
                      return selectedPokemon ? (
                        <div>
                          <img 
                            src={selectedPokemon.sprites.front_default}
                            alt={selectedPokemon.name}
                            className="w-32 h-32 mx-auto mb-4"
                          />
                          <h3 className="text-xl font-semibold capitalize mb-2">{selectedPokemon.name}</h3>
                          <div className="flex justify-center gap-2 mb-4">
                            {selectedPokemon.types.map((t) => (
                              <Badge 
                                key={t.type.name} 
                                className={`${getTypeColor(t.type.name)} text-white`}
                              >
                                {t.type.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {showCountdown && (
                  <div className="text-center py-8">
                    <div className="text-6xl font-bold text-primary animate-pulse">
                      {countdown}
                    </div>
                    <p className="text-lg text-muted-foreground mt-2">Battle starting...</p>
                  </div>
                )}

                {!showCountdown && (
                  <Button 
                    onClick={startBattle} 
                    disabled={!selectedPokemonId || loading}
                    className="w-full"
                  >
                    {loading ? 'Finding Opponent...' : 'Start Battle!'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Battle Interface
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Player Pokemon */}
            <Card className={`${battleState.gameOver && battleState.winner === 'player' ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
              <CardHeader>
                <CardTitle className={`text-center ${battleState.gameOver && battleState.winner === 'player' ? 'text-green-600' : 'text-blue-600'}`}>
                  Your Pokémon {battleState.gameOver && battleState.winner === 'player' ? '🏆' : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <img 
                  src={battleState.playerPokemon.sprites.front_default}
                  alt={battleState.playerPokemon.name}
                  className="w-32 h-32 mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold capitalize mb-2">
                  {battleState.playerPokemon.name}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>HP</span>
                    <span>{battleState.playerHP}/{battleState.playerMaxHP}</span>
                  </div>
                  <Progress 
                    value={(battleState.playerHP / battleState.playerMaxHP) * 100} 
                    className="h-3"
                  />
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  {battleState.playerPokemon.types.map((t) => (
                    <Badge 
                      key={t.type.name} 
                      className={`${getTypeColor(t.type.name)} text-white text-xs`}
                    >
                      {t.type.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Battle Log */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Battle Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {battleState.battleLog.map((log, index) => (
                    <p key={index} className="text-sm p-2 bg-muted rounded">
                      {log}
                    </p>
                  ))}
                </div>
                
                <div className="mt-4 space-y-2">
                  {!battleState.gameOver ? (
                    <div className="space-y-2">
                      <Button 
                        onClick={performAttack}
                        disabled={battleState.turn !== 'player'}
                        className="w-full"
                      >
                        <Sword className="h-4 w-4 mr-2" />
                        Attack
                      </Button>
                      {battleState.turn === 'opponent' && (
                        <p className="text-center text-sm text-muted-foreground">
                          Opponent is attacking...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <h3 className="text-lg font-semibold">
                          {battleState.winner === 'player' ? '🎉 Victory!' : '💀 Defeat!'}
                        </h3>
                        <p className="text-muted-foreground">
                          {battleState.winner === 'player' 
                            ? 'Congratulations! You won the battle!' 
                            : 'Better luck next time!'}
                        </p>
                      </div>
                      <Button onClick={resetBattle} className="w-full">
                        Battle Again
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Opponent Pokemon */}
            <Card className={`${battleState.gameOver && battleState.winner === 'opponent' ? 'ring-2 ring-red-500 bg-red-50' : ''}`}>
              <CardHeader>
                <CardTitle className={`text-center ${battleState.gameOver && battleState.winner === 'opponent' ? 'text-red-600' : 'text-red-600'}`}>
                  Opponent {battleState.gameOver && battleState.winner === 'opponent' ? '🏆' : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <img 
                  src={battleState.opponentPokemon.sprites.front_default}
                  alt={battleState.opponentPokemon.name}
                  className="w-32 h-32 mx-auto mb-4 scale-x-[-1]"
                />
                <h3 className="text-xl font-semibold capitalize mb-2">
                  {battleState.opponentPokemon.name}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>HP</span>
                    <span>{battleState.opponentHP}/{battleState.opponentMaxHP}</span>
                  </div>
                  <Progress 
                    value={(battleState.opponentHP / battleState.opponentMaxHP) * 100} 
                    className="h-3"
                  />
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  {battleState.opponentPokemon.types.map((t) => (
                    <Badge 
                      key={t.type.name} 
                      className={`${getTypeColor(t.type.name)} text-white text-xs`}
                    >
                      {t.type.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Battle;