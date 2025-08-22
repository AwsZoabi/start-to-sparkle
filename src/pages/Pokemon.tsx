import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

interface Pokemon {
  id: number;
  name: string;
  types: { type: { name: string } }[];
  sprites: { front_default: string };
  stats: { base_stat: number; stat: { name: string } }[];
}

const Pokemon = () => {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPokemon();
  }, []);

  useEffect(() => {
    const filtered = pokemon.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.types.some(t => t.type.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredPokemon(filtered);
  }, [searchTerm, pokemon]);

  const fetchPokemon = async () => {
    try {
      // Fetch first 151 Pokemon (Kanto region)
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
      const data = await response.json();
      
      const pokemonDetails = await Promise.all(
        data.results.map(async (p: any) => {
          const detailResponse = await fetch(p.url);
          return await detailResponse.json();
        })
      );
      
      setPokemon(pokemonDetails);
      setFilteredPokemon(pokemonDetails);
    } catch (error) {
      console.error('Error fetching Pokemon:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (pokemonId: number) => {
    // Check if user can add more favorites (limit: 10)
    if (favorites.includes(pokemonId)) {
      setFavorites(prev => prev.filter(id => id !== pokemonId));
      // Remove from database logic here
    } else {
      if (favorites.length >= 10) {
        toast.error("You can only have up to 10 favorite Pokémon!");
        return;
      }
      setFavorites(prev => [...prev, pokemonId]);
      // Add to database logic here
      if (favorites.length === 9) {
        toast.info("You're approaching the favorites limit (10 Pokémon)!");
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading Pokémon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <Navigation />
      
      {/* Page Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Pokédex</h1>
              <p className="text-muted-foreground">Discover and explore Pokémon</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate("/favorites")}>
                <Heart className="h-4 w-4 mr-2" />
                Favorites ({favorites.length})
              </Button>
              <Button onClick={() => navigate("/battle")}>
                Battle Arena
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Pokémon or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      {/* Pokemon Grid */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredPokemon.map((p) => (
            <Card 
              key={p.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105"
              onClick={() => navigate(`/pokemon/${p.id}`)}
            >
              <CardHeader className="text-center pb-2">
                <div className="relative">
                  <img
                    src={p.sprites.front_default}
                    alt={p.name}
                    className="w-24 h-24 mx-auto group-hover:scale-110 transition-transform"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-0 right-0 h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(p.id);
                    }}
                  >
                    <Heart 
                      className={`h-4 w-4 ${
                        favorites.includes(p.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-muted-foreground hover:text-red-500'
                      }`} 
                    />
                  </Button>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">#{p.id.toString().padStart(3, '0')}</p>
                  <h3 className="font-semibold capitalize text-lg">{p.name}</h3>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1 justify-center mb-3">
                  {p.types.map((t) => (
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
                    <div>HP: {p.stats.find(s => s.stat.name === 'hp')?.base_stat}</div>
                    <div>ATK: {p.stats.find(s => s.stat.name === 'attack')?.base_stat}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPokemon.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No Pokémon found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Pokemon;