import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Favorite {
  id: string;
  pokemon_id: number;
  pokemon_name: string;
  created_at: string;
}

interface PokemonData {
  id: number;
  name: string;
  types: { type: { name: string } }[];
  sprites: { front_default: string };
  stats: { base_stat: number; stat: { name: string } }[];
}

const Favorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [pokemonData, setPokemonData] = useState<Record<number, PokemonData>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
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
    fetchFavorites(user.id);
  };

  const fetchFavorites = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFavorites(data || []);
      
      // Fetch Pokemon data for each favorite
      const pokemonPromises = (data || []).map(async (fav) => {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${fav.pokemon_id}`);
          const pokemonData = await response.json();
          return { id: fav.pokemon_id, data: pokemonData };
        } catch (error) {
          console.error(`Error fetching Pokemon ${fav.pokemon_id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(pokemonPromises);
      const pokemonMap: Record<number, PokemonData> = {};
      results.forEach((result) => {
        if (result) {
          pokemonMap[result.id] = result.data;
        }
      });
      
      setPokemonData(pokemonMap);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string, pokemonId: number) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove favorite');
    }
  };

  const exportToCSV = () => {
    if (favorites.length === 0) {
      toast.error('No favorites to export');
      return;
    }

    const csvContent = [
      ['Pokemon ID', 'Pokemon Name', 'Types', 'HP', 'Attack', 'Defense', 'Date Added'],
      ...favorites.map(fav => {
        const pokemon = pokemonData[fav.pokemon_id];
        if (!pokemon) return [fav.pokemon_id, fav.pokemon_name, '', '', '', '', fav.created_at];
        
        const types = pokemon.types.map(t => t.type.name).join('/');
        const hp = pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || '';
        const attack = pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || '';
        const defense = pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || '';
        
        return [
          fav.pokemon_id,
          fav.pokemon_name,
          types,
          hp,
          attack,
          defense,
          new Date(fav.created_at).toLocaleDateString()
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pokemon-favorites.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Favorites exported to CSV');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading favorites...</p>
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
              <Button variant="ghost" onClick={() => navigate('/pokemon')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pokédex
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Favorites</h1>
                <p className="text-muted-foreground">{favorites.length} Pokémon saved</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {favorites.length > 0 && (
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
              <Button onClick={() => navigate('/battle')}>
                Battle Arena
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">
              Start exploring Pokémon and add your favorites to see them here!
            </p>
            <Button onClick={() => navigate('/pokemon')}>
              Explore Pokédex
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {favorites.map((favorite) => {
              const pokemon = pokemonData[favorite.pokemon_id];
              return (
                <Card 
                  key={favorite.id} 
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105"
                  onClick={() => navigate(`/pokemon/${favorite.pokemon_id}`)}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="relative">
                      {pokemon ? (
                        <img
                          src={pokemon.sprites.front_default}
                          alt={favorite.pokemon_name}
                          className="w-24 h-24 mx-auto group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="w-24 h-24 mx-auto bg-muted rounded-lg flex items-center justify-center">
                          <Heart className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-0 right-0 h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite(favorite.id, favorite.pokemon_id);
                        }}
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        #{favorite.pokemon_id.toString().padStart(3, '0')}
                      </p>
                      <h3 className="font-semibold capitalize text-lg">{favorite.pokemon_name}</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {pokemon && (
                      <>
                        <div className="flex flex-wrap gap-1 justify-center mb-3">
                          {pokemon.types.map((t) => (
                            <Badge 
                              key={t.type.name} 
                              className={`${getTypeColor(t.type.name)} text-white text-xs px-2 py-1`}
                            >
                              {t.type.name}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          <div className="grid grid-cols-2 gap-1">
                            <div>HP: {pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat}</div>
                            <div>ATK: {pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat}</div>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="text-xs text-muted-foreground text-center mt-2">
                      Added {new Date(favorite.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Favorites;