import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, ArrowLeft, Sword, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { type: { name: string } }[];
  sprites: { 
    front_default: string;
    front_shiny: string;
    other: {
      'official-artwork': { front_default: string };
    };
  };
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  species: { url: string };
}

interface Species {
  flavor_text_entries: { flavor_text: string; language: { name: string } }[];
  genera: { genus: string; language: { name: string } }[];
}

const PokemonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [species, setSpecies] = useState<Species | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user && id) {
        checkFavoriteStatus(user.id, parseInt(id));
      }
    });

    if (id) {
      fetchPokemon(parseInt(id));
      fetchYouTubeVideos(id);
    }
  }, [id]);

  const fetchPokemon = async (pokemonId: number) => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
      const pokemonData = await response.json();
      setPokemon(pokemonData);

      const speciesResponse = await fetch(pokemonData.species.url);
      const speciesData = await speciesResponse.json();
      setSpecies(speciesData);
    } catch (error) {
      console.error('Error fetching Pokemon:', error);
      toast.error('Failed to load Pokémon data');
    } finally {
      setLoading(false);
    }
  };

  const fetchYouTubeVideos = async (pokemonId: string) => {
    try {
      // Using a mock search since YouTube API requires API key
      // In a real implementation, you would use: 
      // const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=pokemon+${pokemon.name}+battle&type=video&maxResults=3&key=${API_KEY}`);
      
      // For demo purposes, showing sample Pokemon-related videos
      const sampleVideos = [
        {
          id: { videoId: "rg6CiPI6h2g" },
          snippet: {
            title: `${pokemon?.name || 'Pokemon'} Battle Compilation`,
            description: `Amazing battles featuring ${pokemon?.name || 'Pokemon'}`,
            thumbnails: { medium: { url: "https://i.ytimg.com/vi/rg6CiPI6h2g/mqdefault.jpg" } }
          }
        },
        {
          id: { videoId: "D0zYJ1RQ-fs" },
          snippet: {
            title: `${pokemon?.name || 'Pokemon'} Movie Scenes`,
            description: `Best movie moments with ${pokemon?.name || 'Pokemon'}`,
            thumbnails: { medium: { url: "https://i.ytimg.com/vi/D0zYJ1RQ-fs/mqdefault.jpg" } }
          }
        },
        {
          id: { videoId: "fCkeLBGSINs" },
          snippet: {
            title: `${pokemon?.name || 'Pokemon'} Evolution Guide`,
            description: `Complete evolution guide for ${pokemon?.name || 'Pokemon'}`,
            thumbnails: { medium: { url: "https://i.ytimg.com/vi/fCkeLBGSINs/mqdefault.jpg" } }
          }
        }
      ];
      
      setVideos(sampleVideos);
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
    }
  };

  const checkFavoriteStatus = async (userId: string, pokemonId: number) => {
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('pokemon_id', pokemonId)
        .maybeSingle();
      
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !pokemon) {
      toast.error('Please sign in to add favorites');
      navigate('/auth');
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('pokemon_id', pokemon.id);
        
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            pokemon_id: pokemon.id,
            pokemon_name: pokemon.name
          });
        
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
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

  const getStatName = (stat: string) => {
    const names: Record<string, string> = {
      'hp': 'HP',
      'attack': 'Attack',
      'defense': 'Defense',
      'special-attack': 'Sp. Attack',
      'special-defense': 'Sp. Defense',
      'speed': 'Speed'
    };
    return names[stat] || stat;
  };

  const getStatColor = (value: number) => {
    if (value >= 100) return "bg-green-500";
    if (value >= 80) return "bg-blue-500";
    if (value >= 60) return "bg-yellow-500";
    if (value >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading Pokémon details...</p>
        </div>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Pokémon not found</p>
          <Button onClick={() => navigate('/pokemon')} className="mt-4">
            Back to Pokédex
          </Button>
        </div>
      </div>
    );
  }

  const flavorText = species?.flavor_text_entries
    .find(entry => entry.language.name === 'en')?.flavor_text
    .replace(/\f/g, ' ') || '';

  const genus = species?.genera
    .find(entry => entry.language.name === 'en')?.genus || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/pokemon')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pokédex
            </Button>
            <div className="flex space-x-2">
              <Button
                variant={isFavorite ? "default" : "outline"}
                onClick={toggleFavorite}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'Favorited' : 'Add to Favorites'}
              </Button>
              <Button onClick={() => navigate('/battle')}>
                <Sword className="h-4 w-4 mr-2" />
                Battle with {pokemon.name}
              </Button>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Pokemon Image and Basic Info */}
          <Card>
            <CardHeader className="text-center">
              <div className="text-sm text-muted-foreground">
                #{pokemon.id.toString().padStart(3, '0')}
              </div>
              <CardTitle className="text-3xl capitalize">{pokemon.name}</CardTitle>
              <p className="text-muted-foreground">{genus}</p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="relative mb-6">
                <img
                  src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}
                  alt={pokemon.name}
                  className="w-64 h-64 mx-auto"
                />
              </div>
              
              <div className="flex justify-center gap-2 mb-6">
                {pokemon.types.map((t) => (
                  <Badge 
                    key={t.type.name} 
                    className={`${getTypeColor(t.type.name)} text-white px-4 py-2`}
                  >
                    {t.type.name}
                  </Badge>
                ))}
              </div>

              <p className="text-muted-foreground mb-6">{flavorText}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">Height</p>
                  <p>{(pokemon.height / 10).toFixed(1)} m</p>
                </div>
                <div>
                  <p className="font-semibold">Weight</p>
                  <p>{(pokemon.weight / 10).toFixed(1)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats and Abilities */}
          <div className="space-y-6">
            {/* Base Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Base Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pokemon.stats.map((stat) => (
                    <div key={stat.stat.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{getStatName(stat.stat.name)}</span>
                        <span className="font-bold">{stat.base_stat}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getStatColor(stat.base_stat)}`}
                          style={{ width: `${Math.min((stat.base_stat / 150) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Abilities */}
            <Card>
              <CardHeader>
                <CardTitle>Abilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pokemon.abilities.map((ability, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="capitalize font-medium">
                        {ability.ability.name.replace('-', ' ')}
                      </span>
                      {ability.is_hidden && (
                        <Badge variant="secondary" className="text-xs">
                          Hidden
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* YouTube Videos Section */}
        {videos.length > 0 && (
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="h-5 w-5 mr-2 text-red-500" />
                  Related Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {videos.map((video, index) => (
                    <div key={index} className="group cursor-pointer">
                      <div 
                        className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-muted hover:shadow-lg transition-shadow"
                        onClick={() => window.open(`https://youtube.com/watch?v=${video.id.videoId}`, '_blank')}
                      >
                        <img
                          src={video.snippet.thumbnails.medium.url}
                          alt={video.snippet.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-red-600 text-white rounded-full p-3 group-hover:scale-110 transition-transform">
                            <Play className="h-6 w-6 ml-1" />
                          </div>
                        </div>
                      </div>
                      <h3 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {video.snippet.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {video.snippet.description}
                      </p>
                    </div>
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

export default PokemonDetail;