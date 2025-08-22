import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sword, Trophy, Heart, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-pokemon-electric" />
            <h1 className="text-2xl font-bold text-foreground">PokéBattle Arena</h1>
          </div>
          <Button onClick={() => navigate("/auth")} variant="outline">
            Sign In
          </Button>
        </div>

        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Battle. Collect. Dominate.
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Enter the ultimate Pokémon battle arena where trainers compete for glory. 
            Build your team, master your strategy, and climb the leaderboards!
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Sword className="h-4 w-4 mr-2" />
              Real-time Battles
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Trophy className="h-4 w-4 mr-2" />
              Global Leaderboard
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Heart className="h-4 w-4 mr-2" />
              Collect Favorites
            </Badge>
          </div>
          <Button size="lg" className="mr-4" onClick={() => navigate("/auth")}>
            Start Your Journey
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/pokemon")}>
            Explore Pokémon
          </Button>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Arena Features</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Sword className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Battle Arena</CardTitle>
              <CardDescription>
                Challenge other trainers in intense Pokémon battles with strategic gameplay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Real-time battle system</li>
                <li>• Type effectiveness mechanics</li>
                <li>• Tournament mode</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Heart className="h-12 w-12 text-destructive mb-4" />
              <CardTitle>Pokémon Collection</CardTitle>
              <CardDescription>
                Discover, learn about, and collect your favorite Pokémon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Complete Pokédex</li>
                <li>• Detailed stats & info</li>
                <li>• Personal favorites list</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Trophy className="h-12 w-12 text-secondary mb-4" />
              <CardTitle>Leaderboards</CardTitle>
              <CardDescription>
                Compete with trainers worldwide and climb the rankings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Global rankings</li>
                <li>• Battle statistics</li>
                <li>• Achievement system</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 py-16 mt-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Become a Champion?</h3>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of trainers in the ultimate Pokémon battle experience
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Create Account
          </Button>
        </div>
      </section>

      {/* Credits Section */}
      <footer className="py-8 border-t border-border/40">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">Developed by</p>
          <div className="flex justify-center items-center gap-8 text-sm">
            <div>
              <span className="font-medium">Aws Zoabi</span>
              <span className="text-muted-foreground ml-2">ID: 214537383</span>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div>
              <span className="font-medium">Tamer Khatib</span>
              <span className="text-muted-foreground ml-2">ID: 314742958</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;